const path = require('path');
const { join } = path;
const { exec } = require('child_process');
const { promisify } = require('util');
const { generateViteReact } = require('./generators/vite-react.cjs');

const execAsync = promisify(exec);

async function generatePlayground(category, name, usageCode, componentFiles, options, event, taskId) {
  try {
    if (!options.projectPath) {
      throw new Error("No destination path selected. Please choose a folder first.");
    }

    const safeProjectName = (options.projectName || "demo-" + name.toLowerCase()).replace(/[^a-z0-9-_]/gi, '-');
    const fullPath = join(path.resolve(options.projectPath), safeProjectName);
    const parentDir = path.resolve(options.projectPath);
    
    // Callback to send progress to the frontend UI
    const onProgress = (msg) => {
      console.log(`[ID:${taskId}] ${msg}`);
      if (event && event.sender) event.sender.send("generate-progress", msg, taskId);
    };

    const onLog = (msg) => {
      process.stdout.write(msg);
      if (event && event.sender) event.sender.send("generate-log", msg, taskId);
    };

    // 1. Scaffold the project and inject code
    await generateViteReact({
      targetDir: fullPath,
      projectName: safeProjectName,
      componentCategory: category,
      componentName: name,
      componentFiles,
      usageCode,
      packageManager: options.packageManager || 'npm',
      installData: options.installData,
      onProgress,
      onLog,
    });

    let childProcess = null;
    let vsCodeMsg = "";
    // 2. Open in VS Code and/or Run Server if requested
    if (options.openWhenDone) {
      try {
        console.log(`[DemoCLI] Attempting to open VS Code at ${fullPath}`);
        await execAsync(`code .`, { cwd: fullPath });
      } catch (err) {
        console.warn("[DemoCLI] Failed to open VS Code:", err);
        vsCodeMsg = "\n\n(Note: Visual Studio Code needed! 'code' command failed to run automatically.)";
      }
    }

    if (options.runWhenDone) {
      onProgress("Launching background dev server...");
      const { spawn } = require('child_process');
      const pm = options.packageManager || 'npm';
      
      // On Windows, 'npm' is often a .cmd file, shell: true handles this.
      // --open tells Vite to open the browser automatically.
      childProcess = spawn(pm, ['run', 'dev', '--', '--open'], { 
        cwd: fullPath, 
        shell: true,
        env: { ...process.env, BROWSER: 'chrome' }
      });

      childProcess.stdout.on('data', (data) => onLog(data.toString()));
      childProcess.stderr.on('data', (data) => onLog(`${data.toString()}`));
    }

    return { 
      success: true, 
      path: fullPath,
      childProcess, // Returned to main.cjs for process tracking
      message: `Success! Project created at:\n${fullPath}${vsCodeMsg}`
    };
  } catch (error) {
    console.error("[DemoCLI] Failed to generate project:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { generatePlayground };
