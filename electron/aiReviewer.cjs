const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const REVIEWER_CONFIG = {
  targetBudgetUsd: 0.33,
  minBudgetUsd: 0.18,
  maxBudgetUsd: 2.0,
  budgetWarningRatio: 0.8,
  escalationBudgetsUsd: [0.55, 0.95, 1.4, 1.8, 2.0],
  passBudgets: {
    makeover: {
      low:      { maxBudgetUsd: 0.55, maxTurns: 18 },
      medium:   { maxBudgetUsd: 0.90, maxTurns: 26 },
      high:     { maxBudgetUsd: 1.30, maxTurns: 34 },
      critical: { maxBudgetUsd: 1.80, maxTurns: 44 },
    },
    polish: {
      low:      { maxBudgetUsd: 0.25, maxTurns: 10 },
      medium:   { maxBudgetUsd: 0.40, maxTurns: 14 },
      high:     { maxBudgetUsd: 0.65, maxTurns: 20 },
      critical: { maxBudgetUsd: 0.95, maxTurns: 26 },
    },
  },
};
const TIMEOUT_MS = 12 * 60 * 1000;
const FRONTEND_SKILL_PATH = path.resolve(__dirname, '..', '.agents', 'skills', 'frontend-design', 'SKILL.md');
let cachedFrontendSkill = null;

function loadFrontendDesignSkillSnippet() {
  if (cachedFrontendSkill != null) return cachedFrontendSkill;
  try {
    const raw = fs.readFileSync(FRONTEND_SKILL_PATH, 'utf8');
    const withoutFrontmatter = raw.replace(/^---[\s\S]*?---\s*/m, '');
    const lines = withoutFrontmatter
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, 60);
    cachedFrontendSkill = lines.join('\n');
    return cachedFrontendSkill;
  } catch (_) {
    cachedFrontendSkill = '';
    return '';
  }
}

function getEscalatedBudget(currentBudgetUsd) {
  for (const candidate of REVIEWER_CONFIG.escalationBudgetsUsd) {
    if (candidate > currentBudgetUsd) return candidate;
  }
  return null;
}

function deriveReviewerExecutionPlan({ tsErrors, unmappedComponents, enhancerQualityScore, reviewPass = 'makeover' }) {
  const tsErrorCount = (String(tsErrors || '').match(/error TS/g) || []).length;
  const unmappedCount = Array.isArray(unmappedComponents) ? unmappedComponents.length : 0;
  const qualityScore = Number.isFinite(enhancerQualityScore) ? Number(enhancerQualityScore) : null;

  const reasons = [];
  let complexity = 'low';
  if (tsErrorCount >= 16 || unmappedCount >= 4 || (qualityScore != null && qualityScore < 65)) {
    complexity = 'critical';
    if (tsErrorCount >= 16) reasons.push(`tsErrors=${tsErrorCount}`);
    if (unmappedCount >= 4) reasons.push(`unmapped=${unmappedCount}`);
    if (qualityScore != null && qualityScore < 65) reasons.push(`enhancerQuality=${qualityScore}`);
  } else if (tsErrorCount >= 8 || unmappedCount >= 2 || (qualityScore != null && qualityScore < 78)) {
    complexity = 'high';
    if (tsErrorCount >= 8) reasons.push(`tsErrors=${tsErrorCount}`);
    if (unmappedCount >= 2) reasons.push(`unmapped=${unmappedCount}`);
    if (qualityScore != null && qualityScore < 78) reasons.push(`enhancerQuality=${qualityScore}`);
  } else if (tsErrorCount >= 3 || unmappedCount >= 1 || (qualityScore != null && qualityScore < 86)) {
    complexity = 'medium';
    if (tsErrorCount >= 3) reasons.push(`tsErrors=${tsErrorCount}`);
    if (unmappedCount >= 1) reasons.push(`unmapped=${unmappedCount}`);
    if (qualityScore != null && qualityScore < 86) reasons.push(`enhancerQuality=${qualityScore}`);
  } else {
    reasons.push('qualityTargetMode');
  }

  const passBucket = REVIEWER_CONFIG.passBudgets[reviewPass] || REVIEWER_CONFIG.passBudgets.makeover;
  const selected = passBucket[complexity] || passBucket.low;
  const boundedBudget = Math.min(
    REVIEWER_CONFIG.maxBudgetUsd,
    Math.max(REVIEWER_CONFIG.minBudgetUsd, selected.maxBudgetUsd)
  );

  return {
    reviewPass,
    complexity,
    maxTurns: selected.maxTurns,
    maxBudgetUsd: Number(boundedBudget.toFixed(2)),
    budgetWarningUsd: Number((boundedBudget * REVIEWER_CONFIG.budgetWarningRatio).toFixed(2)),
    tsErrorCount,
    unmappedCount,
    qualityScore,
    targetBudgetUsd: REVIEWER_CONFIG.targetBudgetUsd,
    reason: reasons.join(', '),
  };
}

// ── Stream-JSON message parser ─────────────────────────────────────────────────

function formatStreamMessage(msg, executionPlan) {
  try {
    if (msg.type === 'assistant') {
      const content = msg.message?.content || [];
      for (const block of content) {
        if (block.type === 'text' && block.text?.trim()) {
          const preview = block.text.trim().slice(0, 220).replace(/\n+/g, ' ');
          return `[Reviewer] ${preview}${block.text.length > 220 ? '…' : ''}`;
        }
        if (block.type === 'tool_use') {
          const name = block.name || 'tool';
          const input = block.input || {};
          if (name === 'Bash')                    return `[Bash] ${(input.command || '').slice(0, 120)}`;
          if (name === 'Edit' || name === 'MultiEdit') return `[Edit] ${input.file_path || input.path || '?'}`;
          if (name === 'Write')                   return `[Write] ${input.file_path || '?'}`;
          if (name === 'Read')                    return `[Read] ${input.file_path || input.path || '?'}`;
          return `[${name}] ${JSON.stringify(input).slice(0, 100)}`;
        }
      }
      return null;
    }

    if (msg.type === 'result') {
      const parts = [];
      if (msg.num_turns)   parts.push(`${msg.num_turns} turns`);
      if (msg.cost_usd != null) {
        const cost = msg.cost_usd;
        const costStr = `$${cost.toFixed(4)}`;
        if (cost >= executionPlan.budgetWarningUsd) {
          parts.push(`⚠ ${costStr} (approaching $${executionPlan.maxBudgetUsd.toFixed(2)} limit)`);
        } else {
          parts.push(costStr);
        }
      }
      const status = msg.subtype === 'success' ? '✓ Complete' : `Ended (${msg.subtype})`;
      return `[Reviewer] ${status}${parts.length ? ` · ${parts.join(' · ')}` : ''}`;
    }
  } catch (_) { /* ignore parse errors */ }
  return null;
}

// ── Build the reviewer mission prompt ─────────────────────────────────────────

function buildReviewerPrompt(briefContext, executionPlan, reviewPass = 'makeover') {
  const {
    brandName, tagline, industry, aesthetic, siteType,
    callToAction, componentList = [], unmappedComponents = [], contentOverrides, pages, qaIssues = [],
  } = briefContext;

  const hasUnmapped = unmappedComponents && unmappedComponents.length > 0;
  const hasTsErrors = briefContext._tsErrors && briefContext._tsErrors.trim();
  const frontendSkill = loadFrontendDesignSkillSnippet();
  const isMakeoverPass = reviewPass === 'makeover';

  const passInstructions = isMakeoverPass
    ? [
        `PASS MODE: MAKEOVER`,
        `Treat the scaffolded project as a STARTING POINT, not a finished product.`,
        `Your job is to deliver a polished, production-grade website grounded in the client brief and the frontend-design skill.`,
        `You are EXPECTED to make substantial changes:`,
        `- Materially rewrite src/App.tsx, src/pages/*.tsx, and src/index.css to express a clear, distinctive aesthetic direction.`,
        `- Compose strong, branded sections (hero, features, social proof, CTA, footer, etc.) using the existing components in src/components/.`,
        `- Replace any placeholder or generic copy with specific, brand-true content.`,
        `- Add new sections or subcomponents inside src/ when needed to complete the experience.`,
        `Use the existing scaffold's component imports and CSS variables (--color-bg, --color-text, --color-accent, --color-primary) as the source of truth.`,
        `Run npm scripts only if necessary for verification (e.g. tsc); avoid running dev servers.`,
      ]
    : [
        `PASS MODE: POLISH`,
        `The project has just gone through a makeover pass. PRESERVE the makeover layout, sections, and aesthetic.`,
        `Your job is to fix any remaining quality gate failures and refine details:`,
        `- Resolve any reported TypeScript errors.`,
        `- Eliminate any remaining placeholder/generic copy.`,
        `- Strengthen hero/CTA copy clarity and visual hierarchy without restructuring sections.`,
        `- Improve spacing rhythm, typography hierarchy, and contrast where needed.`,
        `Do not add or remove sections in this pass; only refine.`,
      ];

  const reviewerBriefNote = `Read REVIEWER_BRIEF.md in the project root for the full brand brief, content overrides, and component contract.`;

  const pageList = pages && pages.length > 0
    ? pages.map(p => p.title || p.name || p.label || p.id).filter(Boolean).join(', ')
    : 'Single page';

  const lines = [
    `You are a Senior Frontend Engineer + Designer working on a React 19 + Vite + TypeScript project.`,
    `The project has been scaffolded by a deterministic template engine and is ready for you to elevate.`,
    ``,
    reviewerBriefNote,
    ``,
    `EXECUTION PLAN:`,
    `  Pass: ${reviewPass}`,
    `  Budget cap for this attempt: $${executionPlan.maxBudgetUsd.toFixed(2)}`,
    `  Turn cap for this attempt: ${executionPlan.maxTurns}`,
    `  Complexity: ${executionPlan.complexity}`,
    `  Reason: ${executionPlan.reason}`,
    ``,
    ...passInstructions,
    ``,
    `PROJECT SUMMARY:`,
    `  Brand: ${brandName}${tagline ? ` — "${tagline}"` : ''}`,
    `  Industry: ${industry || 'General'}`,
    `  Aesthetic: ${aesthetic} | Site type: ${siteType}`,
    `  Primary CTA: "${callToAction}"`,
    `  Pages: ${pageList}`,
    componentList.length > 0 ? `  Components available: ${componentList.join(', ')}` : '',
    ``,
    qaIssues.length > 0 ? `QUALITY GATE FAILURES TO FIX NOW:\n- ${qaIssues.join('\n- ')}` : '',
    qaIssues.length > 0 ? `` : '',
    `PRIORITY ORDER:`,
    hasUnmapped
      ? `1. Wire UNMAPPED COMPONENTS into real sections (currently rendered as placeholder divs): ${unmappedComponents.join(', ')}.\n   Read each component in src/components/ before mounting.`
      : `1. All requested ReactBits components are already mounted; use them meaningfully throughout the site.`,
    hasTsErrors
      ? `2. Fix every TypeScript error from this output:\n${(briefContext._tsErrors || '').slice(0, 1800)}`
      : `2. TypeScript was clean — keep it clean as you edit.`,
    `3. CONTENT must be specific and on-brand:`,
    `   - Brand: ${brandName}`,
    `   - Hero tagline must reflect: ${tagline || brandName}`,
    `   - Primary CTA wording: ${callToAction}`,
    Object.keys(contentOverrides || {}).length > 0
      ? `   - AI enhancer content overrides:\n${JSON.stringify(contentOverrides, null, 2)}`
      : '',
    `4. AESTHETIC: deliver the ${aesthetic} aesthetic with intent. Avoid generic AI-looking output.`,
    `5. Z-INDEX rules: backgrounds z:0, page content z:1+, navigation z:100+.`,
    ``,
    `HARD GUARDRAILS (do not violate):`,
    `- DO NOT add new npm packages — install scripts are frozen.`,
    `- DO NOT delete or rename existing components inside src/components/.`,
    `- DO NOT leave TODO/FIXME/placeholder comments.`,
    `- Use the existing CSS variables --color-bg, --color-text, --color-accent, --color-primary, --color-surface, --color-border.`,
    `- Keep all originally selected ReactBits components mounted somewhere in the final site.`,
    ``,
    frontendSkill
      ? `FRONTEND-DESIGN SKILL (apply throughout):\n${frontendSkill}`
      : '',
    frontendSkill ? `` : '',
    `When the work is finished, output exactly: DONE`,
  ].filter(l => l !== undefined && l !== '').join('\n');

  return lines;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * reviewCode({ projectPath, tsErrors, briefContext, onProgress, reviewPass })
 *
 * Spawns Claude Code with the prompt piped via stdin to avoid Windows command-line
 * length limits. Supports two passes: 'makeover' (default) and 'polish'.
 *
 * @param {object} params
 * @param {string} params.projectPath
 * @param {string} params.tsErrors
 * @param {object} params.briefContext
 * @param {function} params.onProgress
 * @param {'makeover'|'polish'} [params.reviewPass]
 */
async function reviewCode({ projectPath, tsErrors, briefContext, onProgress, reviewPass = 'makeover' }, _attempt = 0, _forcedBudgetUsd = null) {
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const basePlan = deriveReviewerExecutionPlan({
    tsErrors,
    unmappedComponents: briefContext?.unmappedComponents,
    enhancerQualityScore: briefContext?.enhancerQualityScore,
    reviewPass,
  });
  const effectiveBudget = Number.isFinite(_forcedBudgetUsd)
    ? Math.min(REVIEWER_CONFIG.maxBudgetUsd, Math.max(REVIEWER_CONFIG.minBudgetUsd, Number(_forcedBudgetUsd)))
    : basePlan.maxBudgetUsd;
  const executionPlan = {
    ...basePlan,
    maxBudgetUsd: Number(effectiveBudget.toFixed(2)),
    budgetWarningUsd: Number((effectiveBudget * REVIEWER_CONFIG.budgetWarningRatio).toFixed(2)),
  };

  const ctx = { ...briefContext, _tsErrors: tsErrors };
  const prompt = buildReviewerPrompt(ctx, executionPlan, reviewPass);
  notify(
    `[Reviewer] Pass=${reviewPass} | attempt=${_attempt + 1} | plan=${executionPlan.complexity} | budget=$${executionPlan.maxBudgetUsd.toFixed(2)} | turns=${executionPlan.maxTurns} | target=$${executionPlan.targetBudgetUsd.toFixed(2)} | reason=${executionPlan.reason} | tsErrors=${executionPlan.tsErrorCount} | unmapped=${executionPlan.unmappedCount}${executionPlan.qualityScore != null ? ` | enhancerQuality=${executionPlan.qualityScore}` : ''}`
  );

  return new Promise((resolve, reject) => {
    let saw429 = false;
    let sawBudgetExhausted = false;
    const isWin = process.platform === 'win32';

    // No prompt argument: prompt is piped via stdin to bypass Windows CLI length limits.
    const cliArgs = [
      '@anthropic-ai/claude-code',
      '--print',
      '--verbose',
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json',
      '--model', 'claude-sonnet-4-6',
      '--max-turns', String(executionPlan.maxTurns),
      '--max-budget-usd', String(executionPlan.maxBudgetUsd),
    ];

    const child = spawn('npx', cliArgs, {
      cwd: path.resolve(projectPath),
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    });

    try {
      child.stdin.write(prompt);
      child.stdin.end();
    } catch (writeErr) {
      notify(`[Reviewer] Failed to send prompt via stdin: ${writeErr.message}`);
    }

    const timeoutHandle = setTimeout(() => {
      notify('[Reviewer] ⏱ Timed out. Terminating...');
      if (isWin) {
        try { require('child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch (_) {}
      } else {
        child.kill('SIGTERM');
      }
      reject(new Error('[Reviewer] Timed out.'));
    }, TIMEOUT_MS);

    let stdoutBuf = '';
    child.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          const ui = formatStreamMessage(msg, executionPlan);
          if (ui) notify(ui);
        } catch (_) {
          if (!trimmed.startsWith('npm warn') && !trimmed.includes('added ') && trimmed.length > 2) {
            notify(trimmed);
          }
        }
      }
    });

    let stderrBuf = '';
    child.stderr.on('data', (data) => {
      stderrBuf += data.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('npm warn')) continue;
        if (trimmed.includes('429') || trimmed.toLowerCase().includes('rate limit')) saw429 = true;
        if (trimmed.includes('error_max_budget_usd')) sawBudgetExhausted = true;
        notify(`[stderr] ${trimmed}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`[Reviewer] Failed to start: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      if (code === 0 || code === null) {
        notify('[Reviewer] Review complete.');
        resolve();
      } else if (saw429 && _attempt < 1) {
        notify(`[Reviewer] Rate limit hit — retrying in 65s...`);
        setTimeout(() => {
          reviewCode({ projectPath, tsErrors, briefContext, onProgress, reviewPass }, _attempt + 1, executionPlan.maxBudgetUsd)
            .then(resolve).catch(reject);
        }, 65000);
      } else if (sawBudgetExhausted) {
        const nextBudget = getEscalatedBudget(executionPlan.maxBudgetUsd);
        if (nextBudget != null) {
          notify(`[Reviewer] Budget exhausted at $${executionPlan.maxBudgetUsd.toFixed(2)} — escalating to $${nextBudget.toFixed(2)} and retrying.`);
          setTimeout(() => {
            reviewCode({ projectPath, tsErrors, briefContext, onProgress, reviewPass }, _attempt + 1, nextBudget)
              .then(resolve).catch(reject);
          }, 1200);
          return;
        }
        reject(new Error(`[Reviewer] Exited with code ${code} (max budget $${executionPlan.maxBudgetUsd.toFixed(2)} reached).`));
      } else {
        reject(new Error(`[Reviewer] Exited with code ${code}.`));
      }
    });
  });
}

module.exports = {
  reviewCode,
  _internals: {
    deriveReviewerExecutionPlan,
    getEscalatedBudget,
    buildReviewerPrompt,
  },
};
