const path = require('path');
const fs = require('fs/promises');
const { runCommand } = require('../../utils/spawn.cjs');
const { getScaffoldCmd, getInstallCmd, patchPackageJson } = require('../../utils/pm.cjs');
const { extractComponentDepsFromFiles } = require('../shared/extract-component-deps.cjs');

const DEMO_BASE_DEPS = [
  'framer-motion', 'motion', 'motion-utils',
  'gsap', 'ogl', '@react-three/fiber', '@react-three/drei',
  'three', 'lucide-react', 'clsx', 'tailwind-merge', 'react-icons',
];

const DEMO_TAILWIND_DEPS = ['@tailwindcss/vite', 'tailwindcss'];

function filesUseTailwind(componentFiles, usageCode = '') {
  const sample = [
    usageCode,
    ...(componentFiles || []).map((f) => f.content || ''),
  ].join('\n');
  return /\bclassName\s*=/.test(sample)
    && /\b(bg-|text-|flex|rounded|hover:|max-w-|min-h-|items-|justify-|p-\d|px-|py-|w-\d)/.test(sample);
}

const DEMO_BASE_DEPS_SET = new Set([
  'react', 'react-dom', 'react/jsx-runtime', 'react-dom/client',
  'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom',
  ...DEMO_BASE_DEPS,
]);

/**
 * Legacy generator for single-component demos.
 * Used by the inspector's "Generate Demo" button.
 * For full project generation, use the modular pipeline (scaffolder, app-builder, etc.)
 */
async function generateViteReact(options) {
  const {
    targetDir, projectName, componentCategory, componentName, componentFiles,
    usageCode, packageManager, onProgress, onLog, scrollbarStyle,
  } = options;

  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const log    = (msg) => { if (onLog) onLog(msg); };

  const parentDir = path.resolve(path.dirname(targetDir));

  // 1. Scaffold
  notify(`Scaffolding single-component demo project '${projectName}'...`);
  await runCommand(getScaffoldCmd(packageManager, projectName), [], parentDir, log);

  // 2. Deps — base set + auto-detect from injected component source (e.g. styled-components)
  notify('Configuring dependencies...');
  const needsTailwind = filesUseTailwind(componentFiles, usageCode);
  const deps = new Set(DEMO_BASE_DEPS);
  if (needsTailwind) {
    for (const pkg of DEMO_TAILWIND_DEPS) deps.add(pkg);
    log('[Demo] Tailwind classes detected — adding tailwindcss + @tailwindcss/vite\n');
  }
  for (const pkg of extractComponentDepsFromFiles(componentFiles, DEMO_BASE_DEPS_SET)) {
    deps.add(pkg);
    log(`[Demo] Auto-detected component dep: ${pkg}\n`);
  }
  await patchPackageJson(path.join(targetDir, 'package.json'), deps, msg => log(`[Demo] ${msg}`));

  // 3. Install
  notify(`Installing dependencies via ${packageManager}...`);
  await runCommand(`${packageManager} ${getInstallCmd(packageManager)}`, [], targetDir, log);

  // 4. Inject component files
  notify('Injecting component files...');
  const compDir = path.join(targetDir, 'src', 'components', componentCategory || 'Components', componentName);
  await fs.mkdir(compDir, { recursive: true });
  for (const file of componentFiles) {
    await fs.writeFile(path.join(compDir, file.name), file.content, 'utf-8');
  }

  // 5. Build App.tsx from usage markdown
  notify('Building demo App.tsx...');
  let appCode = usageCode.replace(
    new RegExp(`from\\s+['"]\\.\\/${componentName}['"]`, 'g'),
    `from './components/${componentCategory || 'Components'}/${componentName}/${componentName}'`,
  );

  // If the usage code doesn't already define a full component, wrap it.
  if (!appCode.includes('export default') && !appCode.includes('const App =')) {
    const lines       = appCode.split('\n');
    const importLines = lines.filter(l => l.trim().startsWith('import '));
    const bodyLines   = lines.filter(l => !l.trim().startsWith('import '));

    // Split at the first JSX line so const/let declarations land in the
    // function body (before return) rather than inside the JSX expression.
    const firstJsxIdx = bodyLines.findIndex(l => l.trim().startsWith('<'));
    let declarationLines, jsxLines;
    if (firstJsxIdx > 0) {
      declarationLines = bodyLines.slice(0, firstJsxIdx).filter(l => l.trim());
      jsxLines         = bodyLines.slice(firstJsxIdx);
    } else {
      declarationLines = [];
      jsxLines         = bodyLines;
    }

    const bodyDecls = declarationLines.length > 0
      ? '  ' + declarationLines.join('\n  ') + '\n\n'
      : '';

    appCode = [
      importLines.join('\n'),
      '',
      'export default function App() {',
      bodyDecls + '  return (',
      '    <div style={{ width: \'100vw\', height: \'100vh\', position: \'relative\', background: \'#000\' }}>',
      '      ' + jsxLines.join('\n      '),
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }
  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), appCode, 'utf-8');

  // 6. Minimal styles
  notify('Finalizing styles...');
  await fs.writeFile(path.join(targetDir, 'src', 'App.css'), '/* Demo */\n', 'utf-8');

  let scrollbarCss = '';
  if (scrollbarStyle?.mode === 'hidden') {
    scrollbarCss = '\n* { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }';
  } else if (scrollbarStyle?.mode === 'custom') {
    scrollbarCss = `\n*::-webkit-scrollbar { width: 6px; } *::-webkit-scrollbar-thumb { background: ${scrollbarStyle.thumb || '#555'}; border-radius: 3px; }`;
  }

  const indexCss = needsTailwind
    ? `@import "tailwindcss";\n\nbody { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; }${scrollbarCss}\n`
    : `body { margin: 0; background: #000; color: #fff; min-height: 100vh; font-family: sans-serif; }${scrollbarCss}`;

  await fs.writeFile(path.join(targetDir, 'src', 'index.css'), indexCss, 'utf-8');

  if (needsTailwind) {
    try {
      const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`;
      await fs.writeFile(path.join(targetDir, 'vite.config.ts'), viteConfig, 'utf-8');
      log('[Demo] Patched vite.config.ts for Tailwind\n');
    } catch (e) {
      log(`[Demo] Warning: Could not patch vite.config.ts: ${e.message}\n`);
    }
  }

  // 7. Remove Vite boilerplate
  for (const f of [
    path.join(targetDir, 'public', 'vite.svg'),
    path.join(targetDir, 'src', 'assets', 'react.svg'),
  ]) {
    try { await fs.unlink(f); } catch (_) {}
  }

  notify('Demo project ready!');
}

module.exports = { generateViteReact };
