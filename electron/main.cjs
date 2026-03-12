const { app, BrowserWindow, ipcMain, dialog } = require("electron");
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

ipcMain.handle("generate-playground", async (event, category, name, usageCode, componentFiles) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Select Empty Folder for Playground",
    properties: ["openDirectory", "createDirectory"],
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, error: "Canceled" };
  }

  const targetDir = filePaths[0];
  const projectDir = path.join(targetDir, "reactbits-playground");

  try {
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // 1. Create package.json
    fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify({
      name: "reactbits-playground",
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0"
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
    <title>ReactBits Playground</title>
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
    fs.writeFileSync(path.join(srcDir, "index.css"), `body { margin: 0; font-family: sans-serif; background: #000; color: #fff; }`);

    // 7. Copy component files
    const compDir = path.join(srcDir, "components", name);
    fs.mkdirSync(compDir, { recursive: true });
    
    for (const file of componentFiles) {
      fs.writeFileSync(path.join(compDir, file.name), file.content);
    }

    // 8. Create App.tsx (Best effort)
    // We rewrite `./Name` to `./components/Name/Name`
    let appContent = usageCode.replace(new RegExp("from\\s+['\"]\\.\\/" + name + "['\"]", 'g'), `from './components/${name}/${name}'`);
    appContent = appContent.replace(new RegExp("from\\s+['\"]\\.\\/" + name + "\\.(jsx|tsx|js|ts)['\"]", 'g'), `from './components/${name}/${name}'`);

    // Add a default wrapper if it doesn't have an export Component
    if (!appContent.includes("export default") && !appContent.includes("const App =")) {
      // Split imports and body
      const lines = appContent.split('\\n');
      const importLines = lines.filter(l => l.trim().startsWith('import '));
      const bodyLines = lines.filter(l => !l.trim().startsWith('import '));
      
      appContent = `${importLines.join('\\n')}

export default function App() {
  ${bodyLines.join('\\n  ')}
  return null; // Fallback
}
`;
    }

    fs.writeFileSync(path.join(srcDir, "App.tsx"), `// Note: This was auto-generated.\\n// You might need to adjust the code below to render correctly.\\n\\n${appContent}`);

    return { success: true, path: projectDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

