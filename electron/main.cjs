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

const activeProcesses = new Map();
const { exec, spawn } = require('child_process');

function killProcessTree(proc, taskId = 'unknown') {
  if (!proc || !proc.pid) return;
  const pid = proc.pid;
  try {
    if (process.platform === 'win32') {
      console.log(`[Main] Force-terminating process tree for Task:${taskId} (PID:${pid})...`);
      // /f = force, /t = tree (kill children too)
      exec(`taskkill /pid ${pid} /f /t`, (err) => {
        if (err) {
          // If the process is already gone, that's fine
          if (!err.message.includes('not found')) {
             console.error(`[Main] Taskkill failed for PID ${pid}:`, err.message);
          }
        } else {
          console.log(`[Main] Successfully killed process tree for PID ${pid}`);
        }
      });
    } else {
      console.log(`[Main] Killing process Group for Task:${taskId} (PID:${pid})...`);
      proc.kill('SIGTERM');
    }
  } catch (err) {
    console.error(`[Main] Error in killProcessTree for ${pid}:`, err);
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
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on("before-quit", () => {
  console.log("App quitting... killing all background processes");
  for (const [taskId, proc] of activeProcesses.entries()) {
    killProcessTree(proc, taskId);
  }
  activeProcesses.clear();
});

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

ipcMain.handle("generate-playground", async (event, category, name, usageCode, componentFiles, options, taskId) => {
  const result = await generatePlayground(category, name, usageCode, componentFiles, options, event, taskId);
  
  // If a child process was started, track it in the main process
  if (result.childProcess) {
    activeProcesses.set(taskId, result.childProcess);
    // CRITICAL: Must delete this before returning to renderer to avoid 'An object could not be cloned' error
    delete result.childProcess;
  }
  
  return result;
});

ipcMain.handle("terminate-task", async (event, taskId) => {
  const proc = activeProcesses.get(taskId);
  if (proc) {
    killProcessTree(proc, taskId);
    activeProcesses.delete(taskId);
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

