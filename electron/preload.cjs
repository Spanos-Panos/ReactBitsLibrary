const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

const reactBitsRoot = path.join(__dirname, "..", "ReactBitsComponents");

contextBridge.exposeInMainWorld("reactBitsApi", {
  getItems() { return loadReactBitsItems(); },
  getDiagnostics() { return getDiagnostics(); },
  getComponentFiles(category, name) {
    const compDir = path.join(reactBitsRoot, category, name);
    const files = safeReadDir(compDir);
    const result = [];
    for (const f of files) {
      if (f.isFile() && !f.name.startsWith("Usage")) {
        try {
          const content = fs.readFileSync(path.join(compDir, f.name), "utf-8");
          result.push({ name: f.name, content });
        } catch { }
      }
    }
    return result;
  },
  getComponentFullContext(category, name, id) {
    const compDir = path.join(reactBitsRoot, category, name);
    
    // 1. Get Source Files
    const files = [];
    const entries = safeReadDir(compDir);
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith("Usage") && !entry.name.endsWith("Install.md")) {
        try {
          const content = fs.readFileSync(path.join(compDir, entry.name), "utf-8");
          files.push({ name: entry.name, content });
        } catch {}
      }
    }

    // 2. Get Usage Markdown
    let usage = "";
    try {
      usage = fs.readFileSync(path.join(compDir, `Usage${name}.md`), "utf-8");
    } catch {
      try {
        usage = fs.readFileSync(path.join(compDir, `Usage.md`), "utf-8");
      } catch {}
    }

    // 3. Get Install Markdown
    let install = "";
    try {
      install = fs.readFileSync(path.join(compDir, `${name}Install.md`), "utf-8");
    } catch {}

    return { id, name, category, files, usage, install };
  },
  generatePlayground(...args) {
    return ipcRenderer.invoke("generate-playground", ...args);
  },
  onGenerateProgress(callback) {
    ipcRenderer.on("generate-progress", (event, message, taskId) => {
      callback(message, taskId);
    });
  },
  onGenerateLog(callback) {
    ipcRenderer.on("generate-log", (event, message, taskId) => {
      callback(message, taskId);
    });
  },
  selectDirectory() {
    return ipcRenderer.invoke("select-directory");
  },
  savePrompt(data) {
    return ipcRenderer.invoke("storage-save-prompt", data);
  },
  getHistory() {
    return ipcRenderer.invoke("storage-get-history");
  },
  clearHistory() {
    return ipcRenderer.invoke("storage-clear-history");
  },
  openHistoryFolder() {
    return ipcRenderer.invoke("storage-open-folder");
  },
  enhancePrompt(payload) {
    return ipcRenderer.invoke("enhance-prompt", payload);
  },
  terminateTask(taskId) {
    return ipcRenderer.invoke("terminate-task", taskId);
  }
});

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function buildItemFromUsageFile(category, usageFile) {
  const baseName = path.basename(usageFile, path.extname(usageFile));
  const name = baseName.replace(/^Usage/, "");
  const id = `${category}/${name}`;
  const fullPath = path.join(reactBitsRoot, category, name, usageFile);

  let usage = "";
  try {
    usage = fs.readFileSync(fullPath, "utf-8");
  } catch {
    usage = "";
  }

  return {
    id,
    name,
    category,
    usageMarkdown: usage,
  };
}

function loadReactBitsItems() {
  const categories = ["Components", "Animations", "Backgrounds", "TextAnimations"];
  const items = [];

  for (const category of categories) {
    const categoryDir = path.join(reactBitsRoot, category);
    const entries = safeReadDir(categoryDir);

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(categoryDir, entry.name);
      const files = safeReadDir(dirPath);
      const usageFile = files.find((f) => f.isFile() && f.name.startsWith("Usage") && f.name.endsWith(".md"));
      if (!usageFile) continue;
      items.push(buildItemFromUsageFile(category, usageFile.name));
    }
  }

  return items;
}

function getDiagnostics() {
  const categories = ["Components", "Animations", "Backgrounds", "TextAnimations"].map((category) => {
    const categoryDir = path.join(reactBitsRoot, category);
    const entries = safeReadDir(categoryDir);
    const dirs = entries.filter((e) => e.isDirectory());
    let usageFiles = 0;
    for (const dir of dirs) {
      const dirPath = path.join(categoryDir, dir.name);
      const files = safeReadDir(dirPath);
      usageFiles += files.filter((f) => f.isFile() && f.name.startsWith("Usage") && f.name.endsWith(".md")).length;
    }
    return {
      name: category,
      exists: entries.length > 0,
      dirCount: dirs.length,
      usageFiles,
    };
  });

  const items = loadReactBitsItems();

  return {
    rootPath: reactBitsRoot,
    rootExists: fs.existsSync(reactBitsRoot),
    itemsCount: items.length,
    categories,
  };
}

