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
const { isComponentMapped }   = require('./generators/shared/component-mapper.cjs');

const execAsync = promisify(exec);

// ── Quality gate heuristics ────────────────────────────────────────────────
const PLACEHOLDER_PATTERNS = [
  /\bhello_world\b/i,
  /\breact bits\b/i,
  /\blorem ipsum\b/i,
  /\bbrand studio\b/i,
  /\bplaceholder\b/i,
];
const CTA_KEYWORDS = /(get started|book now|contact us|start now|listen now|request demo|join now|discover now)/i;

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

async function runQualityGates({ fullPath, onProgress }) {
  const issues = [];

  const ts = await runTypeScriptCheck(fullPath);
  if (!ts.ok) issues.push(`TypeScript errors remain (${ts.errorCount}).`);

  const srcDir     = path.join(fullPath, 'src');
  const sourceFiles = await collectFilesRecursive(srcDir, f => /\.(tsx?|jsx?|css|html)$/i.test(f));
  const contents   = await Promise.all(sourceFiles.map(f => fs.readFile(f, 'utf8').catch(() => '')));
  const joined     = contents.join('\n');

  const placeholderHits = PLACEHOLDER_PATTERNS
    .map(p => p.test(joined) ? p.source : null)
    .filter(Boolean);
  if (placeholderHits.length > 0) {
    issues.push(`Placeholder/generic copy detected (${placeholderHits.join(', ')}).`);
  }

  if (!/<h1[\s>]/i.test(joined) && !/hero\.headline/i.test(joined)) {
    issues.push('No strong hero heading signal detected.');
  }
  if (!CTA_KEYWORDS.test(joined)) {
    issues.push('No clear CTA keyword detected in generated content.');
  }

  const indexCss     = contents[sourceFiles.findIndex(f => /src[\\/]+index\.css$/i.test(f))] || '';
  const surfaceLight = /--color-surface:\s*#f0f0f0/i.test(indexCss) || /--color-surface:\s*#fff(?:fff)?/i.test(indexCss);
  const textLight    = /--color-text:\s*#f8fafc/i.test(indexCss) || /--color-text:\s*#fff(?:fff)?/i.test(indexCss);
  if (surfaceLight && textLight) {
    issues.push('Potential contrast issue: light text on light surface token combination.');
  }

  const passed = issues.length === 0;
  onProgress(`[QA] Gate result: ${passed ? 'PASS' : 'FAIL'}${issues.length ? ` | issues=${issues.length}` : ''}`);
  if (!passed) onProgress(`[QA] Issues:\n- ${issues.join('\n- ')}`);
  return { passed, issues, tsErrorCount: ts.errorCount };
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
async function finalize({ fullPath, options, onProgress, onLog, taskId, event }) {
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
  return { success: true, path: fullPath, childProcess, message: `Project created at:\n${fullPath}` };
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

    // ── BUILDER: full project pipeline ────────────────────────────────────
    const styleDirection      = options.styleDirection    || {};
    const designRules         = options.designRules       || {};
    const clientBrief         = options.clientBrief       || {};
    const pages               = options.pages             || [];
    const resolvedPages       = options.resolvedPages     || [];
    const presetName          = options.presetName        || '';
    const aiSupport           = !!(options.aiSupport);
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

    // Step 2 — Build content
    onProgress('Building content from client brief...');
    let content;
    try {
      content = buildContent(clientBrief, styleDirection.siteType || 'Landing');
    } catch (contentErr) {
      onProgress(`[content-builder] Warning: ${contentErr.message} — using defaults.`);
      content = buildContent({}, styleDirection.siteType || 'Landing');
    }

    // Step 3 — Generate App.tsx + page files
    onProgress('Generating application code...');
    try {
      await buildApp({ targetDir: fullPath, selectedComponents, styleDirection, designRules, clientBrief, pages, resolvedPages, presetName });
    } catch (appErr) {
      onProgress(`[app-builder] Warning: ${appErr.message} — project may need manual fix.`);
    }

    // Safety net: ensure Brief.md exists
    await ensureBriefFile({
      fullPath, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName,
      packageManager: options.packageManager || 'npm',
      onProgress,
    });

    // Step 4 — TypeScript check (never aborts)
    onProgress('Running TypeScript check...');
    let tsErrors = '';
    const initialTs = await runTypeScriptCheck(fullPath);
    if (initialTs.ok) {
      onProgress('✓ TypeScript clean — no errors found.');
    } else {
      tsErrors = initialTs.output;
      const count = initialTs.errorCount;
      if (aiSupport) {
        onProgress(`TypeScript: ${count} error(s) found — AI reviewer will fix them.`);
      } else {
        onProgress(`TypeScript: ${count} error(s) found (AI OFF — review manually). First errors:\n${tsErrors.slice(0, 500)}`);
      }
    }

    // Step 5 — AI Reviewer (optional)
    if (aiSupport) {
      if (enhancerQualityScore != null) {
        onProgress(`Enhancer quality score: ${enhancerQualityScore}/100 (used for adaptive review budget).`);
      }

      try {
        const briefContext = buildBriefContext({ clientBrief, content, styleDirection, selectedComponents, tsErrors, pages, enhancedPrompt });
        await writeReviewerBrief(fullPath, briefContext, tsErrors);
        onProgress('REVIEWER_BRIEF.md written to project directory.');
      } catch (briefErr) {
        onProgress(`[review-brief] Warning: Could not write REVIEWER_BRIEF.md: ${briefErr.message}`);
      }

      try {
        const mappedNames   = selectedComponents.filter(c => isComponentMapped(c.name)).map(c => c.name);
        const unmappedNames = selectedComponents.map(c => c.name).filter(n => !mappedNames.includes(n));

        const reviewerBaseContext = {
          brandName:          clientBrief.brandName || content.brandName,
          tagline:            clientBrief.tagline || '',
          industry:           clientBrief.industry || '',
          aesthetic:          styleDirection.aesthetics?.[0] || 'Minimal',
          siteType:           styleDirection.siteType || 'Landing',
          callToAction:       clientBrief.callToAction || 'Get Started',
          componentList:      selectedComponents.map(c => c.name),
          mappedComponents:   mappedNames,
          unmappedComponents: unmappedNames,
          contentOverrides:   enhancedPrompt?.contentOverrides || {},
          pages,
          enhancerQualityScore,
        };

        onProgress('Starting AI reviewer Pass A (makeover)...');
        await reviewCode({ projectPath: fullPath, tsErrors, briefContext: reviewerBaseContext, reviewPass: 'makeover', onProgress });

        let qa = await runQualityGates({ fullPath, onProgress });
        if (!qa.passed) {
          onProgress('Starting AI reviewer Pass B (polish / gate-fixes)...');
          await reviewCode({ projectPath: fullPath, tsErrors, briefContext: { ...reviewerBaseContext, qaIssues: qa.issues }, reviewPass: 'polish', onProgress });
          qa = await runQualityGates({ fullPath, onProgress });
        }
        if (!qa.passed) {
          onProgress('[QA] Final gate still failing after reviewer passes. Project may require manual polishing.');
        }

        try { await fs.unlink(path.join(fullPath, 'REVIEWER_BRIEF.md')); } catch (_) {}
      } catch (reviewErr) {
        onProgress(`AI reviewer error: ${reviewErr.message}. Continuing without review.`);
      }
    }

    return await finalize({ fullPath, options, onProgress, onLog, taskId, event });

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
