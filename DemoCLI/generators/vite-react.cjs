const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// Helper to spawn and pipe logs
function runCommand(command, args, cwd, onLog) {
  return new Promise((resolve, reject) => {
    // Force CI mode and disable interactive prompts across multiple frameworks
    const env = { ...process.env, CI: 'true', FORCE_COLOR: '1', YES: 'true', NPM_CONFIG_YES: 'true' };
    const child = spawn(command, args, { cwd, shell: true, env });
    
    const handleOutput = (data) => {
      const text = data.toString();
      onLog && onLog(text);
      
      // Auto-answer YES to stubborn CLI prompts like shadcn
      if (text.match(/\([yY]\/[nN]\)/) || text.match(/proceed\?/i) || text.match(/components\.json/i)) {
        try {
          child.stdin.write('y\n');
        } catch (e) {}
      }
    };

    child.stdout.on('data', handleOutput);
    child.stderr.on('data', handleOutput);
    
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

async function generateViteReact(options) {
  const { targetDir, projectName, componentCategory, componentName, componentFiles, usageCode, packageManager, installData, onProgress, onLog } = options;
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const log = (msg) => { if (onLog) onLog(msg); };

  notify(`Scaffolding Vite + React project '${projectName}'...`);
  const parentDir = path.dirname(targetDir);

  // 1. Run Vite Scaffold
  log(`> Running scaffold command...\n`);
  let scaffoldCmd = '';
  if (packageManager === 'npm') scaffoldCmd = `npm create vite@latest ${projectName} -- --template react-ts`;
  else if (packageManager === 'pnpm') scaffoldCmd = `pnpm create vite ${projectName} --template react-ts`;
  else if (packageManager === 'yarn') scaffoldCmd = `yarn create vite ${projectName} --template react-ts`;
  else scaffoldCmd = `bun create vite ${projectName} --template react-ts`;

  await runCommand(scaffoldCmd, [], parentDir, log);

  // 2. Install reactbits required dependencies
  let depsCommand = "";
  if (installData && installData.cli && installData.cli[packageManager]) {
    depsCommand = installData.cli[packageManager];
    if (depsCommand) {
      // Auto-confirm terminal prompts for npx commands
      if (depsCommand.startsWith('npx ') && !depsCommand.includes('--yes') && !depsCommand.includes('-y')) {
        depsCommand = depsCommand.replace('npx ', 'npx --yes ');
      }

      // Pre-Flight Injection for UI registries (shadcn)
      if (depsCommand.includes('shadcn')) {
        notify(`Pre-flight: Injecting shadcn components.json...`);
        const componentsJson = {
          "$schema": "https://ui.shadcn.com/schema.json",
          "style": "new-york",
          "rsc": false,
          "tsx": true,
          "tailwind": {
            "config": "tailwind.config.js",
            "css": "src/index.css",
            "baseColor": "slate",
            "cssVariables": true,
            "prefix": ""
          },
          "aliases": { "components": "@/components", "utils": "@/lib/utils" }
        };
        await fs.writeFile(path.join(targetDir, 'components.json'), JSON.stringify(componentsJson, null, 2), 'utf-8');
        
        // Inject minimum tailwind and utils
        await fs.writeFile(path.join(targetDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */\nmodule.exports = { content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"], theme: { extend: {} }, plugins: [] }`, 'utf-8');
        await fs.mkdir(path.join(targetDir, 'src', 'lib'), { recursive: true });
        await fs.writeFile(path.join(targetDir, 'src', 'lib', 'utils.ts'), `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}`, 'utf-8');
        log(`> Generated components.json and tailwind.config.js to bypass prompts.\n`);
      }

      notify(`Installing component dependencies: ${depsCommand}...`);
      log(`> ${depsCommand}\n`);
      try {
        await runCommand(depsCommand, [], targetDir, log);
      } catch (e) {
        log(`[WARNING] Failed to run dependency install command: ${e.message}\n`);
      }
    }
  }

  // Also do a blanket install for the Vite template
  notify(`Installing boilerplate Vite dependencies via ${packageManager}...`);
  log(`> ${packageManager} install\n`);
  // Also do a blanket install for the Vite template
  notify(`Scanning for required dependencies...`);
  const discoveredDeps = new Set(['clsx', 'tailwind-merge']); // Default base deps
  
  // Manual Dependency Injection Support
  if (installData?.manual?.[packageManager]) {
    const manualLine = installData.manual[packageManager];
    const match = manualLine.match(/(?:add|install)\s+([^.]+)/);
    if (match && match[1]) {
      const pkgNames = match[1].trim().split(/\s+/).filter((p) => p && !p.startsWith('-'));
      pkgNames.forEach(p => discoveredDeps.add(p));
    }
  }

  const allCode = [usageCode, ...componentFiles.map(f => f.content)].join('\n');
  
  // Simple regex to find imports from node_modules (non-relative imports)
  // We exclude imports starting with . or /
  const importRegex = /import\s+.*\s+from\s+['"]([^./][^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(allCode)) !== null) {
    const fullPkg = match[1];
    let pkg = "";
    if (fullPkg.startsWith('@')) {
      // Scoped package: @org/name -> we need the first two segments
      const parts = fullPkg.split('/');
      pkg = parts.slice(0, 2).join('/');
    } else {
      pkg = fullPkg.split('/')[0];
    }
    
    // Filter out built-ins or already handled ones
    if (pkg && pkg !== 'react' && pkg !== 'react-dom' && !pkg.startsWith('.') && !pkg.startsWith('@/')) {
      discoveredDeps.add(pkg);
    }
  }
  
  // Special check for common shadcn/ui peer deps if not caught
  if (allCode.includes('lucide')) discoveredDeps.add('lucide-react');
  if (allCode.includes('framer-motion')) discoveredDeps.add('framer-motion');
  if (allCode.includes('canvas-confetti')) discoveredDeps.add('canvas-confetti');
  
  // Three.js projects often need 'three' core if using r3f
  if (Array.from(discoveredDeps).some(d => d.startsWith('@react-three'))) {
    discoveredDeps.add('three');
  }

  const depList = Array.from(discoveredDeps).join(' ');
  notify(`Installing boilerplate and discovered dependencies via ${packageManager}...`);
  log(`> Added dependencies: ${depList}\n`);
  
  await runCommand(`${packageManager} install`, [], targetDir, log);
  if (depList) {
    notify(`Installing peer dependencies...`);
    await runCommand(`${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${depList}`, [], targetDir, log);
  }

  // 3. Inject Component Files
  notify(`Injecting custom component files...`);
  const componentDirPath = path.join(targetDir, 'src', 'components', componentCategory || "Components", componentName);
  await fs.mkdir(componentDirPath, { recursive: true });

  for (const file of componentFiles) {
    const filePath = path.join(componentDirPath, file.name);
    await fs.writeFile(filePath, file.content, 'utf-8');
  }

  // 4. Overwrite App.tsx with the Usage Example
  const appTsxPath = path.join(targetDir, 'src', 'App.tsx');
  
  let modifiedUsageCode = usageCode.replace(
    new RegExp(`from\\s+['"]\\.\\/${componentName}['"]`, 'g'),
    `from './components/${componentCategory || "Components"}/${componentName}/${componentName}'`
  );

  // If the component has .jsx inside usage code, generic replace
  modifiedUsageCode = modifiedUsageCode.replace(
    new RegExp(`from\\s+['"]\\.\\/${componentName}\\.(jsx|tsx|js|ts)['"]`, 'g'),
    `from './components/${componentCategory || "Components"}/${componentName}/${componentName}'`
  );

  // Auto-wrap usage code into a valid React App component if needed
  if (!modifiedUsageCode.includes("export default") && !modifiedUsageCode.includes("const App =")) {
    const lines = modifiedUsageCode.split('\n');
    const importLines = lines.filter(l => l.trim().startsWith('import '));
    const bodyLines = lines.filter(l => !l.trim().startsWith('import ') && l.trim() !== '');
    
    modifiedUsageCode = `${importLines.join('\n')}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      ${bodyLines.join('\n      ')}
    </div>
  );
}
`;
  }

  await fs.writeFile(appTsxPath, modifiedUsageCode, 'utf-8');

  notify(`Cleaning up boilerplate styles...`);
  const appCssPath = path.join(targetDir, 'src', 'App.css');
  const indexCssPath = path.join(targetDir, 'src', 'index.css');
  
  await fs.writeFile(appCssPath, '/* Generated by ReactBits Explorer */\n', 'utf-8');
  await fs.writeFile(indexCssPath, `body { margin: 0; background: #0f172a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }`, 'utf-8');

  // 6. Create dev.bat for Windows Execution Policy Bypass
  notify(`Creating one-click helper scripts...`);
  const devBatPath = path.join(targetDir, 'dev.bat');
  const devBatContent = `@echo off\necho Starting ReactBits Playground...\nPowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"\npause`;
  await fs.writeFile(devBatPath, devBatContent, 'utf-8');

  // 7. Final Integrity Check (Silent build test)
  notify(`Verifying project integrity (checking for errors)...`);
  try {
    // Run tsc --noEmit to check for typescript errors without generating files
    // If this fails, we don't necessarily abort, but we warn the user.
    await runCommand('npx tsc --noEmit', [], targetDir, log);
    notify(`Verification complete: No critical errors found!`);
  } catch (e) {
    log(`[INTEGRITY] Found some issues during verification. The project might need manual path adjustment.\n`);
    notify(`Generation finished with minor warnings. Checking logs...`);
  }

  notify(`Finished setting up target project at ${targetDir}`);
  return true;
}

module.exports = { generateViteReact };
