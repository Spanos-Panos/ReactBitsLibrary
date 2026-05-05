const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TIMEOUT_MS = 16 * 60 * 1000;
const FRONTEND_SKILL_PATH = path.resolve(__dirname, '..', '.agents', 'skills', 'frontend-design', 'SKILL.md');
let cachedFrontendSkill = null;

function loadFrontendDesignSkillSnippet() {
  if (cachedFrontendSkill != null) return cachedFrontendSkill;
  try {
    const raw = fs.readFileSync(FRONTEND_SKILL_PATH, 'utf8');
    const withoutFrontmatter = raw.replace(/^---[\s\S]*?---\s*/m, '');
    cachedFrontendSkill = withoutFrontmatter
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, 100)
      .join('\n');
    return cachedFrontendSkill;
  } catch (_) {
    cachedFrontendSkill = '';
    return '';
  }
}

function formatStreamMessage(msg) {
  try {
    if (msg.type === 'assistant') {
      const content = msg.message?.content || [];
      for (const block of content) {
        if (block.type === 'text' && block.text?.trim()) {
          const preview = block.text.trim().slice(0, 220).replace(/\n+/g, ' ');
          return `[Composer] ${preview}${block.text.length > 220 ? '…' : ''}`;
        }
        if (block.type === 'tool_use') {
          const name = block.name || 'tool';
          const input = block.input || {};
          if (name === 'Bash') return `[Composer/Bash] ${(input.command || '').slice(0, 120)}`;
          if (name === 'Edit' || name === 'MultiEdit') return `[Composer/Edit] ${input.file_path || input.path || '?'}`;
          if (name === 'Write') return `[Composer/Write] ${input.file_path || '?'}`;
          if (name === 'Read') return `[Composer/Read] ${input.file_path || input.path || '?'}`;
          return `[Composer/${name}] ${JSON.stringify(input).slice(0, 100)}`;
        }
      }
      return null;
    }
    if (msg.type === 'result') {
      const turns = msg.num_turns ? `${msg.num_turns} turns` : null;
      const cost = msg.cost_usd != null ? `$${msg.cost_usd.toFixed(4)}` : null;
      const status = msg.subtype === 'success' ? '✓ Compose complete' : `Ended (${msg.subtype})`;
      return `[Composer] ${status}${turns || cost ? ` · ${[turns, cost].filter(Boolean).join(' · ')}` : ''}`;
    }
  } catch (_) {
    return null;
  }
  return null;
}

function buildComposerPrompt(briefContext = {}) {
  const frontendSkill = loadFrontendDesignSkillSnippet();
  const componentList = Array.isArray(briefContext.componentList) ? briefContext.componentList : [];
  const pages = Array.isArray(briefContext.pages) ? briefContext.pages : [];
  const pageList = pages.length
    ? pages.map((p) => p.title || p.name || p.label || p.id).filter(Boolean).join(', ')
    : 'Single page';
  const designTokens = briefContext.designTokens && typeof briefContext.designTokens === 'object'
    ? JSON.stringify(briefContext.designTokens, null, 2)
    : '{}';
  const contentOverrides = briefContext.contentOverrides && typeof briefContext.contentOverrides === 'object'
    ? JSON.stringify(briefContext.contentOverrides, null, 2)
    : '{}';
  const pageContents = Array.isArray(briefContext.pageContents)
    ? JSON.stringify(briefContext.pageContents, null, 2)
    : '[]';

  return [
    `You are the PRIMARY project composer for a React 19 + Vite + TypeScript codebase.`,
    `Treat the existing scaffold as raw material. You are expected to produce a sellable, production-grade website.`,
    ``,
    `OBJECTIVE:`,
    `- Create a premium, distinctive, cohesive website aligned to this brief.`,
    `- You are allowed to substantially rewrite src/App.tsx, src/pages/*.tsx, and src/index.css.`,
    `- You may create additional components under src/ to improve layout and storytelling.`,
    ``,
    `PROJECT BRIEF:`,
    `- Brand: ${briefContext.brandName || 'Unknown Brand'}${briefContext.tagline ? ` — "${briefContext.tagline}"` : ''}`,
    `- Industry: ${briefContext.industry || 'General'}`,
    `- Site type: ${briefContext.siteType || 'Landing'}`,
    `- Aesthetic: ${briefContext.aesthetic || 'Minimal'}`,
    `- Primary CTA: ${briefContext.callToAction || 'Get Started'}`,
    `- Pages: ${pageList}`,
    componentList.length ? `- Available ReactBits components: ${componentList.join(', ')}` : '- Available ReactBits components: (none listed)',
    ``,
    `ENHANCED TOKENS (prefer these values when sensible):`,
    designTokens,
    ``,
    `ENHANCED CONTENT OVERRIDES:`,
    contentOverrides,
    ``,
    `ENHANCED PAGE CONTENTS:`,
    pageContents,
    ``,
    `HARD REQUIREMENTS:`,
    `1) Keep all selected ReactBits components mounted somewhere meaningful in the site.`,
    `2) Do not add new npm dependencies.`,
    `3) Use existing CSS custom properties where possible (--color-bg, --color-text, --color-accent, --color-primary, --color-surface, --color-border).`,
    `4) Ensure clear visual hierarchy: strong hero heading, readable section headings, and an obvious CTA.`,
    `5) Ensure contact readiness: include at least one contact path (contact section, form, email, or CTA link).`,
    `6) Avoid placeholder/generic copy. Use specific, branded language.`,
    `7) Run TypeScript check if you make broad edits and fix breakages.`,
    ``,
    frontendSkill ? `FRONTEND-DESIGN SKILL:\n${frontendSkill}` : '',
    frontendSkill ? '' : '',
    `When complete, output exactly: DONE`,
  ].filter(Boolean).join('\n');
}

async function composeProject({
  projectPath,
  briefContext,
  onProgress,
  maxBudgetUsd = 1.8,
  maxTurns = 52,
}) {
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const boundedBudget = Number(Math.min(3.0, Math.max(0.25, Number(maxBudgetUsd || 1.8))).toFixed(2));
  const boundedTurns = Math.min(80, Math.max(16, Number(maxTurns || 52)));
  const prompt = buildComposerPrompt(briefContext);

  notify(`[Composer] Starting AI-first composition | budget=$${boundedBudget.toFixed(2)} | turns=${boundedTurns}`);

  return new Promise((resolve, reject) => {
    let saw429 = false;
    let stdoutBuf = '';
    let stderrBuf = '';

    const child = spawn('npx', [
      '@anthropic-ai/claude-code',
      '--print',
      '--verbose',
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json',
      '--model', 'claude-sonnet-4-6',
      '--max-turns', String(boundedTurns),
      '--max-budget-usd', String(boundedBudget),
    ], {
      cwd: path.resolve(projectPath),
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    });

    try {
      child.stdin.write(prompt);
      child.stdin.end();
    } catch (writeErr) {
      notify(`[Composer] Failed to send prompt via stdin: ${writeErr.message}`);
    }

    const timeoutHandle = setTimeout(() => {
      notify('[Composer] Timed out. Terminating process...');
      try {
        if (process.platform === 'win32') {
          require('child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
        } else {
          child.kill('SIGTERM');
        }
      } catch (_) {}
      reject(new Error('[Composer] Timed out.'));
    }, TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          const ui = formatStreamMessage(msg);
          if (ui) notify(ui);
        } catch (_) {
          if (!trimmed.startsWith('npm warn') && trimmed.length > 2) {
            notify(trimmed);
          }
        }
      }
    });

    child.stderr.on('data', (data) => {
      stderrBuf += data.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('npm warn')) continue;
        if (trimmed.includes('429') || trimmed.toLowerCase().includes('rate limit')) saw429 = true;
        notify(`[Composer/stderr] ${trimmed}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`[Composer] Failed to start: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      if (code === 0 || code === null) {
        notify('[Composer] Composition complete.');
        resolve();
      } else if (saw429) {
        reject(new Error(`[Composer] Exited with code ${code} after rate-limit interruption.`));
      } else {
        reject(new Error(`[Composer] Exited with code ${code}.`));
      }
    });
  });
}

module.exports = {
  composeProject,
  _internals: {
    buildComposerPrompt,
    loadFrontendDesignSkillSnippet,
  },
};
