'use strict';
// Watchdog: runs independently of Electron, polls for its death, kills leftover demo servers.
// Spawned via double-fork so it is NOT in Electron's process tree and survives taskkill /T.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(require('os').tmpdir(), 'reactbits-active-servers.json');
const TARGET_PID = parseInt(process.argv[2], 10);

if (!TARGET_PID || isNaN(TARGET_PID)) process.exit(1);

// Uses process.kill(pid, 0) — asks the OS directly, no subprocess spawned, no window flash.
// Throws ESRCH if process doesn't exist, EPERM if it exists but we can't signal it (still alive).
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM'; // EPERM = exists but no permission; ESRCH = truly gone
  }
}

function killSurvivors() {
  let data;
  try { data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8')); }
  catch { process.exit(0); return; }

  const entries = Object.values(data);
  if (entries.length === 0) { process.exit(0); return; }

  // Pass 1: PID tree kills
  for (const { pid } of entries) {
    try { execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore', timeout: 3000, windowsHide: true }); } catch {}
  }

  // Pass 2: single PowerShell sweep for any vite sub-processes that survived PID kill
  const dirs = entries.map(e => e.fullPath).filter(Boolean)
    .map(p => path.basename(p).replace(/'/g, "''"));
  if (dirs.length > 0) {
    const cond = dirs.map(d => `$_.CommandLine -like '*${d}*'`).join(' -or ');
    try {
      execSync(
        `powershell -Command "Get-WmiObject Win32_Process | Where-Object { ${cond} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
        { timeout: 8000, stdio: 'ignore', windowsHide: true }
      );
    } catch {}
  }

  try { fs.unlinkSync(REGISTRY_PATH); } catch {}
  process.exit(0);
}

// Poll every 2 seconds — zero visible windows since isAlive() uses no subprocess
const timer = setInterval(() => {
  if (!isAlive(TARGET_PID)) {
    clearInterval(timer);
    // 600ms grace period: if it was a clean shutdown, before-quit will have already
    // cleared the registry. If it was a force-kill, the registry will still have entries.
    setTimeout(killSurvivors, 600);
  }
}, 2000);

// Safety: exit after 8 hours to prevent stale watchdogs accumulating
setTimeout(() => process.exit(0), 8 * 60 * 60 * 1000).unref();
