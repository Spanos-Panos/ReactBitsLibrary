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

/** Build a compact summary of the original preset for the brief */
function summarisePreset(preset) {
  try {
    const meta   = preset?.projectMeta   || preset?.meta   || {};
    const design = preset?.designTokens  || preset?.design || {};
    const comps  = preset?.components    || preset?.selectedComponents || [];

    const compNames = Array.isArray(comps)
      ? comps.map(c => c.name || c.component || '').filter(Boolean).join(', ')
      : '(none listed)';

    return [
      `Project: ${meta.title || preset?.projectName || 'Unknown'}`,
      `Mood / Style: ${meta.mood || design?.aesthetic || 'Not specified'}`,
      `Primary colour: ${design?.primaryColor || design?.primary || 'Not specified'}`,
      `Font: ${design?.fontFamily || design?.font || 'Not specified'}`,
      `ReactBits components used: ${compNames || '(none listed)'}`,
    ].join('\n');
  } catch {
    return '(preset summary unavailable)';
  }
}

/** Build the VISION_REWORK.md instruction document */
function buildReworkBrief(opts) {
  const {
    presetSummary,
    weaknessesMd,
    referenceImageFilename,
    screenshotFilename,
  } = opts;

  return `# VISION_REWORK — Instructions for Claude Code

You are reworking an existing Vite + React website. **Do NOT create a new project. Edit the existing source files only.**

---

## Original Project Context

${presetSummary}

---

## Design Reference Image

A reference image showing the TARGET appearance is saved in this project directory as:
  \`${referenceImageFilename}\`

Read that image. Your rework must visually match it as closely as possible using the existing React + CSS codebase.

---

## Before Screenshot

The current state of the project (what was generated initially) is saved as:
  \`${screenshotFilename}\`

Use this to understand what currently exists and what must be changed.

---

## Design Critique — What Is Wrong & Must Be Fixed

${weaknessesMd}

---

## Your Task

Rework the existing source files (primarily \`src/App.tsx\`, \`src/index.css\`, and any component files) to:

1. **Fix desktop layout** — The page must use the full viewport width (≥1280px). Use CSS Grid or Flexbox with a 12-column maximum constraint. No narrow single-column layouts clinging to the left edge.
2. **Match the reference image** — Layout, colour palette, typography scale, section order, and imagery placement should all match \`${referenceImageFilename}\`.
3. **Address every critique above** — Work through the weakness report item by item.
4. **Keep ReactBits component imports intact** — You may restructure how and where they are used, but keep all \`import\` statements valid.
5. **Typography hierarchy** — Hero numerals and display headings must be at poster scale (≥140px at desktop). Eyebrow labels, body, and captions must each occupy a distinct size tier.
6. **Imagery** — Every major section must reference an image, use a CSS gradient placeholder, or use intentional negative space with monospace annotation. Never leave a section visually empty.
7. **Anti-patterns to avoid:**
   - DO NOT default to a centred narrow column
   - DO NOT make every section look identical
   - DO NOT use placeholder.com or similar — use CSS gradients as placeholders if no real images exist
   - DO NOT rewrite \`package.json\` or change dependencies

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
  const presetSummary = summarisePreset(originalPreset);

  const brief = buildReworkBrief({
    presetSummary,
    weaknessesMd: weaknessesMd || '(no critique provided)',
    referenceImageFilename: REF_FILENAME,
    screenshotFilename: SHOT_FILENAME,
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
    '--max-budget-usd 1.00',   // rework is more complex than initial gen
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
