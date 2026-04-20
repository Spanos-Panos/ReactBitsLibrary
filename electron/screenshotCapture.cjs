/**
 * screenshotCapture.cjs
 *
 * Standalone full-page screenshot module for generated Vite projects.
 * Used by:
 *   - polishPass.cjs  (for style fidelity analysis)
 *   - main.cjs        (auto-triggered after AI Build generation completes)
 *
 * Requirements:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Exports:
 *   captureAndSave(projectPath, onLog?) → { success, screenshotPath, error }
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { spawn } = require('child_process');

const BUILD_TIMEOUT_MS   = 3 * 60 * 1000; // 3 min
const PREVIEW_WAIT_MS    = 5000;           // wait for preview server ready
const PREVIEW_PORT       = 4173;           // Vite default preview port
const SCREENSHOT_WIDTH   = 1440;
const SCREENSHOT_HEIGHT  = 900;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Spawn a child process and wait for it to exit cleanly.
 * Resolves on exit code 0; rejects on non-zero or timeout.
 */
function spawnAndWait(cmd, args, cwd, onLog, timeout = BUILD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: true, windowsHide: true });
    child.stdout?.on('data', d => {
      const line = d.toString().trim();
      if (line) onLog?.(`[screenshot-build] ${line}`);
    });
    child.stderr?.on('data', () => { /* suppress */ });
    const t = setTimeout(() => {
      child.kill();
      reject(new Error(`Timed out after ${timeout / 1000}s`));
    }, timeout);
    child.on('close', code => {
      clearTimeout(t);
      code === 0 ? resolve() : reject(new Error(`Process exited with code ${code}`));
    });
    child.on('error', err => { clearTimeout(t); reject(err); });
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build the project, start the preview server, capture a full-page screenshot,
 * and save it to {projectPath}/bitforge-screenshot.png.
 *
 * @param {string}   projectPath  - Absolute path to the generated project root
 * @param {Function} [onLog]      - Optional progress callback (msg: string) => void
 * @returns {Promise<{ success: boolean, screenshotPath?: string, error?: string }>}
 */
async function captureAndSave(projectPath, onLog) {
  const log = msg => { if (onLog) onLog(msg); };
  const outputPath = path.join(projectPath, 'bitforge-screenshot.png');

  // ── Guard: Playwright optional dep ──────────────────────────────────────────
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    const err = 'Playwright not installed — run: npm i -D playwright && npx playwright install chromium';
    log(`[Screenshot] ⚠ ${err}`);
    return { success: false, error: err };
  }

  // ── 1. Build the project ───────────────────────────────────────────────────
  log('[Screenshot] Building project...');
  try {
    await spawnAndWait('npm', ['run', 'build'], projectPath, log, BUILD_TIMEOUT_MS);
    log('[Screenshot] Build complete.');
  } catch (e) {
    const err = `Build failed: ${e.message}`;
    log(`[Screenshot] ✗ ${err}`);
    return { success: false, error: err };
  }

  // ── 2. Start preview server ────────────────────────────────────────────────
  log('[Screenshot] Starting preview server...');
  const previewProc = spawn('npm', ['run', 'preview'], {
    cwd: projectPath,
    shell: true,
    windowsHide: true,
  });

  // Give the server time to come up
  await sleep(PREVIEW_WAIT_MS);

  let browser = null;

  try {
    // ── 3. Launch headless Chromium & screenshot ───────────────────────────
    log(`[Screenshot] Launching headless Chromium at ${SCREENSHOT_WIDTH}px...`);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
    });

    await page.goto(`http://localhost:${PREVIEW_PORT}`, {
      waitUntil: 'networkidle',
      timeout: 25_000,
    });

    const buffer = await page.screenshot({ fullPage: true });
    fs.writeFileSync(outputPath, buffer);
    log(`[Screenshot] ✓ Saved: ${outputPath}`);

    return { success: true, screenshotPath: outputPath };
  } catch (e) {
    const err = `Screenshot failed: ${e.message}`;
    log(`[Screenshot] ✗ ${err}`);
    return { success: false, error: err };
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    // Kill preview server process tree
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(
          `taskkill /pid ${previewProc.pid} /f /t`,
          { stdio: 'ignore', timeout: 4000 }
        );
      } else {
        previewProc.kill('SIGTERM');
      }
    } catch { /* ignore */ }
    log('[Screenshot] Preview server stopped.');
  }
}

module.exports = { captureAndSave };
