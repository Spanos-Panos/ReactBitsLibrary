const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const path = require("node:path");

const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
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

app.whenReady().then(createWindow);

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

ipcMain.handle("generate-playground", async (event, category, name, usageCode, componentFiles, options) => {
  const { installMethod, packageManager, installData, projectName, projectPath, openWhenDone } = options || {};
  
  const targetDir = projectPath;
  if (!targetDir) {
    return { success: false, error: "No destination selected" };
  }
  const safeProjectName = (projectName || "reactbits-playground-" + name.toLowerCase()).replace(/[^a-z0-9-_]/gi, '-');
  const projectDir = path.join(targetDir, safeProjectName);

  try {
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Parse dependencies from manual install data
    const additionalDeps = {};
    if (installMethod === 'manual' && installData && installData.manual) {
      const manualLine = installData.manual[packageManager] || "";
      const match = manualLine.match(/(?:add|install)\s+([^.]+)/);
      if (match && match[1]) {
        const pkgNames = match[1].trim().split(/\s+/);
        pkgNames.forEach(p => {
          if (p && !p.startsWith('-')) {
            additionalDeps[p] = "latest";
          }
        });
      }
    }

    // 1. Create package.json
    fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify({
      name: safeProjectName.toLowerCase(),
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        ...additionalDeps
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.2.0",
        typescript: "^5.0.0",
        vite: "^5.0.0"
      }
    }, null, 2));

    // 2. Create index.html
    fs.writeFileSync(path.join(projectDir, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ReactBits - ${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

    // 3. Create vite.config.ts
    fs.writeFileSync(path.join(projectDir, "vite.config.ts"), `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);

    // 4. Create tsconfig.json
    fs.writeFileSync(path.join(projectDir, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ["src"]
    }, null, 2));

    const srcDir = path.join(projectDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    // 5. Create main.tsx
    fs.writeFileSync(path.join(srcDir, "main.tsx"), `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

    // 6. Create index.css
    fs.writeFileSync(path.join(srcDir, "index.css"), `body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background: #111; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }`);

    // 7. Copy component files
    const compDir = path.join(srcDir, "components", name);
    fs.mkdirSync(compDir, { recursive: true });
    
    for (const file of componentFiles) {
      fs.writeFileSync(path.join(compDir, file.name), file.content);
    }

    // 8. Create README.md
    const cliCommand = (installData && installData.cli) ? (installData.cli[packageManager] || "") : "";
    fs.writeFileSync(path.join(projectDir, "README.md"), `# ReactBits - ${name}\n\nGenerated demo project for **${name}**.\n\n## Getting Started\n\n1. Install dependencies:\n   \`\`\`bash\n   ${packageManager} install\n   \`\`\`\n\n2. Run development server:\n   \`\`\`bash\n   ${packageManager} run dev\n   \`\`\`\n\n${cliCommand ? `## CLI Installation\n\n\`\`\`bash\n${cliCommand}\n\`\`\`` : ""}`);

    // 9. Create App.tsx (Best effort)
    let appContent = usageCode.replace(new RegExp("from\\s+['\"]\\.\\/" + name + "['\"]", 'g'), `from './components/${name}/${name}'`);
    appContent = appContent.replace(new RegExp("from\\s+['\"]\\.\\/" + name + "\\.(jsx|tsx|js|ts)['\"]", 'g'), `from './components/${name}/${name}'`);

    if (!appContent.includes("export default") && !appContent.includes("const App =")) {
      const lines = appContent.split('\n');
      const importLines = lines.filter(l => l.trim().startsWith('import '));
      const bodyLines = lines.filter(l => !l.trim().startsWith('import '));
      
      appContent = `${importLines.join('\n')}\n\nexport default function App() {\n  return (\n    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n      ${bodyLines.join('\n      ')}\n    </div>\n  );\n}\n`;
    }

    fs.writeFileSync(path.join(srcDir, "App.tsx"), `// Note: This was auto-generated.\n\n${appContent}`);

    if (openWhenDone) {
      electron.shell.openPath(projectDir);
    }

    return { success: true, path: projectDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

