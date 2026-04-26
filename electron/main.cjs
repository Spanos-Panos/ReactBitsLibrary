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
let mainWindow = null;

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
const { buildBudgetPlan, clampStageBudget, GLOBAL_TASK_CAP_USD } = require("./budgetPolicy.cjs");
const taskBudgetLedger = new Map(); // key: projectPath -> budget metadata

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
const {
  validationFailure,
  shapeFailure,
  runWithRetry,
  validateEnhancePromptPayload,
  validateGeneratePlaygroundArgs,
  validateStructurePayload,
} = require("./ipcContracts.cjs");

ipcMain.handle("select-directory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Select Destination Folder",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle("shell-open-path", async (event, folderPath) => {
  if (!folderPath) return;
  require('electron').shell.openPath(folderPath);
});

ipcMain.handle("check-directory-exists", async (event, folderPath) => {
  if (!folderPath) return false;
  try {
    return require('fs').existsSync(folderPath);
  } catch {
    return false;
  }
});

ipcMain.handle("open-in-vscode", async (event, folderPath) => {
  if (!folderPath) return;
  const { exec } = require('child_process');
  const path = require('node:path');
  
  // Ensure we have an absolute, platform-specific path
  const absolutePath = path.resolve(folderPath);
  
  console.log(`[Main] Opening in VS Code: ${absolutePath}`);
  
  // On Windows, 'code "path"' is the most reliable way to open a folder.
  // We avoid the double-exec pattern which was causing two windows to open.
  exec(`code "${absolutePath}"`, (err) => {
    if (err) {
      console.error(`[Main] Primary VS Code open failed for "${absolutePath}":`, err.message);
      
      // Fallback: try 'code .' with cwd as a last resort
      console.log(`[Main] Attempting fallback with cwd...`);
      exec(`code .`, { cwd: absolutePath }, (err2) => {
        if (err2) {
          console.error(`[Main] Fallback VS Code open also failed for "${absolutePath}":`, err2.message);
        } else {
          console.log(`[Main] Fallback open succeeded.`);
        }
      });
    } else {
      console.log(`[Main] VS Code opened successfully.`);
    }
  });
});

const { generatePlayground, generateStructure } = require("../DemoCLI/index.cjs");
const { savePrompt, getHistory, clearHistory, openHistoryFolder, openPresetsFolder, savePreset, listPresets, deletePreset, importPresetFromFile } = require("./storage.cjs");

ipcMain.handle("generate-playground", async (event, ...args) => {
  const validation = validateGeneratePlaygroundArgs(args);
  if (validation.error) {
    return validationFailure("validation", validation.error);
  }

  const taskId = validation.taskId;
  let result;
  try {
    if (validation.isRichPayload) {
      const payload = args[0];
      const budgetPlan = buildBudgetPlan({
        selectedComponents: payload.selectedComponents || [],
        pages: payload.options?.pages || [],
      });
      payload.options = {
        ...payload.options,
        budgetPlan,
        aiBudgetUsd: clampStageBudget(budgetPlan.generationCapUsd, 0.6),
      };
      if (event?.sender) {
        event.sender.send(
          "generate-log",
          `[Budget] Global cap: $${GLOBAL_TASK_CAP_USD.toFixed(2)} | Enhance reserve: $${budgetPlan.enhanceReserveUsd.toFixed(2)} | Generation cap: $${payload.options.aiBudgetUsd.toFixed(2)} | Rework reserve: $${budgetPlan.reworkCapUsd.toFixed(2)}\n`,
          taskId
        );
      }
    }

    result = await runWithRetry("generate-playground", async () => {
      if (validation.isRichPayload) {
        const payload = args[0];
        return generatePlayground(payload, event, taskId);
      }

      // Legacy Positional Arguments (Single Component)
      const [category, name, usageCode, componentFiles, options] = args;
      return generatePlayground({
        category, name, usageCode, componentFiles, options,
        selectedComponents: [{ category, name, files: componentFiles, usageMarkdown: usageCode }]
      }, event, taskId);
    }, {
      retries: 1,
      timeoutMs: 20 * 60 * 1000,
      shouldRetry: (msg) => /timeout|network|econn|etimedout|429/i.test(msg),
      onRetry: (attempt, retries, message) => {
        console.warn(`[Main] generate-playground retry ${attempt}/${retries}: ${message}`);
        if (event?.sender) event.sender.send("generate-log", `[System] generate-playground retry ${attempt}/${retries}: ${message}\n`, taskId);
      },
    });
  } catch (error) {
    return shapeFailure("generate-playground", error);
  }
  
  // If a child process was started, track it in memory AND persist to the registry file.
  // The registry file survives force-kills so the next startup can clean up orphans.
  if (result.childProcess) {
    activeProcesses.set(taskId, { proc: result.childProcess, fullPath: result.path });
    registryAdd(taskId, result.childProcess.pid, result.path);
    // CRITICAL: Must delete this before returning to renderer to avoid 'An object could not be cloned' error
    delete result.childProcess;
  }

  if (validation.isRichPayload && result.success && result.path) {
    const budgetPlan = args[0]?.options?.budgetPlan;
    const generationCap = clampStageBudget(args[0]?.options?.aiBudgetUsd ?? budgetPlan?.generationCapUsd, 0.6);
    taskBudgetLedger.set(result.path, {
      globalCapUsd: GLOBAL_TASK_CAP_USD,
      generationCapUsd: generationCap,
      createdAt: Date.now(),
    });
  }



  return result;
});

ipcMain.handle("generate-structure", async (event, options) => {
  const validationError = validateStructurePayload(options);
  if (validationError) return validationFailure("validation", validationError);
  const taskId = `structure-${Date.now()}`;
  try {
    return await runWithRetry("generate-structure", () => generateStructure(options, event, taskId), {
      retries: 1,
      timeoutMs: 10 * 60 * 1000,
      shouldRetry: (msg) => /timeout|network|econn|etimedout/i.test(msg),
      onRetry: (attempt, retries, message) => {
        if (event?.sender) event.sender.send("generate-log", `[System] generate-structure retry ${attempt}/${retries}: ${message}\n`, taskId);
      },
    });
  } catch (error) {
    return shapeFailure("generate-structure", error);
  }
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

// Preset IPC Handlers
ipcMain.handle("preset-save",   (_event, preset) => savePreset(preset));
ipcMain.handle("preset-list",   ()               => listPresets());
ipcMain.handle("preset-delete", (_event, id)     => deletePreset(id));
ipcMain.handle("preset-open-folder", ()          => openPresetsFolder());
ipcMain.handle("preset-import", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import Preset',
    filters: [{ name: 'JSON Preset', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return { canceled: true };
  return importPresetFromFile(filePaths[0]);
});



// Single file picker (for MD and reference image uploads)
ipcMain.handle("pick-single-file", async (event, filters) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (canceled || !filePaths.length) return { canceled: true };
  const filePath = filePaths[0];
  const ext = require('path').extname(filePath).slice(1).toLowerCase();
  // Image: return base64
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    const data = fs.readFileSync(filePath);
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return {
      canceled: false,
      path: filePath,
      base64: `data:image/${mime};base64,${data.toString('base64')}`,
    };
  }
  // Text file: return content
  const content = fs.readFileSync(filePath, 'utf-8');
  return { canceled: false, path: filePath, content };
});

// Design inspiration image picker
ipcMain.handle("design-pick-images", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (canceled || !filePaths.length) return [];
  const fs = require('fs');
  return filePaths.map(p => {
    const data = fs.readFileSync(p);
    const ext = path.extname(p).slice(1).replace('jpg', 'jpeg');
    return { name: path.basename(p), path: p, base64: `data:image/${ext};base64,${data.toString('base64')}` };
  });
});

ipcMain.handle("enhance-prompt", async (event, payload) => {
  const validationError = validateEnhancePromptPayload(payload);
  if (validationError) return validationFailure("validation", validationError);
  try {
    return await runWithRetry("enhance-prompt", () => enhancePrompt(payload), {
      retries: 2,
      timeoutMs: 2 * 60 * 1000,
      shouldRetry: (msg) => /timeout|network|econn|etimedout|429|rate limit|temporarily unavailable/i.test(msg),
      onRetry: (attempt, retries, message) => {
        if (event?.sender) event.sender.send("generate-log", `[System] enhance-prompt retry ${attempt}/${retries}: ${message}\n`, "enhance");
      },
    });
  } catch (error) {
    return shapeFailure("enhance-prompt", error);
  }
});



ipcMain.handle("add-component", async (event, { name, category, language, code, css, install, usage }) => {
  try {
    // Sanitize: allow only letters and numbers (PascalCase friendly)
    const safeName = (name || "").replace(/[^a-zA-Z0-9]/g, "");
    if (!safeName) return { ok: false, error: "Invalid component name. Use letters and numbers only." };

    const validCategories = ["Components", "Animations", "Backgrounds", "TextAnimations"];
    if (!validCategories.includes(category)) return { ok: false, error: "Invalid category." };

    const ext = (language || "ts-css").startsWith("ts") ? ".tsx" : ".jsx";
    const isTailwind = (language || "").includes("tailwind");

    const compDir = path.join(__dirname, "..", "ReactBitsComponents", category, safeName);
    await fs.promises.mkdir(compDir, { recursive: true });

    await fs.promises.writeFile(path.join(compDir, `${safeName}${ext}`), code || "", "utf-8");
    if (!isTailwind && css && css.trim()) {
      await fs.promises.writeFile(path.join(compDir, `${safeName}.css`), css, "utf-8");
    }
    await fs.promises.writeFile(path.join(compDir, `${safeName}Install.md`), install || "", "utf-8");
    await fs.promises.writeFile(path.join(compDir, `Usage${safeName}.md`), usage || "", "utf-8");

    // Update the static manifest so the new component survives app restarts
    const manifestPath = path.join(__dirname, "..", "src", "reactbits-manifest.json");
    let manifestData = [];
    try {
      manifestData = JSON.parse(await fs.promises.readFile(manifestPath, "utf-8"));
    } catch {}
    const newEntry = {
      id: `${category}/${safeName}`,
      name: safeName,
      category,
      usageMarkdown: usage || "",
      relativePath: `ReactBitsComponents/${category}/${safeName}/Usage${safeName}.md`,
    };
    manifestData = manifestData.filter((e) => e.id !== newEntry.id);
    manifestData.push(newEntry);
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifestData, null, 2), "utf-8");

    return { ok: true, entry: newEntry };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

