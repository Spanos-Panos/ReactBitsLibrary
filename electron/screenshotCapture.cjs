/**
 * screenshotCapture.cjs
 *
 * Standalone full-page screenshot module for generated Vite projects.
 * Used by:
 *   - polishPass.cjs  (for style fidelity analysis)
 *   - main.cjs        (auto-triggered after AI Build generation completes)
 *
 * Playwright is auto-installed on first use if missing.
 *
 * Exports:
 *   captureAndSave(projectPath, onLog?, deviceTarget?) → { success, screenshotPath, error }
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { spawn } = require('child_process');

const BUILD_TIMEOUT_MS   = 3 * 60 * 1000;
const PREVIEW_WAIT_MS    = 5000;
const PREVIEW_PORT       = 4173;

const DEVICE_VIEWPORTS = {
  mobile:   { width: 390,  height: 844  },
  tablet:   { width: 768,  height: 1024 },
  desktop:  { width: 1440, height: 900  },
  adaptive: { width: 1440, height: 900  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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

/**
 * Try to load playwright.chromium from cache/node_modules.
 * Returns the chromium BrowserType or null if not available.
 */
function tryRequirePlaywright() {
  try {
    Object.keys(require.cache)
      .filter(k => k.includes('playwright'))
      .forEach(k => delete require.cache[k]);
    return require('playwright').chromium;
  } catch {
    return null;
  }
}

/**
 * Ensure Playwright's chromium is available, auto-installing if needed.
 * Returns the chromium launcher object.
 *
 * Strategy: install playwright npm package, then run `playwright install chromium`.
 * The browser download is ~300 MB; on slow connections it can take 8-10 min.
 * If the download times out (e.g. on a slow line), Windows keeps the download
 * running even after child.kill() — so we poll for up to 6 more minutes rather
 * than immediately failing.
 */
async function ensurePlaywright(onLog) {
  const log = msg => { if (onLog) onLog(msg); };

  // Fast path — already installed
  const existing = tryRequirePlaywright();
  if (existing) return existing;

  log('[Screenshot] Playwright not found — auto-installing (one-time setup)...');
  const appRoot = path.resolve(__dirname, '..');

  // Step 1: npm install playwright package (~20s)
  try {
    await spawnAndWait('npm', ['install', 'playwright', '--no-save'], appRoot, log, 3 * 60 * 1000);
  } catch (e) {
    throw new Error(`Failed to install playwright package: ${e.message}. Please run manually: npm install playwright`);
  }

  // Step 2: download Chromium binaries (~300 MB total, 5-10 min on slow connections)
  log('[Screenshot] Downloading Chromium browser (~300 MB — one-time download, please wait)...');
  let downloadTimedOut = false;
  try {
    await spawnAndWait('npx', ['playwright', 'install', 'chromium'], appRoot, log, 12 * 60 * 1000);
    log('[Screenshot] ✓ Playwright ready.');
  } catch (e) {
    if (!e.message.startsWith('Timed out')) {
      throw new Error(`Playwright browser install failed: ${e.message}. Please run manually: npx playwright install chromium`);
    }
    downloadTimedOut = true;
    log('[Screenshot] Download is taking longer than expected — waiting for it to finish...');
  }

  if (downloadTimedOut) {
    // On Windows the download subprocess usually keeps running after kill().
    // Poll every 30s for up to 6 minutes.
    for (let i = 1; i <= 12; i++) {
      await sleep(30_000);
      const chromium = tryRequirePlaywright();
      if (chromium) {
        log(`[Screenshot] ✓ Playwright ready (download completed).`);
        return chromium;
      }
      log(`[Screenshot] Still waiting for download... (${i * 30}s elapsed)`);
    }
    throw new Error('Playwright install timed out. Please run manually: npx playwright install chromium');
  }

  const chromium = tryRequirePlaywright();
  if (!chromium) throw new Error('Playwright installed but could not be loaded. Please restart the app and retry.');
  return chromium;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build the project, start the preview server, capture a full-page screenshot,
 * and save it to {projectPath}/bitforge-screenshot.png.
 *
 * @param {string}   projectPath  - Absolute path to the generated project root
 * @param {Function} [onLog]      - Optional progress callback (msg: string) => void
 * @param {string}   [deviceTarget] - 'mobile' | 'tablet' | 'desktop' | 'adaptive'
 */
async function captureAndSave(projectPath, onLog, deviceTarget = 'adaptive') {
  const log = msg => { if (onLog) onLog(msg); };
  const outputPath = path.join(projectPath, 'bitforge-screenshot.png');

  const viewport = DEVICE_VIEWPORTS[deviceTarget] ?? DEVICE_VIEWPORTS.adaptive;
  log(`[Screenshot] Target device: ${deviceTarget} (${viewport.width}×${viewport.height})`);

  // ── Guard: ensure Playwright is installed ────────────────────────────────────
  let chromium;
  try {
    chromium = await ensurePlaywright(log);
  } catch (e) {
    log(`[Screenshot] ✗ ${e.message}`);
    return { success: false, error: e.message };
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

  await sleep(PREVIEW_WAIT_MS);

  let browser = null;

  try {
    // ── 3. Launch headless Chromium & screenshot ───────────────────────────
    log(`[Screenshot] Launching headless Chromium at ${viewport.width}px...`);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport });

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
