const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const path = require("node:path");

// Load .env configuration
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { enhancePrompt } = require("./promptEnhancer.cjs");
const isDev = process.env.NODE_ENV === "development";

const activeProcesses = new Map(); // Map<taskId, { proc, fullPath }>
const { exec, spawn, execSync } = require('child_process');
let appIsQuitting = false; // Guards before-quit to prevent re-entrancy loops

// ─── Survivor Registry ────────────────────────────────────────────────────────
// Writes every running dev-server PID + path to a temp JSON file so that
// even if Electron is force-killed (Ctrl+C via concurrently, Task Manager, etc.)
// the next startup will find and kill any leftover processes automatically.
const REGISTRY_PATH = require('path').join(require('os').tmpdir(), 'reactbits-active-servers.json');

function _regLoad() {
  try { return JSON.parse(require('fs').readFileSync(REGISTRY_PATH, 'utf-8')); } catch { return {}; }
}
function _regSave(data) {
  try { require('fs').writeFileSync(REGISTRY_PATH, JSON.stringify(data)); } catch {}
}
function registryAdd(taskId, pid, fullPath) {
  const r = _regLoad(); r[taskId] = { pid, fullPath }; _regSave(r);
}
function registryRemove(taskId) {
  const r = _regLoad(); delete r[taskId]; _regSave(r);
}
function registryClear() {
  try { require('fs').unlinkSync(REGISTRY_PATH); } catch {}
}

// Called on startup — kills any processes left over from a previous crashed/force-killed session.
function cleanupSurvivorsFromRegistry() {
  const survivors = _regLoad();
  const entries = Object.values(survivors);
  if (entries.length === 0) return;
  console.log(`[Main] Found ${entries.length} leftover dev server(s) from a previous session. Cleaning up...`);

  for (const { pid } of entries) {
    try { execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore', timeout: 3000 }); } catch {}
  }

  if (process.platform === 'win32') {
    const dirs = entries
      .map(e => e.fullPath).filter(Boolean)
      .map(p => path.basename(p).replace(/'/g, "''"));
    if (dirs.length > 0) {
      const cond = dirs.map(d => `$_.CommandLine -like '*${d}*'`).join(' -or ');
      try {
        execSync(
          `powershell -Command "Get-WmiObject Win32_Process | Where-Object { ${cond} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
          { timeout: 8000, stdio: 'ignore' }
        );
      } catch {}
    }
  }
  registryClear();
  console.log('[Main] Previous session cleanup complete.');
}

// Per-task kill — used when user clicks × or CLEAR ALL from the UI.
function killProcessTree(proc, taskId = 'unknown', fullPath = null) {
  if (!proc || !proc.pid) return;
  const pid = proc.pid;
  if (process.platform === 'win32') {
    console.log(`[Main] Terminating Task:${taskId} (PID:${pid})...`);
    try {
      execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore', timeout: 4000 });
      console.log(`[Main] PID kill succeeded for ${pid}`);
    } catch (e) {
      if (!e.message?.includes('not found')) console.error(`[Main] PID kill failed for ${pid}:`, e.message);
    }
    if (fullPath) {
      const dirName = path.basename(fullPath).replace(/'/g, "''");
      try {
        execSync(
          `powershell -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${dirName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
          { timeout: 6000, stdio: 'ignore' }
        );
        console.log(`[Main] Path-based cleanup done for: ${dirName}`);
      } catch {}
    }
  } else {
    try { process.kill(-proc.pid, 'SIGTERM'); } catch { proc.kill('SIGTERM'); }
  }
}

// Bulk kill — used on app quit. Runs ONE PowerShell query for all paths at once
// instead of N sequential invocations, so startup overhead is paid only once.
function killAllActiveProcesses() {
  if (activeProcesses.size === 0) return;
  console.log(`[Main] Killing ${activeProcesses.size} background process(es) before quit...`);

  // Pass 1: PID tree kills (fast, ~5ms each)
  for (const [taskId, entry] of activeProcesses.entries()) {
    if (!entry.proc?.pid) continue;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${entry.proc.pid} /f /t`, { stdio: 'ignore', timeout: 3000 });
        console.log(`[Main] PID kill sent: Task ${taskId} (PID ${entry.proc.pid})`);
      } else {
        try { process.kill(-entry.proc.pid, 'SIGKILL'); } catch { entry.proc.kill('SIGKILL'); }
      }
    } catch (e) {
      if (!e.message?.includes('not found')) console.error(`[Main] PID kill failed:`, e.message);
    }
  }

  // Pass 2 (Windows): Single PowerShell invocation for ALL project paths.
  // npm can detach vite into a sub-tree that survives taskkill by parent PID.
  // This catches every node.exe whose command line mentions any of our project dirs.
  if (process.platform === 'win32') {
    const projectDirs = [...activeProcesses.values()]
      .filter(e => e.fullPath)
      .map(e => path.basename(e.fullPath).replace(/'/g, "''"));

    if (projectDirs.length > 0) {
      const conditions = projectDirs
        .map(d => `$_.CommandLine -like '*${d}*'`)
        .join(' -or ');
      try {
        execSync(
          `powershell -Command "Get-WmiObject Win32_Process | Where-Object { ${conditions} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
          { timeout: 10000, stdio: 'ignore' }
        );
        console.log('[Main] Path-based batch cleanup complete.');
      } catch (e) {
        console.error('[Main] Path-based cleanup error:', e.message);
      }
    }
  }

  activeProcesses.clear();
  registryClear(); // Also wipe the on-disk registry so startup cleanup won't re-kill
  console.log('[Main] All background processes cleared.');
}

// ─── Watchdog ─────────────────────────────────────────────────────────────────
// Spawns an out-of-tree watchdog process that kills demo servers if Electron is
// force-killed (e.g. Ctrl+C via concurrently). Uses a double-fork so the watchdog
// is NOT in Electron's process tree and survives `taskkill /T`.
function spawnWatchdog() {
  if (process.platform !== 'win32') return; // taskkill is Windows-only
  try {
    const nodeExe = execSync('where node', { encoding: 'utf8', timeout: 3000 })
      .split('\n')[0].trim();
    if (!nodeExe) return;

    const launcherPath = path.join(__dirname, 'watchdog-launcher.cjs');
    const watchdogPath = path.join(__dirname, 'watchdog.cjs');

    const launcher = spawn(nodeExe, [launcherPath, nodeExe, watchdogPath, String(process.pid)], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    launcher.unref();
    console.log(`[Main] Watchdog launched (monitoring PID ${process.pid})`);
  } catch (e) {
    console.warn('[Main] Could not spawn watchdog — startup cleanup is the fallback:', e.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  mainWindow.maximize();
  mainWindow.show();

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log("Window finished loading content");
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error("Window FAILED to load:", errorCode, errorDescription);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const { autoUpdater } = require("electron-updater");

app.whenReady().then(() => {
  cleanupSurvivorsFromRegistry(); // Kill any orphans from the previous session first
  createWindow();
  spawnWatchdog(); // Out-of-tree process that kills demo servers if Electron is force-killed
  autoUpdater.checkForUpdatesAndNotify();
});

// Primary shutdown path.
// event.preventDefault() PAUSES Electron's quit cycle so our synchronous
// kills are guaranteed to finish before the process actually exits.
app.on("before-quit", (event) => {
  if (appIsQuitting) return; // Second call (after our app.quit() below) — let it proceed
  if (activeProcesses.size > 0) {
    event.preventDefault();
    appIsQuitting = true;
    killAllActiveProcesses();
    app.quit(); // Re-trigger; appIsQuitting=true so it won't loop
  }
});

// Last-resort backstop: fires even if Electron crashes or is force-killed.
// No PowerShell here — only fast PID kills since the process is already exiting.
process.on('exit', () => {
  for (const entry of activeProcesses.values()) {
    if (!entry.proc?.pid) continue;
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(`taskkill /pid ${entry.proc.pid} /f /t`, { stdio: 'ignore' });
      } else {
        try { process.kill(-entry.proc.pid, 'SIGKILL'); } catch {}
      }
    } catch {}
  }
});

// For SIGTERM/SIGINT: do the kills SYNCHRONOUSLY then exit immediately.
// We cannot rely on app.quit() here because concurrently uses tree-kill which
// sends a force-kill to electron.exe — by the time an async quit cycle would
// run, the process might already be dead. Synchronous execSync + process.exit
// is the only thing that can complete reliably under a force-kill scenario.
function handleForcedExit() {
  if (appIsQuitting) return;
  appIsQuitting = true;
  try { killAllActiveProcesses(); } catch {}
}
process.on('SIGTERM', () => { handleForcedExit(); process.exit(0); });
process.on('SIGINT',  () => { handleForcedExit(); process.exit(0); });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Generator IPC Setup
const fs = require("fs");

ipcMain.handle("select-directory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Select Destination Folder",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

const { generatePlayground } = require("../DemoCLI/index.cjs");
const { savePrompt, getHistory, clearHistory, openHistoryFolder } = require("./storage.cjs");

ipcMain.handle("generate-playground", async (event, ...args) => {
  let result;
  let taskId;

  // Polymorphic Handler: Detects if first arg is the new Rich Payload
  if (args.length === 3 && typeof args[0] === 'object' && args[0].options) {
    const payload = args[0];
    taskId = args[2];
    result = await generatePlayground(payload, event, taskId);
  } else {
    // Legacy Positional Arguments (Single Component)
    const [category, name, usageCode, componentFiles, options, tid] = args;
    taskId = tid;
    result = await generatePlayground({
      category, name, usageCode, componentFiles, options,
      selectedComponents: [{ category, name, files: componentFiles, usageMarkdown: usageCode }]
    }, event, taskId);
  }
  
  // If a child process was started, track it in memory AND persist to the registry file.
  // The registry file survives force-kills so the next startup can clean up orphans.
  if (result.childProcess) {
    activeProcesses.set(taskId, { proc: result.childProcess, fullPath: result.path });
    registryAdd(taskId, result.childProcess.pid, result.path);
    // CRITICAL: Must delete this before returning to renderer to avoid 'An object could not be cloned' error
    delete result.childProcess;
  }
  
  return result;
});

ipcMain.handle("terminate-task", async (event, taskId) => {
  const entry = activeProcesses.get(taskId);
  if (entry) {
    killProcessTree(entry.proc, taskId, entry.fullPath);
    activeProcesses.delete(taskId);
    registryRemove(taskId); // Remove from disk so startup cleanup won't re-kill
    return { success: true };
  }
  return { success: false, error: "No active process found for this task" };
});

// Storage IPC Handlers
ipcMain.handle("storage-save-prompt", async (event, data) => {
  return savePrompt(data);
});

ipcMain.handle("storage-get-history", async () => {
  return getHistory();
});

ipcMain.handle("storage-clear-history", async () => {
  return clearHistory();
});

ipcMain.handle("storage-open-folder", async () => {
  return openHistoryFolder();
});

ipcMain.handle("enhance-prompt", async (event, payload) => {
  return await enhancePrompt(payload);
});

