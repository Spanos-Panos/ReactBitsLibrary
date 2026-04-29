const path = require('path');
const fs = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { buildScaffold } = require('./generators/scaffolder.cjs');
const { buildApp } = require('./generators/app-builder.cjs');
const { buildContent } = require('./generators/content-builder.cjs');
const { generateStructure: _generateStructure } = require('./generators/structure-generator.cjs');

const execAsync = promisify(exec);

/**
 * generatePlayground(payload, event, taskId)
 *
 * Two-mode architecture:
 *   AI OFF  → steps 1–5 (template generator only, zero Claude cost)
 *   AI ON   → steps 1–7 (template generator + AI reviewer patches)
 *
 * Execution order:
 *   1. scaffolder         → project skeleton on disk
 *   2. content-builder    → in-memory content object
 *   3. app-builder        → writes src/App.tsx (+ page files if multi-page)
 *   4. tsc --noEmit       → capture TS errors (warnings only, never abort)
 *   5. [IF aiSupport] write REVIEWER_BRIEF.md
 *   6. [IF aiSupport] aiReviewer → review + patch
 *   7. [IF aiSupport] tsc --noEmit (final) → log result
 */
async function generatePlayground(payload, event, taskId) {
  const { spawn } = require('child_process');
  try {
    const {
      options = {},
      selectedComponents = [],
      enhancedPrompt = null,
      // Legacy single-component fields (when called from non-builder path)
      category, name, usageCode, componentFiles,
    } = payload;

    if (!options.projectPath) {
      throw new Error('No destination path selected. Please choose a folder first.');
    }

    const baseProjectName = options.projectName
      || enhancedPrompt?.projectMeta?.title
      || (name ? `demo-${name.toLowerCase()}` : 'ai-demo');
    const safeProjectName = baseProjectName.replace(/[^a-z0-9-_]/gi, '-');
    const selectedDir = path.resolve(options.projectPath);
    // If user picked the client folder itself (e.g. output/origin-coffee/) avoid double-nesting
    const parentDir = path.basename(selectedDir).toLowerCase() === safeProjectName.toLowerCase()
      ? path.dirname(selectedDir)
      : selectedDir;
    const fullPath  = path.join(parentDir, safeProjectName);

    const onProgress = (msg) => {
      console.log(`[ID:${taskId}] ${msg}`);
      if (event && event.sender) event.sender.send('generate-progress', msg, taskId);
    };
    const onLog = (msg) => {
      process.stdout.write(msg);
      if (event && event.sender) event.sender.send('generate-log', msg, taskId);
    };

    const isBuilderGeneration = selectedComponents.length > 0;
    const aiSupport = !!(options.aiSupport);

    // ── LEGACY SINGLE-COMPONENT PATH (inspector "Generate Demo" button) ────────
    if (!isBuilderGeneration && name) {
      const { generateViteReact } = require('./generators/vite-react.cjs');
      await generateViteReact({
        targetDir: fullPath,
        projectName: safeProjectName,
        selectedComponents: [],
        componentCategory: category,
        componentName: name,
        componentFiles,
        usageCode,
        packageManager: options.packageManager || 'npm',
        scrollbarStyle: options.scrollbarStyle || null,
        onProgress,
        onLog,
        runWhenDone: options.runWhenDone,
      });

      return await finalize({ fullPath, options, onProgress, onLog, spawn, taskId, event });
    }

    // ── BUILDER GENERATION PATH (Phase 4 new pipeline) ─────────────────────────
    const styleDirection = options.styleDirection || {};
    const designRules    = options.designRules    || {};
    const clientBrief    = options.clientBrief    || {};
    const pages          = options.pages          || [];
    const resolvedPages  = options.resolvedPages  || [];
    const presetName     = options.presetName     || '';

    // ── Step 1: Scaffold project skeleton + install deps ────────────────────────
    onProgress('Scaffolding project skeleton...');
    const isMultiPage = Array.isArray(pages) && pages.length > 1;
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
        isMultiPage,
        onProgress,
        onLog,
      });
    } catch (scaffoldErr) {
      // Scaffolding failure is fatal — can't continue without project files
      throw new Error(`[Scaffolder] Failed: ${scaffoldErr.message}`);
    }

    // ── Step 2: Build content from clientBrief (in-memory) ──────────────────────
    onProgress('Building content from client brief...');
    let content;
    try {
      content = buildContent(clientBrief, styleDirection.siteType || 'Landing');
    } catch (contentErr) {
      onProgress(`[content-builder] Warning: ${contentErr.message} — using defaults.`);
      content = buildContent({}, styleDirection.siteType || 'Landing');
    }

    // ── Step 3: Generate App.tsx and page files ──────────────────────────────────
    onProgress('Generating application code...');
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
      });
    } catch (appErr) {
      onProgress(`[app-builder] Warning: ${appErr.message} — project may need manual fix.`);
    }

    // Safety net: ensure Brief.md exists even if upstream write failed silently.
    await ensureBriefFile({
      fullPath,
      selectedComponents,
      styleDirection,
      designRules,
      clientBrief,
      pages,
      presetName,
      packageManager: options.packageManager || 'npm',
      onProgress,
    });

    // ── Step 4: TypeScript check — capture errors (don't abort) ──────────────────
    onProgress('Running TypeScript check...');
    let tsErrors = '';
    try {
      await execAsync('npx tsc --noEmit', { cwd: fullPath, timeout: 60000 });
      onProgress('✓ TypeScript clean — no errors found.');
    } catch (e) {
      tsErrors = (e.stdout || e.stderr || e.message || '').trim();
      const errorCount = (tsErrors.match(/error TS/g) || []).length;
      if (aiSupport) {
        onProgress(`TypeScript: ${errorCount} error(s) found — AI reviewer will fix them.`);
      } else {
        onProgress(`TypeScript: ${errorCount} error(s) found (AI OFF — review manually). First errors:\n${tsErrors.slice(0, 500)}`);
      }
    }

    // ── Step 5: AI Reviewer (only when aiSupport === true) ─────────────────────
    if (aiSupport) {
      // Write REVIEWER_BRIEF.md to the project before running the reviewer
      try {
        const briefContext = buildBriefContext({
          clientBrief, content, styleDirection, selectedComponents, tsErrors, pages, enhancedPrompt
        });
        await writeReviewerBrief(fullPath, briefContext, tsErrors);
        onProgress('REVIEWER_BRIEF.md written to project directory.');
      } catch (briefErr) {
        onProgress(`[review-brief] Warning: Could not write REVIEWER_BRIEF.md: ${briefErr.message}`);
      }

      // Run AI reviewer
      try {
        onProgress('Starting AI reviewer...');
        const { reviewCode } = require('../electron/aiReviewer.cjs');
        const { isComponentMapped } = require('./generators/component-mapper.cjs');

        const mappedNames   = selectedComponents.filter(c => isComponentMapped(c.name)).map(c => c.name);
        const unmappedNames = selectedComponents.map(c => c.name).filter(n => !mappedNames.includes(n));

        await reviewCode({
          projectPath: fullPath,
          tsErrors,
          briefContext: {
            brandName:          clientBrief.brandName || content.brandName,
            tagline:            clientBrief.tagline    || '',
            industry:           clientBrief.industry   || '',
            aesthetic:          styleDirection.aesthetics?.[0] || 'Minimal',
            siteType:           styleDirection.siteType || 'Landing',
            callToAction:       clientBrief.callToAction || 'Get Started',
            componentList:      selectedComponents.map(c => c.name),
            mappedComponents:   mappedNames,
            unmappedComponents: unmappedNames,
            contentOverrides:   enhancedPrompt?.contentOverrides || {},
            pages,
          },
          onProgress,
        });

        // Final TS check after reviewer
        onProgress('Final TypeScript check...');
        try {
          await execAsync('npx tsc --noEmit', { cwd: fullPath, timeout: 60000 });
          onProgress('✓ Final TypeScript check passed.');
        } catch (e) {
          const remaining = (e.stdout || e.stderr || e.message || '').trim();
          const count = (remaining.match(/error TS/g) || []).length;
          onProgress(`Warning: ${count} TypeScript issue(s) remain after review. Check project manually.`);
        }

        // Optionally delete REVIEWER_BRIEF.md after review
        try {
          await fs.unlink(path.join(fullPath, 'REVIEWER_BRIEF.md'));
        } catch (_) { /* non-fatal */ }

      } catch (reviewErr) {
        onProgress(`AI reviewer error: ${reviewErr.message}. Continuing without review.`);
      }
    }

    return await finalize({ fullPath, options, onProgress, onLog, spawn, taskId, event });

  } catch (error) {
    console.error('[DemoCLI] generatePlayground failed:', error);
    return { success: false, error: error.message };
  }
}

async function ensureBriefFile({
  fullPath,
  selectedComponents = [],
  styleDirection = {},
  designRules = {},
  clientBrief = {},
  pages = [],
  presetName = '',
  packageManager = 'npm',
  onProgress = () => {},
}) {
  const briefPath = path.join(fullPath, 'Brief.md');
  try {
    await fs.access(briefPath);
    return;
  } catch (_) {
    // Missing: create fallback brief.
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const date = nowIso.slice(0, 10);
  const byCategory = {};
  for (const c of selectedComponents) {
    const cat = c.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c.name);
  }
  const totalComponents = selectedComponents.length;
  const totalPages = Array.isArray(pages) && pages.length > 0 ? pages.length : 1;
  const componentSection = Object.entries(byCategory)
    .map(([cat, names]) => `### ${cat}\n${names.map(n => `- ${n}`).join('\n')}`)
    .join('\n\n');
  const categoryRows = Object.entries(byCategory)
    .map(([cat, names]) => `| ${cat} | ${names.length} |`)
    .join('\n') || '| None | 0 |';
  const pageRows = (Array.isArray(pages) && pages.length > 0 ? pages : [{ title: 'Home', type: 'home' }])
    .map((p, i) => {
      const title = p.title || p.name || `Page ${i + 1}`;
      const type = p.type || 'custom';
      const route = type === 'home'
        ? '/'
        : type === 'about'
          ? '/about'
          : type === 'services'
            ? '/services'
            : type === 'contact'
              ? '/contact'
              : '/' + String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `| ${i + 1} | ${title} | ${type} | \`${route}\` |`;
    })
    .join('\n');

  const colors = Array.isArray(designRules.colors) ? designRules.colors : [];
  const colorRows = colors.length > 0
    ? colors.map(c => {
      const value = c.value || c.hex || '—';
      const swatch = typeof value === 'string' && value.startsWith('#')
        ? `<span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:${value};border:1px solid rgba(255,255,255,.25);vertical-align:middle;"></span>`
        : '—';
      return `| ${c.role || 'auto'} | ${value} | ${swatch} |`;
    }).join('\n')
    : '| auto | — | — |';

  const fonts = Array.isArray(designRules.fonts) ? designRules.fonts : [];
  const fontRows = fonts.length > 0
    ? fonts.map(f => `| ${f.role || 'auto'} | ${f.family || f.value || '—'} | ${f.weight || 'default'} |`).join('\n')
    : '| auto | Default system | default |';

  const lines = [
    `# Project Brief: ${clientBrief.brandName || 'Project'}`,
    ``,
    `> Generated by BitForge`,
    `> Date: ${date}`,
    `> Timestamp: ${nowIso}`,
    `> Source: Fallback brief writer (auto-recovered)`,
    presetName ? `> Preset: ${presetName}` : '',
    ``,
    `## Snapshot`,
    ``,
    `| Key | Value |`,
    `| --- | --- |`,
    `| Brand | ${clientBrief.brandName || 'Project'} |`,
    `| Tagline | ${clientBrief.tagline || '—'} |`,
    `| Site Type | ${styleDirection.siteType || 'Landing'} |`,
    `| Aesthetic | ${(styleDirection.aesthetics || [])[0] || 'Minimal'} |`,
    `| Color Strategy | ${styleDirection.colorStrategy || '—'} |`,
    `| Industry | ${clientBrief.industry || '—'} |`,
    `| Audience | ${clientBrief.targetAudience || '—'} |`,
    `| CTA | ${clientBrief.callToAction || '—'} |`,
    `| Components | ${totalComponents} |`,
    `| Pages | ${totalPages} |`,
    `| Package Manager | ${packageManager} |`,
    ``,
    `---`,
    ``,
    `## Client Brief Inputs`,
    ``,
    `| Field | Value |`,
    `| --- | --- |`,
    `| Description | ${clientBrief.description || '—'} |`,
    `| Tone | ${clientBrief.tone || '—'} |`,
    `| Personality | ${clientBrief.personality || '—'} |`,
    `| USP | ${clientBrief.usp || '—'} |`,
    ``,
    `---`,
    ``,
    `## Forge Style Direction`,
    ``,
    `| Setting | Value |`,
    `| --- | --- |`,
    `| Aesthetics | ${(styleDirection.aesthetics || []).join(', ') || '—'} |`,
    `| Site Type | ${styleDirection.siteType || '—'} |`,
    `| Color Strategy | ${styleDirection.colorStrategy || '—'} |`,
    `| Typography Intensity | ${styleDirection.typographyIntensity || '—'} |`,
    `| Visual Effects | ${(styleDirection.visualEffects || []).join(', ') || '—'} |`,
    `| Audience Hint | ${styleDirection.audience || '—'} |`,
    ``,
    `---`,
    ``,
    `## Configuration Panel Rules`,
    ``,
    `- Optimization Target: ${designRules?.sizes?.optimizationTarget || 'adaptive'}`,
    `- Spacing Scale: ${designRules?.sizes?.spacingScale || '—'}`,
    `- Border Radius: ${designRules?.sizes?.borderRadius || '—'}`,
    ``,
    `### Colors`,
    ``,
    `| Role | Value | Swatch |`,
    `| --- | --- | --- |`,
    colorRows,
    ``,
    `### Fonts`,
    ``,
    `| Role | Family | Weight |`,
    `| --- | --- | --- |`,
    fontRows,
    ``,
    `---`,
    ``,
    `## Component Inventory`,
    ``,
    `| Category | Count |`,
    `| --- | ---: |`,
    categoryRows,
    ``,
    `## Selected Components`,
    ``,
    componentSection || '- None',
    ``,
    `---`,
    ``,
    `## Pages`,
    ``,
    `| # | Name | Type | Route |`,
    `| ---: | --- | --- | --- |`,
    pageRows,
    ``,
    `---`,
    ``,
    `## Quick Start`,
    ``,
    `\`\`\`bash`,
    `${packageManager} install`,
    `${packageManager} run dev`,
    `\`\`\``,
    ``,
  ].join('\n');

  await fs.writeFile(briefPath, lines, 'utf-8');
  onProgress('Brief.md was missing and has been re-created with full detail.');
}

// ── Build brief context object (shared between REVIEWER_BRIEF.md and reviewCode) ─
function buildBriefContext({ clientBrief, content, styleDirection, selectedComponents, tsErrors, pages, enhancedPrompt }) {
  return {
    brandName:    clientBrief.brandName || content.brandName || 'Unknown Brand',
    tagline:      clientBrief.tagline || '',
    industry:     clientBrief.industry || '',
    aesthetic:    styleDirection.aesthetics?.[0] || 'Minimal',
    siteType:     styleDirection.siteType || 'Landing',
    callToAction: clientBrief.callToAction || 'Get Started',
    components:   selectedComponents.map(c => ({ name: c.name, category: c.category })),
    pages,
    contentOverrides: enhancedPrompt?.contentOverrides || {},
  };
}

// ── Write REVIEWER_BRIEF.md to the project root ───────────────────────────────
async function writeReviewerBrief(projectPath, briefContext, tsErrors) {
  const { isComponentMapped, getMappedNames } = require('./generators/component-mapper.cjs');
  const compList   = briefContext.components || [];
  const mapped     = compList.filter(c => isComponentMapped(c.name)).map(c => c.name);
  const unmapped   = compList.map(c => c.name).filter(n => !mapped.includes(n));

  const sections = [
    `# REVIEWER_BRIEF.md`,
    `_Generated by BitForge — this file is your mission for the AI reviewer._`,
    ``,
    `## Project Info`,
    `| Field | Value |`,
    `|---|---|`,
    `| Brand | ${briefContext.brandName} |`,
    `| Tagline | ${briefContext.tagline || '—'} |`,
    `| Industry | ${briefContext.industry || '—'} |`,
    `| Aesthetic | ${briefContext.aesthetic} |`,
    `| Site Type | ${briefContext.siteType} |`,
    `| CTA | ${briefContext.callToAction} |`,
    ``,
    `## Components`,
    `### Mapped (template-generated, should be working):`,
    mapped.length > 0 ? mapped.map(n => `- ✓ ${n}`).join('\n') : '- (none)',
    ``,
    `### Unmapped (rendered as placeholder divs — YOU MUST FIX THESE):`,
    unmapped.length > 0 ? unmapped.map(n => `- ✗ ${n} → find it in src/components/, implement real usage`).join('\n') : '- (all components mapped, nothing to fix here)',
    ``,
    `## TypeScript Errors`,
    tsErrors
      ? `\`\`\`\n${tsErrors.slice(0, 3000)}\n\`\`\``
      : '✓ No TypeScript errors — tsc was clean.',
    ``,
    `## Priority Fix Order`,
    `1. **Unmapped components** (listed above) — replace placeholder divs with real component usage`,
    `2. **TypeScript errors** (listed above) — fix all type errors`,
    `3. **Content** — replace any generic text with brand-specific copy:`,
    `   - Brand name: "${briefContext.brandName}"`,
    `   - Tagline: "${briefContext.tagline || 'Use brand voice'}"`,
    `   - CTA: "${briefContext.callToAction}"`,
    `4. **Aesthetic consistency** — every section must follow ${briefContext.aesthetic} style rules`,
    `5. **Z-index** — backgrounds: z:0, content: z:10+, nav: z:100+`,
    ``,
    `## Rules`,
    `- DO NOT rewrite files that have no issues`,
    `- DO NOT add new dependencies — all packages are already installed`,
    `- DO NOT add placeholder comments or TODO comments`,
    `- Use CSS variables from \`:root\` (--color-bg, --color-text, --color-accent, --color-primary)`,
    `- **Text contrast**: NEVER set text the same or similar color as its background. Every \`<p>\`, \`<h1>\`–\`<h6>\`, \`<span>\`, \`<li>\` must have \`color: 'var(--color-text)'\` (or a contrasting explicit color). If a section has a dark surface background, use a light text color explicitly.`,
    `- **All text must be readable**: if in doubt, add \`color: 'var(--color-text)'\` explicitly — never rely on inheritance alone when background colors change between sections.`,
    `- When finished with all fixes, output: DONE`,
    ``,
    `## Brief Context JSON`,
    `\`\`\`json`,
    JSON.stringify(briefContext, null, 2),
    `\`\`\``,
  ];

  await fs.writeFile(path.join(projectPath, 'REVIEWER_BRIEF.md'), sections.join('\n'), 'utf-8');
}

/**
 * Handles post-generation steps: open VS Code, run dev server.
 */
async function finalize({ fullPath, options, onProgress, onLog, spawn, taskId, event }) {
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
      cwd: fullPath,
      shell: true,
      windowsHide: true,
      env: { ...process.env, BROWSER: 'chrome' },
    });

    const handleOutput = (data) => { onLog(data.toString()); };
    childProcess.stdout.on('data', handleOutput);
    childProcess.stderr.on('data', handleOutput);
  }

  onProgress(`✓ Project ready at ${fullPath}`);
  return {
    success: true,
    path: fullPath,
    childProcess,
    message: `Project created at:\n${fullPath}`,
  };
}

async function generateStructure(payload, event, taskId) {
  try {
    const { projectName, outputPath } = payload;
    if (!outputPath) throw new Error('No output path selected. Please choose a folder first.');

    const safeProjectName = (projectName || 'my-app').replace(/[^a-z0-9-_]/gi, '-');
    const fullPath = path.join(path.resolve(outputPath), safeProjectName);

    const onProgress = (msg) => {
      console.log(`[Structure:${taskId}] ${msg}`);
      if (event && event.sender) event.sender.send('generate-progress', msg, taskId);
    };
    const onLog = (msg) => {
      process.stdout.write(msg);
      if (event && event.sender) event.sender.send('generate-log', msg, taskId);
    };

    const result = await _generateStructure({ ...payload, onProgress, onLog }, event, taskId);

    if (result.success && payload.openWhenDone) {
      try { const { execSync } = require('child_process'); execSync(`code "${fullPath}"`, { timeout: 5000 }); }
      catch (err) { console.warn('[DemoCLI] Failed to open VS Code:', err.message); }
    }

    return result;
  } catch (error) {
    console.error('[DemoCLI] generateStructure failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { generatePlayground, generateStructure };
