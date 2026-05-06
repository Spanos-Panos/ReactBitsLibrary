const path   = require('path');
const fs     = require('fs/promises');
const { exec, spawn }  = require('child_process');
const { promisify }    = require('util');
const { buildScaffold }       = require('./generators/project/scaffolder.cjs');
const { buildApp }            = require('./generators/project/app-builder.cjs');
const { buildContent }        = require('./generators/project/content-builder.cjs');
const { generateStructure: _generateStructure } = require('./generators/project/structure-generator.cjs');
const { ensureBriefFile }     = require('./generators/project/brief-writer.cjs');
const { buildBriefContext, writeReviewerBrief } = require('./generators/project/reviewer-brief.cjs');
const { reviewCode }          = require('../electron/aiReviewer.cjs');
const { composeProject }      = require('../electron/aiComposer.cjs');
const { isComponentMapped }   = require('./generators/shared/component-mapper.cjs');

const execAsync = promisify(exec);

// ── Quality gate heuristics ────────────────────────────────────────────────
const PLACEHOLDER_PATTERNS = [
  /\bhello_world\b/i,
  /\breact bits\b/i,
  /\blorem ipsum\b/i,
  /\bbrand studio\b/i,
];
const FALLBACK_CTA_KEYWORDS = /(get started|book now|contact us|start now|listen now|request demo|join now|discover now|enquire|inquire|reach out|sign up|learn more|explore|begin)/i;
const CTA_SIGNAL = /(book|schedule|contact|start|join|buy|request|consult|demo|talk|enqu|inqu|reach|sign up|begin)/i;
const CONTACT_SIGNAL = /(contact|email|phone|@|form|reach out|message us)/i;
const SECTION_SIGNAL_MAP = {
  hero: /(hero|headline|above the fold|welcome)/i,
  features: /(feature|service|benefit|offering|capability)/i,
  cta: /(cta|call to action|get started|book now|request demo|contact us|enqu|inqu)/i,
};

function escapeRegex(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a regex that matches the brief's actual CTA wording (case-insensitive),
 * with a graceful fallback to common CTA verbs when the brief is empty.
 */
function buildCtaRegex(callToAction) {
  const cta = String(callToAction || '').trim();
  if (cta.length >= 3) {
    // Match the full CTA OR each meaningful word (>=3 chars) from it, so partial CTAs still pass.
    const escaped = escapeRegex(cta);
    const words = cta.split(/\s+/).filter(w => w.length >= 3).map(escapeRegex);
    if (words.length === 0) return new RegExp(escaped, 'i');
    return new RegExp(`(${escaped}|${words.join('|')})`, 'i');
  }
  return FALLBACK_CTA_KEYWORDS;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function runTypeScriptCheck(fullPath) {
  try {
    await execAsync('npx tsc --noEmit', { cwd: fullPath, timeout: 60000 });
    return { ok: true, errorCount: 0, output: '' };
  } catch (e) {
    const output     = (e.stdout || e.stderr || e.message || '').trim();
    const errorCount = (output.match(/error TS/g) || []).length;
    return { ok: false, errorCount, output };
  }
}

async function collectFilesRecursive(dir, matcher, out = []) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch (_) { return out; }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) { await collectFilesRecursive(fullPath, matcher, out); continue; }
    if (matcher(fullPath)) out.push(fullPath);
  }
  return out;
}

function getVisibleCopyText(source) {
  return String(source || '')
    .replace(/placeholder\s*=\s*["'`][\s\S]*?["'`]/gi, ' ')
    .replace(/className\s*=\s*["'`][\s\S]*?["'`]/gi, ' ')
    .replace(/id\s*=\s*["'`][\s\S]*?["'`]/gi, ' ')
    .replace(/aria-[a-z-]+\s*=\s*["'`][\s\S]*?["'`]/gi, ' ')
    .replace(/\b[A-Za-z0-9_-]+\.(tsx?|jsx?|css|html?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSectionSignals(source) {
  const lowered = String(source || '').toLowerCase();
  const hitCount = Object.values(SECTION_SIGNAL_MAP).reduce((acc, pattern) => acc + (pattern.test(lowered) ? 1 : 0), 0);
  return hitCount;
}

function extractEnhancerPageContents(enhancedPrompt) {
  if (!enhancedPrompt || typeof enhancedPrompt !== 'object') return [];
  if (Array.isArray(enhancedPrompt.pageContents)) return enhancedPrompt.pageContents;
  if (Array.isArray(enhancedPrompt.pages)) return enhancedPrompt.pages;
  return [];
}

/**
 * Quality gates with severity levels:
 *  - 'fail' (blocking): TS errors, placeholder copy, no hero/h1, severe contrast issue.
 *    These trigger AI repair passes.
 *  - 'warn' (advisory): missing exact CTA wording, weak CTA verb, missing contact, weak hierarchy,
 *    fonts not in policy. These do NOT block completion; they just surface in the UI.
 */
async function runQualityGates({ fullPath, onProgress, clientBrief = {}, designRules = {}, pages = [] }) {
  const fails = [];
  const warns = [];

  const ts = await runTypeScriptCheck(fullPath);
  if (!ts.ok) fails.push(`TypeScript errors remain (${ts.errorCount}).`);

  const srcDir     = path.join(fullPath, 'src');
  const sourceFiles = await collectFilesRecursive(srcDir, f => /\.(tsx?|jsx?|css|html)$/i.test(f));
  const contents   = await Promise.all(sourceFiles.map(f => fs.readFile(f, 'utf8').catch(() => '')));
  const joined     = contents.join('\n');
  const visibleCopy = getVisibleCopyText(joined);

  const placeholderHits = PLACEHOLDER_PATTERNS
    .map(p => p.test(visibleCopy) ? p.source : null)
    .filter(Boolean);
  if (placeholderHits.length > 0) {
    fails.push(`Placeholder/generic copy detected (${placeholderHits.join(', ')}).`);
  }

  const headingCount = (joined.match(/<h[1-6][\s>]/gi) || []).length;
  const sectionSignalCount = detectSectionSignals(joined);
  if (!/<h1[\s>]/i.test(joined) && !/hero\.headline/i.test(joined)) {
    fails.push('No strong hero heading signal detected.');
  }
  if (headingCount < 3) {
    warns.push('Weak visual hierarchy: fewer than 3 heading elements found.');
  }
  if (sectionSignalCount < 2) {
    warns.push('Section completeness risk: missing clear hero/features/cta signals.');
  }

  // Brief-aware CTA check — uses the actual CTA from clientBrief, not a static list.
  const ctaRegex = buildCtaRegex(clientBrief.callToAction);
  if (!ctaRegex.test(joined)) {
    warns.push(`CTA wording "${clientBrief.callToAction || '(generic)'}" not detected in generated content.`);
  }
  if (!CTA_SIGNAL.test(visibleCopy)) {
    warns.push('CTA language is weak — consider a stronger verb.');
  }
  if (!CONTACT_SIGNAL.test(visibleCopy)) {
    warns.push('No clear contact signal detected (email/form/phone/contact copy).');
  }

  // Brand presence check (warn-level — AI may render brand inside <SplitText> chars, etc.)
  const brand = String(clientBrief.brandName || '').trim();
  if (brand.length >= 3 && !new RegExp(escapeRegex(brand), 'i').test(visibleCopy)) {
    warns.push(`Brand name "${brand}" not visible in generated copy.`);
  }

  // Font policy check (warn-level) — flag font-family declarations not in designRules.fonts.
  const allowedFonts = Array.isArray(designRules.fonts)
    ? designRules.fonts.map(f => String(f.value || f.family || '').trim()).filter(Boolean)
    : [];
  if (allowedFonts.length > 0) {
    const cssFiles = contents.filter((_, i) => /\.css$/i.test(sourceFiles[i] || ''));
    const cssBlob = cssFiles.join('\n');
    const familyMatches = cssBlob.match(/font-family\s*:[^;}\n]+/gi) || [];
    const offendingFamilies = new Set();
    for (const decl of familyMatches) {
      const fams = decl.replace(/font-family\s*:/i, '').split(',').map(s => s.replace(/['"`]/g, '').trim());
      for (const fam of fams) {
        if (!fam || /^(serif|sans-serif|monospace|system-ui|cursive|fantasy|inherit|initial|unset|var\()/i.test(fam)) continue;
        const matchesAllowed = allowedFonts.some(af => af.toLowerCase() === fam.toLowerCase());
        if (!matchesAllowed) offendingFamilies.add(fam);
      }
    }
    if (offendingFamilies.size > 0) {
      const list = [...offendingFamilies].slice(0, 5).join(', ');
      warns.push(`Fonts outside policy detected: ${list}. Allowed: ${allowedFonts.join(', ')}.`);
    }
  }

  // Single-page navbar suppression (warn-level).
  if (Array.isArray(pages) && pages.length === 1) {
    const fakeNavMatch = /<nav[\s>][\s\S]{0,1200}<\/nav>/i.exec(joined);
    if (fakeNavMatch) {
      const navBlock = fakeNavMatch[0];
      const linkCount = (navBlock.match(/<(a|NavLink)\b/gi) || []).length;
      if (linkCount >= 3) {
        warns.push('Single-page project but multi-link top-nav detected — should be in-page anchors only.');
      }
    }
  }

  const indexCss     = contents[sourceFiles.findIndex(f => /src[\\/]+index\.css$/i.test(f))] || '';
  const surfaceLight = /--color-surface:\s*#f0f0f0/i.test(indexCss) || /--color-surface:\s*#fff(?:fff)?/i.test(indexCss);
  const textLight    = /--color-text:\s*#f8fafc/i.test(indexCss) || /--color-text:\s*#fff(?:fff)?/i.test(indexCss);
  if (surfaceLight && textLight) {
    fails.push('Potential contrast issue: light text on light surface token combination.');
  }

  const issues = [...fails, ...warns];
  const passed = fails.length === 0;
  onProgress(`[QA] Gate result: ${passed ? 'PASS' : 'FAIL'}${fails.length ? ` | fails=${fails.length}` : ''}${warns.length ? ` | warns=${warns.length}` : ''}`);
  if (fails.length) onProgress(`[QA] Blocking issues:\n- ${fails.join('\n- ')}`);
  if (warns.length) onProgress(`[QA] Advisory issues:\n- ${warns.join('\n- ')}`);
  return { passed, issues, fails, warns, tsErrorCount: ts.errorCount };
}

function makeIpcEmitters(taskId, event) {
  const onProgress = (msg) => {
    console.log(`[ID:${taskId}] ${msg}`);
    if (event?.sender) event.sender.send('generate-progress', msg, taskId);
  };
  const onLog = (msg) => {
    process.stdout.write(msg);
    if (event?.sender) event.sender.send('generate-log', msg, taskId);
  };
  return { onProgress, onLog };
}

// ── Post-generation: open VS Code + optional dev server ────────────────────
async function finalize({ fullPath, options, onProgress, onLog, taskId, event, qa = null }) {
  let childProcess = null;

  if (options.openWhenDone) {
    try {
      const { execSync } = require('child_process');
      execSync(`code "${fullPath}"`, { timeout: 5000 });
    } catch (err) {
      console.warn('[DemoCLI] Failed to open VS Code:', err.message);
    }
  }

  if (options.runWhenDone) {
    onProgress('Launching background dev server...');
    const pm = options.packageManager || 'npm';
    childProcess = spawn(pm, ['run', 'dev', '--', '--open'], {
      cwd: fullPath, shell: true, windowsHide: true,
      env: { ...process.env, BROWSER: 'chrome' },
    });
    const handleOutput = (data) => onLog(data.toString());
    childProcess.stdout.on('data', handleOutput);
    childProcess.stderr.on('data', handleOutput);
  }

  onProgress(`✓ Project ready at ${fullPath}`);
  const warnings = (qa && Array.isArray(qa.warns)) ? qa.warns : [];
  return {
    success: true,
    path: fullPath,
    childProcess,
    message: `Project created at:\n${fullPath}`,
    warnings,
    completedWithWarnings: warnings.length > 0,
  };
}

// ── Main entrypoint ────────────────────────────────────────────────────────

/**
 * generatePlayground(payload, event, taskId)
 *
 * Two-mode architecture:
 *   LEGACY  → inspector "Generate Demo" — single component, no AI, no design rules
 *   BUILDER → full pipeline with scaffolder + app-builder + optional AI reviewer
 *
 * The mode is selected by whether `name` is set and `selectedComponents` is empty.
 * (selectedComponents is always [] for the legacy path — see electron/main.cjs)
 */
async function generatePlayground(payload, event, taskId) {
  try {
    const {
      options = {},
      selectedComponents = [],
      enhancedPrompt = null,
      // Legacy single-component fields
      category, name, usageCode, componentFiles,
    } = payload;

    if (!options.projectPath) {
      throw new Error('No destination path selected. Please choose a folder first.');
    }

    const baseProjectName = options.projectName
      || enhancedPrompt?.projectMeta?.title
      || (name ? `demo-${name.toLowerCase()}` : 'ai-demo');
    const safeProjectName = baseProjectName.replace(/[^a-z0-9-_]/gi, '-');
    const selectedDir     = path.resolve(options.projectPath);
    const parentDir       = path.basename(selectedDir).toLowerCase() === safeProjectName.toLowerCase()
      ? path.dirname(selectedDir)
      : selectedDir;
    const fullPath        = path.join(parentDir, safeProjectName);

    const { onProgress, onLog } = makeIpcEmitters(taskId, event);

    // ── LEGACY: single-component demo ─────────────────────────────────────
    if (!selectedComponents.length && name) {
      const { generateViteReact } = require('./generators/demo/vite-react.cjs');
      await generateViteReact({
        targetDir: fullPath,
        projectName: safeProjectName,
        componentCategory: category,
        componentName: name,
        componentFiles,
        usageCode,
        packageManager: options.packageManager || 'npm',
        scrollbarStyle: options.scrollbarStyle || null,
        onProgress,
        onLog,
      });
      return await finalize({ fullPath, options, onProgress, onLog, taskId, event });
    }

    // ── BUILDER: AI-first project pipeline ─────────────────────────────────
    const styleDirection       = options.styleDirection || {};
    const designRules          = options.designRules || {};
    const clientBrief          = options.clientBrief || {};
    const pages                = options.pages || [];
    const resolvedPages        = options.resolvedPages || [];
    const presetName           = options.presetName || '';
    const aiSupport            = !!(options.aiSupport);
    const aiBudgetUsd          = Number.isFinite(options.aiBudgetUsd) ? Number(options.aiBudgetUsd) : null;
    const enhancerQualityScore = Number.isFinite(options.enhancerQualityScore)
      ? Number(options.enhancerQualityScore)
      : null;

    // Step 1 — Scaffold
    onProgress('Scaffolding project skeleton...');
    try {
      await buildScaffold({
        parentDir,
        projectName: safeProjectName,
        packageManager: options.packageManager || 'npm',
        selectedComponents,
        designRules,
        styleDirection,
        scrollbarStyle: options.scrollbarStyle || null,
        runWhenDone: options.runWhenDone,
        isMultiPage: Array.isArray(pages) && pages.length > 1,
        onProgress,
        onLog,
      });
    } catch (scaffoldErr) {
      throw new Error(`[Scaffolder] Failed: ${scaffoldErr.message}`);
    }

    onProgress('Building content from client brief + enhanced prompt...');
    let content;
    try {
      content = buildContent(clientBrief, styleDirection.siteType || 'Landing', enhancedPrompt);
    } catch (contentErr) {
      onProgress(`[content-builder] Warning: ${contentErr.message} — using defaults.`);
      content = buildContent({}, styleDirection.siteType || 'Landing', enhancedPrompt);
    }

    const safeAiBudget = Number.isFinite(aiBudgetUsd) ? Math.max(0.6, aiBudgetUsd) : null;
    const composerBudget = Number.isFinite(safeAiBudget)
      ? Number(Math.max(0.45, (safeAiBudget * 0.72)).toFixed(2))
      : 1.8;
    const reviewerBudgetCap = Number.isFinite(safeAiBudget)
      ? Number(Math.max(0.18, (safeAiBudget - composerBudget)).toFixed(2))
      : 0.95;
    const mappedNames = selectedComponents.filter(c => isComponentMapped(c.name)).map(c => c.name);
    const unmappedNames = selectedComponents.map(c => c.name).filter(n => !mappedNames.includes(n));
    const performanceProfile = options.performanceProfile && typeof options.performanceProfile === 'object'
      ? options.performanceProfile
      : null;
    const componentWeightTally = (() => {
      try {
        const counts = { light: 0, medium: 0, heavy: 0 };
        for (const c of selectedComponents) {
          const w = (c && (c.weight || c.role?.weight)) || 'light';
          if (counts[w] != null) counts[w] += 1;
          else counts.light += 1;
        }
        return counts;
      } catch (_) {
        return { light: 0, medium: 0, heavy: 0 };
      }
    })();
    const reviewerBaseContext = {
      brandName: clientBrief.brandName || content.brandName,
      tagline: clientBrief.tagline || '',
      industry: clientBrief.industry || '',
      aesthetic: styleDirection.aesthetics?.[0] || 'Minimal',
      siteType: styleDirection.siteType || 'Landing',
      callToAction: clientBrief.callToAction || 'Get Started',
      componentList: selectedComponents.map(c => c.name),
      mappedComponents: mappedNames,
      unmappedComponents: unmappedNames,
      contentOverrides: enhancedPrompt?.contentOverrides || {},
      designTokens: enhancedPrompt?.designTokens || {},
      designRules,
      pageContents: extractEnhancerPageContents(enhancedPrompt),
      pages,
      performanceProfile,
      componentWeightTally,
      enhancerQualityScore,
    };

    const buildDeterministicFallback = async (reason) => {
      if (reason) onProgress(`[AI-first fallback] ${reason}`);
      onProgress('Generating deterministic baseline (fallback)...');
      try {
        await buildApp({
          targetDir: fullPath,
          selectedComponents,
          styleDirection,
          designRules,
          clientBrief,
          pages,
          resolvedPages,
          presetName,
          enhancedPrompt,
        });
      } catch (appErr) {
        onProgress(`[app-builder] Warning: ${appErr.message} — project may need manual fix.`);
      }
    };

    // Safety net: ensure Brief.md exists
    await ensureBriefFile({
      fullPath, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName,
      packageManager: options.packageManager || 'npm',
      onProgress,
    });

    let usedFallback = false;
    let tsErrors = '';
    let qa = { passed: false, issues: [], tsErrorCount: 0 };

    if (aiSupport) {
      if (enhancerQualityScore != null) {
        onProgress(`Enhancer quality score: ${enhancerQualityScore}/100 (used for adaptive generation).`);
      }
      if (Number.isFinite(safeAiBudget)) {
        onProgress(`AI generation budget cap: $${safeAiBudget.toFixed(2)} (composer=$${composerBudget.toFixed(2)}, repair=$${reviewerBudgetCap.toFixed(2)}).`);
      }

      try {
        const briefContext = buildBriefContext({ clientBrief, content, styleDirection, selectedComponents, tsErrors, pages, enhancedPrompt });
        await writeReviewerBrief(fullPath, briefContext, tsErrors);
        onProgress('REVIEWER_BRIEF.md written to project directory.');
      } catch (briefErr) {
        onProgress(`[review-brief] Warning: Could not write REVIEWER_BRIEF.md: ${briefErr.message}`);
      }

      try {
        onProgress('Starting AI-first Composer pass...');
        await composeProject({
          projectPath: fullPath,
          briefContext: reviewerBaseContext,
          onProgress,
          maxBudgetUsd: composerBudget,
          maxTurns: 52,
        });
      } catch (composeErr) {
        usedFallback = true;
        await buildDeterministicFallback(`Composer failed (${composeErr.message}).`);
      }

      if (!usedFallback) {
        onProgress('Running TypeScript check after AI composition...');
      } else {
        onProgress('Running TypeScript check after deterministic fallback...');
      }
      const initialTs = await runTypeScriptCheck(fullPath);
      let hasTsIssues = !initialTs.ok;
      tsErrors = initialTs.ok ? '' : initialTs.output;
      if (initialTs.ok) {
        onProgress('✓ TypeScript clean — no errors found.');
      } else {
        onProgress(`TypeScript: ${initialTs.errorCount} error(s) found — running repair passes.`);
      }

      qa = await runQualityGates({ fullPath, onProgress, clientBrief, designRules, pages });
      let repairAttempt = 0;
      const maxRepairPasses = 3;
      // Only blocking failures (TS errors / placeholder copy / no hero / contrast) trigger repairs.
      while (repairAttempt < maxRepairPasses && (!qa.passed || hasTsIssues)) {
        repairAttempt += 1;
        onProgress(`Starting AI repair pass ${repairAttempt}/${maxRepairPasses}...`);
        try {
          await reviewCode({
            projectPath: fullPath,
            tsErrors,
            briefContext: { ...reviewerBaseContext, qaIssues: qa.fails },
            reviewPass: usedFallback ? 'makeover' : 'polish',
            onProgress,
            budgetCapUsd: reviewerBudgetCap,
          });
        } catch (repairErr) {
          onProgress(`AI repair pass ${repairAttempt} failed: ${repairErr.message}`);
        }

        const tsAfterRepair = await runTypeScriptCheck(fullPath);
        hasTsIssues = !tsAfterRepair.ok;
        tsErrors = tsAfterRepair.ok ? '' : tsAfterRepair.output;
        qa = await runQualityGates({ fullPath, onProgress, clientBrief, designRules, pages });
        if (qa.passed && !hasTsIssues) break;
      }

      if (!qa.passed) {
        onProgress('[QA] Final gate still failing after AI repair loop. Manual polish may still be needed.');
      } else if (qa.warns && qa.warns.length > 0) {
        onProgress(`[QA] Build complete with ${qa.warns.length} advisory warning(s) — see log above.`);
      }

      try { await fs.unlink(path.join(fullPath, 'REVIEWER_BRIEF.md')); } catch (_) {}

      // After AI path completes, fall through to finalize with the latest qa.
      return await finalize({ fullPath, options, onProgress, onLog, taskId, event, qa });
    } else {
      await buildDeterministicFallback('');
      onProgress('Running TypeScript check...');
      const initialTs = await runTypeScriptCheck(fullPath);
      if (initialTs.ok) {
        onProgress('✓ TypeScript clean — no errors found.');
      } else {
        onProgress(`TypeScript: ${initialTs.errorCount} error(s) found (AI OFF — review manually). First errors:\n${initialTs.output.slice(0, 500)}`);
      }
      qa = await runQualityGates({ fullPath, onProgress, clientBrief, designRules, pages });
      return await finalize({ fullPath, options, onProgress, onLog, taskId, event, qa });
    }

  } catch (error) {
    console.error('[DemoCLI] generatePlayground failed:', error);
    return { success: false, error: error.message };
  }
}

// ── Structure generator (thin wrapper) ────────────────────────────────────

async function generateStructure(payload, event, taskId) {
  try {
    const { outputPath, projectName, openWhenDone } = payload;
    if (!outputPath) throw new Error('No output path selected. Please choose a folder first.');

    const safeProjectName = (projectName || 'my-app').replace(/[^a-z0-9-_]/gi, '-');
    const fullPath        = path.join(path.resolve(outputPath), safeProjectName);

    const { onProgress, onLog } = makeIpcEmitters(taskId, event);
    const result = await _generateStructure({ ...payload, onProgress, onLog }, event, taskId);

    if (result.success && openWhenDone) {
      try {
        const { execSync } = require('child_process');
        execSync(`code "${fullPath}"`, { timeout: 5000 });
      } catch (err) {
        console.warn('[DemoCLI] Failed to open VS Code:', err.message);
      }
    }

    return result;
  } catch (error) {
    console.error('[DemoCLI] generateStructure failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { generatePlayground, generateStructure };
