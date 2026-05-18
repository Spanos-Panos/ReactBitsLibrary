const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

const reactBitsRoot = path.join(__dirname, "..", "ReactBitsComponents");
const universalRoot = path.join(__dirname, "..", "UniversalComponents");

function resolveComponentDir(category, name, library = "reactbits") {
  if (library === "universal") {
    return path.join(universalRoot, category, name);
  }
  return path.join(reactBitsRoot, category, name);
}

contextBridge.exposeInMainWorld("reactBitsApi", {
  getItems() { return loadCatalogItems(); },
  getDiagnostics() { return getDiagnostics(); },
  getComponentFiles(category, name, library = "reactbits") {
    const compDir = resolveComponentDir(category, name, library);
    const files = safeReadDir(compDir);
    const result = [];
    for (const f of files) {
      if (f.isFile() && !f.name.startsWith("Usage") && !f.name.endsWith("Install.md")) {
        try {
          const content = fs.readFileSync(path.join(compDir, f.name), "utf-8");
          result.push({ name: f.name, content });
        } catch { }
      }
    }
    return result;
  },
  getComponentFullContext(category, name, id, library = "reactbits") {
    const compDir = resolveComponentDir(category, name, library);

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

    let usage = "";
    try {
      usage = fs.readFileSync(path.join(compDir, `Usage${name}.md`), "utf-8");
    } catch {
      try {
        usage = fs.readFileSync(path.join(compDir, "Usage.md"), "utf-8");
      } catch {}
    }

    let install = "";
    try {
      install = fs.readFileSync(path.join(compDir, `${name}Install.md`), "utf-8");
    } catch {}

    return { id, name, category, library, files, usage, install };
  },
  generatePlayground(...args) {
    const [payloadOrCategory] = args;
    if (typeof payloadOrCategory === "object" && payloadOrCategory !== null && payloadOrCategory.options) {
      // For rich payload, we expect (payload, null, taskId)
      return ipcRenderer.invoke("generate-playground", args[0], args[1], args[2]);
    }
    return ipcRenderer.invoke("generate-playground", ...args);
  },
  onGenerateProgress(callback) {
    const handler = (_event, message, taskId) => callback(message, taskId);
    ipcRenderer.on("generate-progress", handler);
    return () => ipcRenderer.removeListener("generate-progress", handler);
  },
  onGenerateLog(callback) {
    const handler = (_event, message, taskId) => callback(message, taskId);
    ipcRenderer.on("generate-log", handler);
    return () => ipcRenderer.removeListener("generate-log", handler);
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
  },
  savePreset(preset) {
    return ipcRenderer.invoke("preset-save", preset);
  },
  listPresets() {
    return ipcRenderer.invoke("preset-list");
  },
  deletePreset(id) {
    return ipcRenderer.invoke("preset-delete", id);
  },
  openPresetsFolder() {
    return ipcRenderer.invoke("preset-open-folder");
  },
  importPreset() {
    return ipcRenderer.invoke("preset-import");
  },
  startPresetWatch() {
    return ipcRenderer.invoke("preset-watch-start");
  },
  stopPresetWatch() {
    return ipcRenderer.invoke("preset-watch-stop");
  },
  onPresetDirectoryChanged(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("preset-directory-changed", handler);
    return () => ipcRenderer.removeListener("preset-directory-changed", handler);
  },
  addComponent(payload) {
    return ipcRenderer.invoke("add-component", payload);
  },
  pickDesignImages() {
    return ipcRenderer.invoke("design-pick-images");
  },
  generateStructure(options) {
    return ipcRenderer.invoke("generate-structure", options);
  },
  openPath(path) {
    return ipcRenderer.invoke("shell-open-path", path);
  },
  checkDirectoryExists(path) {
    return ipcRenderer.invoke("check-directory-exists", path);
  },
  openInVSCode(path) {
    return ipcRenderer.invoke("open-in-vscode", path);
  },
  onPresetImported(callback) {
    const handler = (_event, result) => callback(result);
    ipcRenderer.on('preset-imported', handler);
    return () => ipcRenderer.removeListener('preset-imported', handler);
  },
});

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function buildItemFromUsageFile(root, library, category, usageFile) {
  const baseName = path.basename(usageFile, path.extname(usageFile));
  const name = baseName.replace(/^Usage/, "");
  const id = `${category}/${name}`;
  const fullPath = path.join(root, category, name, usageFile);

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
    library,
    usageMarkdown: usage,
    relativePath: path.relative(path.join(__dirname, ".."), fullPath).replace(/\\/g, "/"),
  };
}

function loadCatalogItems() {
  const items = [];
  const reactCategories = ["Components", "Animations", "Backgrounds", "TextAnimations"];

  for (const category of reactCategories) {
    const categoryDir = path.join(reactBitsRoot, category);
    const entries = safeReadDir(categoryDir);

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(categoryDir, entry.name);
      const files = safeReadDir(dirPath);
      const usageFile = files.find((f) => f.isFile() && f.name.startsWith("Usage") && f.name.endsWith(".md"));
      if (!usageFile) continue;
      items.push(buildItemFromUsageFile(reactBitsRoot, "reactbits", category, usageFile.name));
    }
  }

  if (fs.existsSync(universalRoot)) {
    const groups = safeReadDir(universalRoot).filter((e) => e.isDirectory());
    for (const group of groups) {
      const groupDir = path.join(universalRoot, group.name);
      const entries = safeReadDir(groupDir).filter((e) => e.isDirectory());
      for (const entry of entries) {
        const dirPath = path.join(groupDir, entry.name);
        const files = safeReadDir(dirPath);
        const usageFile = files.find((f) => f.isFile() && f.name.startsWith("Usage") && f.name.endsWith(".md"));
        if (!usageFile) continue;
        items.push(buildItemFromUsageFile(universalRoot, "universal", group.name, usageFile.name));
      }
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

  const items = loadCatalogItems();

  return {
    rootPath: reactBitsRoot,
    rootExists: fs.existsSync(reactBitsRoot),
    universalRoot,
    universalRootExists: fs.existsSync(universalRoot),
    itemsCount: items.length,
    categories,
  };
}

