const { join } = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { generateViteReact } = require('./generators/vite-react.cjs');

const execAsync = promisify(exec);

async function generatePlayground(category, name, usageCode, componentFiles, options, event) {
  try {
    const safeProjectName = (options.projectName || "demo-" + name.toLowerCase()).replace(/[^a-z0-9-_]/gi, '-');
    const fullPath = join(options.projectPath, safeProjectName);
    
    // Callback to send progress to the frontend UI
    const onProgress = (msg) => {
      console.log(msg);
      if (event && event.sender) event.sender.send("generate-progress", msg);
    };

    const onLog = (msg) => {
      process.stdout.write(msg);
      if (event && event.sender) event.sender.send("generate-log", msg);
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

    let vsCodeMsg = "";
    // 2. Open in VS Code if requested
    if (options.openWhenDone) {
      try {
        console.log(`[DemoCLI] Attempting to open VS Code at ${fullPath}`);
        // For windows/mac/linux, 'code .' is standard if installed.
        await execAsync(`code .`, { cwd: fullPath });
      } catch (err) {
        console.warn("[DemoCLI] Failed to open VS Code:", err);
        vsCodeMsg = "\n\n(Note: Visual Studio Code needed! 'code' command failed to run automatically.)";
      }
    }

    return { 
      success: true, 
      path: fullPath,
      message: `Success! Project created at:\n${fullPath}${vsCodeMsg}`
    };
  } catch (error) {
    console.error("[DemoCLI] Failed to generate project:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { generatePlayground };
