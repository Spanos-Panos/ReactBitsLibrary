const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// Helper to spawn and pipe logs
function runCommand(command, args, cwd, onLog) {
  return new Promise((resolve, reject) => {
    if (!command) return reject(new Error("Attempted to run an empty command. Check your package manager settings."));

    // Force absolute, normalized paths for Windows to avoid C::\ errors
    const safeCwd = path.resolve(cwd);

    // Force CI mode and disable interactive prompts across multiple frameworks
    const env = { ...process.env, CI: 'true', FORCE_COLOR: '1', YES: 'true', NPM_CONFIG_YES: 'true' };

    console.log(`[DemoCLI] Spawning command: "${command}" in CWD: ${safeCwd}`);
    const child = spawn(command, args, { cwd: safeCwd, shell: true, env });

    const handleOutput = (data) => {
      const text = data.toString();
      onLog && onLog(text);

      // Auto-answer YES to stubborn CLI prompts like shadcn
      if (text.match(/\([yY]\/[nN]\)/) || text.match(/proceed\?/i) || text.match(/components\.json/i)) {
        try {
          child.stdin.write('y\n');
        } catch (e) { }
      }
    };

    child.stdout.on('data', handleOutput);
    child.stderr.on('data', handleOutput);

    child.on('error', (err) => {
      console.error(`[DemoCLI] FATAL Spawn Error:`, err);
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

async function generateViteReact(options) {
  const { targetDir, projectName, componentCategory, componentName, componentFiles, usageCode, selectedComponents, enhancedPrompt, packageManager, installData, onProgress, onLog } = options;
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const log = (msg) => { if (onLog) onLog(msg); };

  notify(`Scaffolding Vite + React project '${projectName}'...`);
  const parentDir = path.resolve(path.dirname(targetDir));

  // 1. Run Vite Scaffold
  log(`> Running scaffold command...\n`);
  let scaffoldCmd = '';
  if (packageManager === 'npm') scaffoldCmd = `npm create vite@latest ${projectName} -- --template react-ts`;
  else if (packageManager === 'pnpm') scaffoldCmd = `pnpm create vite ${projectName} --template react-ts`;
  else if (packageManager === 'yarn') scaffoldCmd = `yarn create vite ${projectName} --template react-ts`;
  else scaffoldCmd = `bun create vite ${projectName} --template react-ts`;

  await runCommand(scaffoldCmd, [], parentDir, log);

  notify(`Scanning for required dependencies...`);
  const discoveredDeps = new Set(['@tailwindcss/vite', 'tailwindcss', 'clsx', 'tailwind-merge', 'lucide-react', 'framer-motion', 'motion', 'gsap', 'ogl']);
  
  // Merge AI dependencies if present
  if (enhancedPrompt?.technicalRequirements?.dependencies) {
    enhancedPrompt.technicalRequirements.dependencies.forEach(d => discoveredDeps.add(d));
  }

  // 2. Install dependencies
  const depList = Array.from(discoveredDeps).join(' ');
  notify(`Installing project dependencies via ${packageManager}...`);
  await runCommand(`${packageManager} install`, [], targetDir, log);
  if (depList) {
      notify(`Installing UI components and tools...`);
      await runCommand(`${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${depList}`, [], targetDir, log);
  }

  // 3. Inject Component Files
  notify(`Injecting custom component files...`);
  
  // Handle Master Build (Multi-component) or Legacy (Single)
  const componentsToInject = selectedComponents || [{ category: componentCategory, name: componentName, files: componentFiles, usageMarkdown: usageCode }];
  
  for (const comp of componentsToInject) {
    if (!comp.name || !comp.files) continue;
    const compDirPath = path.join(targetDir, 'src', 'components', comp.category || "Components", comp.name);
    await fs.mkdir(compDirPath, { recursive: true });
    for (const file of comp.files) {
      const filePath = path.join(compDirPath, file.name);
      await fs.writeFile(filePath, file.content, 'utf-8');
    }
  }

  // 4. Overwrite App.tsx (For single component, legacy mode)
  if (!enhancedPrompt) {
      const appTsxPath = path.join(targetDir, 'src', 'App.tsx');
      let modifiedUsageCode = usageCode.replace(
        new RegExp(`from\\s+['"]\\.\\/${componentName}['"]`, 'g'),
        `from './components/${componentCategory || "Components"}/${componentName}/${componentName}'`
      );
      if (!modifiedUsageCode.includes("export default") && !modifiedUsageCode.includes("const App =")) {
        const lines = modifiedUsageCode.split('\n');
        const importLines = lines.filter(l => l.trim().startsWith('import '));
        const bodyText = lines.filter(l => !l.trim().startsWith('import ')).join('\n').trim();
        modifiedUsageCode = `${importLines.join('\n')}\n\nexport default function App() {\n  return (\n    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n      ${bodyText.replace(/\n/g, '\n      ')}\n    </div>\n  );\n}\n`;
      }
      await fs.writeFile(appTsxPath, modifiedUsageCode, 'utf-8');
  }

  notify(`Cleaning up boilerplate styles...`);
  const appCssPath = path.join(targetDir, 'src', 'App.css');
  const indexCssPath = path.join(targetDir, 'src', 'index.css');

  await fs.writeFile(appCssPath, '/* Generated by ReactBits Explorer */\n', 'utf-8');
  await fs.writeFile(indexCssPath, `@import "tailwindcss";\n\nbody { margin: 0; background: #000; color: #fff; min-height: 100vh; overflow-x: hidden; }`, 'utf-8');

  // 5. Build AI Files if Master Build
  let isAiBuild = false;
  if (enhancedPrompt) {
    isAiBuild = true;
    notify(`Saving AI Master Brief...`);
    await fs.writeFile(path.join(targetDir, 'enhancedPrompt.json'), JSON.stringify(enhancedPrompt, null, 2), 'utf-8');

    notify(`Configuring Claude Mission Control...`);
    const claudeMdContent = `# Project Mission: ${enhancedPrompt?.projectMeta?.title || projectName}

You are an expert Frontend Developer. Your mission is to build the UI designed in \`enhancedPrompt.json\`.

## Project Context
- **Framework**: Vite + React (TypeScript) + Tailwind CSS (v4)
- **Design Tokens**: See \`enhancedPrompt.json\` -> \`designTokens\`
- **Components**: Pre-installed in \`src/components/\`

## STRICT INSTRUCTIONS - READ CAREFULLY
To minimize token costs and ensure speed:
1. Read \`enhancedPrompt.json\`.
2. Update \`src/App.tsx\` to implement the \`siteArchitecture\`, importing the components from \`src/components/\`.
3. Style the layout using Tailwind CSS.
4. **DO NOT** write tests.
5. **DO NOT** delete the component source files.
6. **DO NOT** scan the node_modules folder or any unnecessary files.
7. **STOP EXACTLY HERE AND EXIT**. Do not propose next steps.
`;
    await fs.writeFile(path.join(targetDir, 'CLAUDE.md'), claudeMdContent, 'utf-8');
  }

  // 6. Create dev.bat for Windows Execution Policy Bypass
  notify(`Creating one-click helper scripts...`);
  const devBatPath = path.join(targetDir, 'dev.bat');
  const devBatContent = `@echo off\necho Starting ReactBits Playground...\nPowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"\npause`;
  await fs.writeFile(devBatPath, devBatContent, 'utf-8');

  // 6b. VSCode Auto-Run Task
  if (options.runWhenDone) {
    notify(`Injecting VS Code auto-run configuration...`);
    const vscodeDirPath = path.join(targetDir, '.vscode');
    await fs.mkdir(vscodeDirPath, { recursive: true });
    const tasksJson = {
      version: "2.0.0",
      tasks: [
        {
          label: "ReactBits: Auto Dev Server",
          type: "shell",
          command: `${packageManager} run dev`,
          windows: {
            command: `PowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"`
          },
          runOptions: {
            runOn: "folderOpen"
          },
          presentation: {
            reveal: "always",
            panel: "dedicated",
            group: "reactbits",
            focus: true
          },
          problemMatcher: []
        }
      ]
    };
    await fs.writeFile(path.join(vscodeDirPath, 'tasks.json'), JSON.stringify(tasksJson, null, 2), 'utf-8');

    const settingsJson = {
      "terminal.integrated.showOnStartup": "always",
      "workbench.startupEditor": "none",
      "task.allowAutomaticTasks": "on",
      "window.newWindowDimensions": "maximized"
    };
    await fs.writeFile(path.join(vscodeDirPath, 'settings.json'), JSON.stringify(settingsJson, null, 2), 'utf-8');
  }

  // 7. Auto-Launch Claude Code in Native Terminal
  if (isAiBuild) {
      notify(`Launching Claude Code in a Native Terminal...`);
      const { exec } = require('child_process');
      // Instructing it explicitly to just output the file saves tokens and keeps it from hallucinating tests
      const claudeCmd = `claude -p "Read CLAUDE.md. Execute the required file replacements perfectly. STOP when finished. Do not ask for new tasks."`;
      if (process.platform === 'win32') {
         exec(`start cmd.exe /c "${claudeCmd} && pause"`, { cwd: targetDir });
      } else {
         exec(`open -a Terminal \`pwd\``, { cwd: targetDir }); // Mac fallback
      }
  } else {
      // 8. Final Integrity Check (Strict if Auto-Run is enabled)
      notify(`Verifying project integrity (checking for errors)...`);
      try {
        await runCommand('npx tsc --noEmit', [], targetDir, log);
        notify(`Verification complete: No project errors found! Ready to run.`);
      } catch (e) {
        if (options.runWhenDone) {
          log(`[FATAL INTEGRITY ERROR] TypeScript check failed. Self-repair or manual fix required before auto-running!\n`);
          throw new Error(`Project Integrity Check Failed. Auto-launch blocked to prevent browser crash. Check terminal for details.`);
        } else {
          log(`[INTEGRITY WARNING] Found some issues during verification. Project created, but might need manual path adjustment.\n`);
          notify(`Generation finished with warnings. Project available at target directory.`);
        }
      }
  }

  notify(`Finished setting up target project at ${targetDir}`);
  return true;
}

module.exports = { generateViteReact };
