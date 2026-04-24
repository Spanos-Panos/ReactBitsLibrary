/**
 * visionRework.cjs
 *
 * Vision-guided project rework engine.
 * Takes an already-generated Vite+React project and reworks it to match
 * a design reference image + a weaknesses/critique markdown document.
 *
 * Steps:
 *  1. Optionally backs up src/ before touching anything
 *  2. Writes reference image to {projectPath}/bitforge-design-reference.png
 *  3. Writes {projectPath}/VISION_REWORK.md — structured Claude Code brief
 *  4. Invokes Claude Code (same pattern as codeGenerator.cjs) pointed at the project
 *  5. Streams live progress via onProgress callback (IPC → renderer)
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { spawn } = require('child_process');

const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes (rework is more involved than initial gen)

// ── Helpers ───────────────────────────────────────────────────────────────────

function spawnAndWait(cmd, args, cwd, onLog, timeout = 60_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: true, windowsHide: true });
    child.stdout?.on('data', d => { const l = d.toString().trim(); if (l) onLog?.(`  ${l}`); });
    child.stderr?.on('data', d => { const l = d.toString().trim(); if (l) onLog?.(`  ${l}`); });
    const t = setTimeout(() => { child.kill(); reject(new Error('Timed out')); }, timeout);
    child.on('close', code => { clearTimeout(t); code === 0 ? resolve() : reject(new Error(`Exit ${code}`)); });
    child.on('error', err => { clearTimeout(t); reject(err); });
  });
}

/** Minimal stream-JSON → human-readable message formatter (mirrors codeGenerator.cjs) */
function formatStreamMessage(msg) {
  try {
    if (msg.type === 'assistant') {
      const content = msg.message?.content || [];
      for (const block of content) {
        if (block.type === 'text' && block.text?.trim()) {
          const preview = block.text.trim().slice(0, 220).replace(/\n+/g, ' ');
          return `[Rework] ${preview}${block.text.length > 220 ? '…' : ''}`;
        }
        if (block.type === 'tool_use') {
          const name  = block.name  || 'tool';
          const input = block.input || {};
          if (name === 'Bash')                       return `[Bash] ${(input.command || '').slice(0, 120)}`;
          if (name === 'Edit' || name === 'MultiEdit') return `[Edit] ${input.file_path || input.path || '?'}`;
          if (name === 'Write')                      return `[Write] ${input.file_path || '?'}`;
          if (name === 'Read')                       return `[Read] ${input.file_path || input.path || '?'}`;
          return `[${name}] ${JSON.stringify(input).slice(0, 100)}`;
        }
      }
      return null;
    }
    if (msg.type === 'result') {
      const parts = [];
      if (msg.num_turns)       parts.push(`${msg.num_turns} turns`);
      if (msg.cost_usd != null) parts.push(`$${msg.cost_usd.toFixed(4)}`);
      const status = msg.subtype === 'success' ? 'Rework Complete' : `Ended (${msg.subtype})`;
      return `[Rework] ${status}${parts.length ? ` · ${parts.join(' · ')}` : ''}`;
    }
  } catch { /* ignore */ }
  return null;
}

/** Convert the full preset object to a rich human-readable Markdown block */
function presetToMarkdown(preset) {
  try {
    const meta   = preset?.projectMeta   || preset?.meta   || {};
    const design = preset?.designTokens  || preset?.design || {};
    const rules  = preset?.designRules   || {};
    const comps  = preset?.components    || preset?.selectedComponents || [];
    const layout = preset?.layout        || rules?.layoutConfig || [];
    const sizes  = rules?.sizes          || {};

    const compList = Array.isArray(comps) && comps.length
      ? comps.map(c => `- ${c.name || c.component || '?'}`).join('\n')
      : '- (none listed)';

    const colorList = [
      design?.primaryColor    && `- Primary: ${design.primaryColor}`,
      design?.secondaryColor  && `- Secondary: ${design.secondaryColor}`,
      design?.backgroundColor && `- Background: ${design.backgroundColor}`,
      design?.textColor       && `- Text: ${design.textColor}`,
      ...(rules?.colors || []).map(c => `- ${c}`),
    ].filter(Boolean).join('\n') || '- (not specified)';

    const fontList = [
      design?.fontFamily  && `- Body: ${design.fontFamily}`,
      design?.displayFont && `- Display: ${design.displayFont}`,
      ...(rules?.fonts || []).map(f => `- ${f}`),
    ].filter(Boolean).join('\n') || '- (not specified)';

    const zoneList = Array.isArray(layout) && layout.length
      ? layout.map(z => `- ${z.label || z.name || z.type || JSON.stringify(z)}`).join('\n')
      : '- (not specified)';

    const deviceLabel = {
      mobile:   'Mobile (0–480px)',
      tablet:   'Tablet (768–1024px)',
      desktop:  'Desktop (1024px+)',
      adaptive: 'Adaptive (all sizes)',
    };

    return `## Original Project Brief

**Project name:** ${meta.title || preset?.projectName || 'Unknown'}
**Mood / Style:** ${meta.mood || design?.aesthetic || rules?.styleDirection || 'Not specified'}
**Target device:** ${deviceLabel[sizes.optimizationTarget] || 'Adaptive (all sizes)'}
**Spacing scale:** ${sizes.spacingScale || 'default'}
**Border radius:** ${sizes.borderRadius || 'default'}

### Colors
${colorList}

### Typography
${fontList}

### Layout Zones
${zoneList}

### ReactBits Components Used
${compList}${preset?.projectPrompt ? `\n\n### Original User Prompt\n> ${preset.projectPrompt}` : ''}`;
  } catch {
    return '## Original Project Brief\n(preset data unavailable)';
  }
}

/** Detect the navbar component name from the preset component list */
function detectNavbarComponent(preset) {
  const comps = preset?.components || preset?.selectedComponents || [];
  if (!Array.isArray(comps)) return null;
  const navComp = comps.find(c => {
    const n = (c.name || c.component || '').toLowerCase();
    return n.includes('nav') || n.includes('menu') || n.includes('header');
  });
  return navComp ? (navComp.name || navComp.component) : null;
}

/** Build the VISION_REWORK.md instruction document */
function buildReworkBrief(opts) {
  const {
    presetMarkdown,
    weaknessesMd,
    referenceImageFilename,
    screenshotFilename,
    userPrompt,
    deviceTarget = 'adaptive',
    navbarComponentName,
  } = opts;

  const deviceLabel = {
    mobile:   'Mobile (0–480px) — design for 390px wide viewport',
    tablet:   'Tablet (768–1024px) — design for 768px wide viewport',
    desktop:  'Desktop (1024px+) — design for 1440px wide viewport',
    adaptive: 'Adaptive — fully responsive across all screen sizes',
  };
  const deviceDirective = deviceLabel[deviceTarget] || deviceLabel.adaptive;

  const navbarSection = navbarComponentName
    ? `\n## Navbar Component\n\nThe navbar component is **${navbarComponentName}**. Read its source in \`src/components/\` when adjusting navigation layout, link colours, or background styling.\n`
    : '';

  const userGuidanceSection = userPrompt && userPrompt.trim()
    ? `\n## User Guidance\n\n${userPrompt.trim()}\n`
    : '';

  return `# VISION_REWORK — Instructions for Claude Code

You are reworking an existing Vite + React website. **Do NOT create a new project. Edit the existing source files only.**
**Do not ask questions. Do not request clarification. Implement everything directly.**

---

${presetMarkdown}

---

## Target Device

${deviceDirective}

---
${navbarSection}
## Design Reference Image

The target appearance is saved as:
  \`${referenceImageFilename}\`

Read that image. Your rework must visually match it as closely as possible.

---

## Before Screenshot

The current state (generated output) is saved as:
  \`${screenshotFilename}\`

Use this to understand what currently exists and what must change.

---

## Design Critique — What Is Wrong & Must Be Fixed

${weaknessesMd}

---
${userGuidanceSection}
## Your Task

Rework the existing source files (primarily \`src/App.tsx\`, \`src/index.css\`, and any component files) to:

1. **Match the reference image** — Layout, colour palette, typography scale, section order, and imagery placement must match \`${referenceImageFilename}\`.
2. **Address every critique above** — Work through the weakness report item by item.
3. **Target device: ${deviceTarget}** — ${deviceDirective}.
4. **Keep ReactBits component imports intact** — Restructure usage but keep all \`import\` statements valid.
5. **Typography hierarchy** — Hero/display headings at poster scale (≥120px desktop). Distinct size tiers for eyebrow labels, body, and captions.
6. **Imagery** — Every major section has an image, CSS gradient placeholder, or intentional negative space. Never leave a section visually empty.
7. **Anti-patterns to avoid:**
   - DO NOT default to a centred narrow column
   - DO NOT make every section look identical
   - DO NOT use placeholder.com — use CSS gradients if no real images exist
   - DO NOT rewrite \`package.json\` or change dependencies
   - DO NOT ask questions — implement directly

When finished, output: **REWORK DONE**
`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}   opts.projectPath          Absolute path to existing project dir
 * @param {object}   opts.originalPreset       The JSON preset object used for generation
 * @param {string}   opts.referenceImagePath   Absolute path to the design-reference PNG/JPG
 * @param {string}   opts.screenshotPath       Absolute path to the bitforge-screenshot.png
 * @param {string}   opts.weaknessesMd         Full text content of the critique MD
 * @param {boolean}  opts.backupFirst          If true, copy src/ to src_backup/ before editing
 * @param {Function} opts.onProgress           Progress callback (msg: string) => void
 */
async function runVisionRework(opts) {
  const {
    projectPath,
    originalPreset,
    referenceImagePath,
    screenshotPath,
    weaknessesMd,
    userPrompt,
    deviceTarget = 'adaptive',
    maxBudgetUsd = 1.0,
    backupFirst = true,
    onProgress,
  } = opts;

  const notify = msg => { if (onProgress) onProgress(msg); };

  notify('[Rework] Starting vision rework pass...');

  // ── 1. Optional backup ──────────────────────────────────────────────────────
  if (backupFirst) {
    const srcDir    = path.join(projectPath, 'src');
    const backupDir = path.join(projectPath, 'src_backup');
    if (fs.existsSync(srcDir)) {
      try {
        fs.cpSync(srcDir, backupDir, { recursive: true });
        notify(`[Rework] Source backup → src_backup/`);
      } catch (e) {
        notify(`[Rework] Warning: backup failed (${e.message}) — continuing anyway`);
      }
    }
  }

  // ── 2. Copy reference image into project dir ────────────────────────────────
  const REF_FILENAME  = 'bitforge-design-reference.png';
  const SHOT_FILENAME = 'bitforge-screenshot.png';
  const refDest = path.join(projectPath, REF_FILENAME);

  try {
    if (referenceImagePath && fs.existsSync(referenceImagePath)) {
      fs.copyFileSync(referenceImagePath, refDest);
      notify(`[Rework] Reference image copied → ${REF_FILENAME}`);
    } else {
      notify('[Rework] Warning: reference image path invalid — skipping copy');
    }
  } catch (e) {
    notify(`[Rework] Warning: could not copy reference image: ${e.message}`);
  }

  // ── 3. Write VISION_REWORK.md instruction doc ───────────────────────────────
  const reworkMdPath = path.join(projectPath, 'VISION_REWORK.md');
  const presetMarkdown = presetToMarkdown(originalPreset);
  const navbarComponentName = detectNavbarComponent(originalPreset);

  const brief = buildReworkBrief({
    presetMarkdown,
    weaknessesMd: weaknessesMd || '(no critique provided)',
    referenceImageFilename: REF_FILENAME,
    screenshotFilename: SHOT_FILENAME,
    userPrompt,
    deviceTarget,
    navbarComponentName,
  });

  try {
    fs.writeFileSync(reworkMdPath, brief, 'utf-8');
    notify('[Rework] VISION_REWORK.md written.');
  } catch (e) {
    const err = `Failed to write VISION_REWORK.md: ${e.message}`;
    notify(`[Rework] ✗ ${err}`);
    throw new Error(err);
  }

  // ── 4. Invoke Claude Code ───────────────────────────────────────────────────
  notify('[Rework] Invoking Claude Code agent...');

  const prompt = 'Read VISION_REWORK.md and follow its instructions to rework this project. Output REWORK DONE when finished.';
  const safePrompt = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const cmd = [
    'npx @anthropic-ai/claude-code',
    '--print',
    '--verbose',
    '--dangerously-skip-permissions',
    '--output-format stream-json',
    '--include-partial-messages',
    '--model claude-sonnet-4-6',
    `--max-budget-usd ${Math.min(5, Math.max(0.05, Number(maxBudgetUsd) || 1.5)).toFixed(2)}`,
    `"${safePrompt}"`,
  ].join(' ');

  return new Promise((resolve, reject) => {
    let saw429 = false;

    const child = spawn(cmd, [], {
      cwd:  path.resolve(projectPath),
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    });

    const timeoutHandle = setTimeout(() => {
      notify('[Rework] ⏱ Timed out after 20 minutes. Terminating...');
      if (process.platform === 'win32') {
        try {
          require('child_process').execSync(
            `taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }
          );
        } catch { /* ignore */ }
      } else {
        child.kill('SIGTERM');
      }
      reject(new Error('[Rework] Timed out. Check the project for partial changes.'));
    }, TIMEOUT_MS);

    let stdoutBuf = '';
    child.stdout.on('data', data => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          const ui  = formatStreamMessage(msg);
          if (ui) notify(ui);
        } catch {
          if (!trimmed.startsWith('npm warn') && !trimmed.includes('added ') && trimmed.length > 2) {
            notify(trimmed);
          }
        }
      }
    });

    let stderrBuf = '';
    child.stderr.on('data', data => {
      stderrBuf += data.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('npm warn') || trimmed.includes('added ')) continue;
        if (trimmed.includes('429') || trimmed.toLowerCase().includes('rate limit')) saw429 = true;
        notify(`[stderr] ${trimmed}`);
      }
    });

    child.on('error', err => {
      clearTimeout(timeoutHandle);
      reject(new Error(`[Rework] Failed to start Claude Code: ${err.message}`));
    });

    child.on('close', async code => {
      clearTimeout(timeoutHandle);
      if (code === 0 || code === null) {
        notify('[Rework] Claude Code rework finished.');
        notify('[Rework] Verifying TypeScript...');
        try {
          await spawnAndWait('npx', ['tsc', '--noEmit'], projectPath, notify, 60_000);
          notify('[Rework] ✓ TypeScript check passed.');
        } catch {
          notify('[Rework] ⚠ TypeScript errors remain — check the project before shipping.');
        }
        resolve();
      } else if (saw429) {
        reject(new Error('[Rework] Rate limited by API. Please wait 60s and retry.'));
      } else {
        reject(new Error(`[Rework] Claude Code exited with code ${code}. Check the log for details.`));
      }
    });
  });
}

module.exports = { runVisionRework };
