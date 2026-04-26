const path = require('path');
const fs = require('fs/promises');
const { runCommand } = require('../utils/spawn.cjs');

/**
 * Legacy generator for single-component demos.
 * This is kept for the inspector's "Generate Demo" button.
 * For full project generation, use the modular pipeline (scaffolder, app-builder, etc.)
 */
async function generateViteReact(options) {
  const { 
    targetDir, projectName, componentCategory, componentName, componentFiles, 
    usageCode, packageManager, onProgress, onLog, scrollbarStyle 
  } = options;

  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const log = (msg) => { if (onLog) onLog(msg); };

  const parentDir = path.resolve(path.dirname(targetDir));

  // 1. Scaffold
  notify(`Scaffolding single-component demo project '${projectName}'...`);
  let scaffoldCmd = '';
  if (packageManager === 'pnpm') scaffoldCmd = `pnpm create vite ${projectName} --template react-ts`;
  else if (packageManager === 'yarn') scaffoldCmd = `yarn create vite ${projectName} --template react-ts`;
  else if (packageManager === 'bun')  scaffoldCmd = `bun create vite ${projectName} --template react-ts`;
  else scaffoldCmd = `npm create vite@latest ${projectName} -- --template react-ts`;

  await runCommand(scaffoldCmd, [], parentDir, log);

  // 2. Deps
  notify('Configuring dependencies...');
  const deps = [
    'framer-motion', 'gsap', 'ogl', '@react-three/fiber', '@react-three/drei', 
    'three', 'lucide-react', 'clsx', 'tailwind-merge', 'react-icons'
  ];
  
  const pkgJsonPath = path.join(targetDir, 'package.json');
  try {
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
    pkgJson.dependencies = pkgJson.dependencies || {};
    deps.forEach(d => { pkgJson.dependencies[d] = 'latest'; });
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
  } catch (e) {
    log(`[Legacy] Warning: Could not patch package.json: ${e.message}\n`);
  }

  // 3. Install
  notify(`Installing dependencies via ${packageManager}...`);
  const installCmd = packageManager === 'npm' ? 'install --no-audit --no-fund' : 'install';
  await runCommand(`${packageManager} ${installCmd}`, [], targetDir, log);

  // 4. Inject component
  notify('Injecting component files...');
  const compDir = path.join(targetDir, 'src', 'components', componentCategory || 'Components', componentName);
  await fs.mkdir(compDir, { recursive: true });
  for (const file of componentFiles) {
    await fs.writeFile(path.join(compDir, file.name), file.content, 'utf-8');
  }

  // 5. Build App.tsx
  notify('Building demo App.tsx...');
  let appCode = usageCode.replace(
    new RegExp(`from\\s+['"]\\.\\/${componentName}['"]`, 'g'),
    `from './components/${componentCategory || "Components"}/${componentName}/${componentName}'`
  );

  if (!appCode.includes("export default") && !appCode.includes("const App =")) {
    const lines = appCode.split('\n');
    const importLines = lines.filter(l => l.trim().startsWith('import '));
    const otherLines = lines.filter(l => !l.trim().startsWith('import '));
    
    // Simple wrap
    appCode = `${importLines.join('\n')}\n\nexport default function App() {\n  return (\n    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>\n      ${otherLines.join('\n      ')}\n    </div>\n  );\n}\n`;
  }
  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), appCode, 'utf-8');

  // 6. Cleanup & Styles
  notify('Finalizing styles...');
  await fs.writeFile(path.join(targetDir, 'src', 'App.css'), '/* Legacy Demo */\n', 'utf-8');
  
  let scrollbarCss = '';
  if (scrollbarStyle?.mode === 'hidden') {
    scrollbarCss = '\n* { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }';
  } else if (scrollbarStyle?.mode === 'custom') {
    scrollbarCss = `\n*::-webkit-scrollbar { width: 6px; } *::-webkit-scrollbar-thumb { background: ${scrollbarStyle.thumb || '#555'}; border-radius: 3px; }`;
  }

  await fs.writeFile(
    path.join(targetDir, 'src', 'index.css'), 
    `body { margin: 0; background: #000; color: #fff; min-height: 100vh; font-family: sans-serif; }${scrollbarCss}`, 
    'utf-8'
  );

  // 7. Remove boilerplate
  for (const f of [path.join(targetDir, 'public', 'vite.svg'), path.join(targetDir, 'src', 'assets', 'react.svg')]) {
    try { await fs.unlink(f); } catch (_) {}
  }

  notify('Demo project ready!');
}

module.exports = { generateViteReact };
