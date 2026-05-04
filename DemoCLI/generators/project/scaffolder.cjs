/**
 * scaffolder.cjs
 * Writes the project skeleton to disk:
 *   - Creates the Vite+React+TS project via CLI
 *   - Merges all required dependencies into package.json
 *   - Runs npm install (one pass)
 *   - Injects component source files
 *   - Writes index.html (with Google Fonts), index.css, App.css
 *   - Copies joker placeholder assets to public/
 *   - Creates dev.bat + optional .vscode config
 */

const path = require('path');
const fs   = require('fs/promises');
const { runCommand } = require('../../utils/spawn.cjs');
const { getScaffoldCmd, getInstallCmd, patchPackageJson } = require('../../utils/pm.cjs');
const { buildTokensCSS, buildGlobalsCSS, buildGoogleFontsLink } = require('../shared/style-builder.cjs');

const BASE_DEPS = [
  'framer-motion', 'motion', 'gsap', 'ogl',
  '@react-three/fiber', '@react-three/drei', 'three', 'maath',
  'react-spring', '@react-spring/three', 'react-icons',
  'meshline', '@react-three/rapier',
  'lucide-react', 'clsx', 'tailwind-merge',
  '@tailwindcss/vite', 'tailwindcss',
  // Component-specific deps (discovered by scanning ReactBitsComponents source)
  'postprocessing',           // HyperSpeed
  '@react-three/postprocessing', // Dither
  'gl-matrix',                // InfiniteMenu
  'lenis',                    // ScrollStack
  'matter-js',                // FallingText
  'motion-utils',             // BlurText
];

// Packages already provided by the Vite react-ts template or BASE_DEPS — skip them during auto-scan
const BASE_DEPS_SET = new Set([
  'react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'vite', '@vitejs/plugin-react',
  'typescript', '@types/react', '@types/react-dom',
  'react-router-dom',
  ...BASE_DEPS,
]);

/**
 * Scans every injected component file's content for external import statements
 * and returns a Set of package names that are NOT already in BASE_DEPS_SET.
 * This ensures any component with unusual dependencies (postprocessing, etc.) gets them installed.
 */
function extractComponentDeps(selectedComponents) {
  const extra = new Set();
  for (const comp of selectedComponents) {
    if (!comp.files) continue;
    for (const file of comp.files) {
      if (!file.content) continue;
      // Match: import ... from 'pkg'  OR  import 'pkg'
      const matches = file.content.matchAll(/\bimport\s+(?:type\s+)?(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g);
      for (const [, pkg] of matches) {
        if (pkg.startsWith('.') || pkg.startsWith('/')) continue;
        // Normalise to root package name (handles @scope/pkg/subpath and pkg/subpath)
        const root = pkg.startsWith('@')
          ? pkg.split('/').slice(0, 2).join('/')
          : pkg.split('/')[0];
        if (!BASE_DEPS_SET.has(root)) extra.add(root);
      }
    }
  }
  return extra;
}

/**
 * buildScaffold(options)
 * Runs Vite scaffold, injects deps, installs, writes base files.
 * Returns { targetDir }.
 */
async function buildScaffold({
  parentDir,
  projectName,
  packageManager = 'npm',
  selectedComponents = [],
  designRules = {},
  styleDirection = {},
  scrollbarStyle = null,
  runWhenDone = false,
  isMultiPage = false,
  onProgress,
  onLog,
}) {
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  const log    = (msg) => { if (onLog) onLog(msg); };

  const safeParent = path.resolve(parentDir);
  const targetDir  = path.join(safeParent, projectName);

  // ── 1. Run Vite scaffold ────────────────────────────────────────────────────
  notify(`Scaffolding Vite + React project '${projectName}'...`);
  const scaffoldCmd = getScaffoldCmd(packageManager, projectName);
  await runCommand(scaffoldCmd, [], safeParent, log);

  // ── 2. Merge dependencies into package.json ──────────────────────────────────
  notify('Merging dependencies...');
  const deps = new Set(BASE_DEPS);
  if (isMultiPage) deps.add('react-router-dom');

  // Auto-detect extra deps by scanning all injected component file contents
  const componentDeps = extractComponentDeps(selectedComponents);
  for (const dep of componentDeps) {
    deps.add(dep);
    log(`[Scaffolder] Auto-detected component dep: ${dep}\n`);
  }

  await patchPackageJson(path.join(targetDir, 'package.json'), deps, msg => log(`[Scaffolder] ${msg}`));

  // ── 3. Install all dependencies ──────────────────────────────────────────────
  notify(`Installing dependencies via ${packageManager}...`);
  await runCommand(`${packageManager} ${getInstallCmd(packageManager)}`, [], targetDir, log);

  // ── 4. Inject component source files ────────────────────────────────────────
  notify('Injecting component files...');
  for (const comp of selectedComponents) {
    if (!comp.name || !comp.files) continue;
    const compDir = path.join(targetDir, 'src', 'components', comp.category || 'Components', comp.name);
    await fs.mkdir(compDir, { recursive: true });
    for (const file of comp.files) {
      await fs.writeFile(path.join(compDir, file.name), file.content, 'utf-8');
    }
  }

  // Handle Lanyard-specific assets
  const hasLanyard = selectedComponents.some(c => c.name === 'Lanyard');
  if (hasLanyard) {
    await setupLanyard(targetDir, selectedComponents, log);
  }

  // ── 5. Write CSS files ───────────────────────────────────────────────────────
  notify('Writing CSS foundation...');
  const aesthetic = (styleDirection.aesthetics && styleDirection.aesthetics[0]) || 'Minimal';
  const optimizationTarget = (designRules.sizes && designRules.sizes.optimizationTarget) || 'adaptive';

  const tokensCss  = buildTokensCSS(designRules, styleDirection);
  const globalsCss = buildGlobalsCSS(aesthetic, optimizationTarget, scrollbarStyle);

  // index.css = tokens (Tailwind import + :root + body) + globals (aesthetic + responsive)
  const indexCss = tokensCss + '\n' + globalsCss;
  await fs.writeFile(path.join(targetDir, 'src', 'index.css'), indexCss, 'utf-8');
  await fs.writeFile(path.join(targetDir, 'src', 'App.css'), '/* Generated by BitForge */\n', 'utf-8');

  // ── 6. Write index.html ──────────────────────────────────────────────────────
  notify('Writing index.html...');
  const fontsLink = buildGoogleFontsLink(designRules.fonts || []);
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    ${fontsLink}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  await fs.writeFile(path.join(targetDir, 'index.html'), indexHtml, 'utf-8');

  // ── 6b. Patch vite.config.ts to add @tailwindcss/vite plugin ────────────────
  try {
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`;
    await fs.writeFile(viteConfigPath, viteConfig, 'utf-8');
  } catch (e) {
    log(`[Scaffolder] Warning: Could not write vite.config.ts: ${e.message}\n`);
  }

  // ── 6c. Patch tsconfig to remove verbatimModuleSyntax ───────────────────────
  // Vite 5's react-ts template enables verbatimModuleSyntax by default, which
  // requires `import type` for all type-only imports. Several ReactBits source
  // files use value imports for types — removing this option prevents build errors.
  try {
    // Vite 5+ splits config into tsconfig.app.json (src) and tsconfig.node.json (vite config)
    const tsconfigAppPath = path.join(targetDir, 'tsconfig.app.json');
    const raw = await fs.readFile(tsconfigAppPath, 'utf-8');
    const cfg = JSON.parse(raw);
    if (cfg.compilerOptions) {
      delete cfg.compilerOptions.verbatimModuleSyntax;
      cfg.compilerOptions.allowSyntheticDefaultImports = true;
      await fs.writeFile(tsconfigAppPath, JSON.stringify(cfg, null, 2), 'utf-8');
      log('[Scaffolder] Patched tsconfig.app.json: removed verbatimModuleSyntax\n');
    }
  } catch (_) {
    // Vite 4 uses a single tsconfig.json — try that as fallback
    try {
      const tsconfigPath = path.join(targetDir, 'tsconfig.json');
      const raw = await fs.readFile(tsconfigPath, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg.compilerOptions) {
        delete cfg.compilerOptions.verbatimModuleSyntax;
        cfg.compilerOptions.allowSyntheticDefaultImports = true;
        await fs.writeFile(tsconfigPath, JSON.stringify(cfg, null, 2), 'utf-8');
        log('[Scaffolder] Patched tsconfig.json: removed verbatimModuleSyntax\n');
      }
    } catch (e2) {
      log(`[Scaffolder] Warning: Could not patch tsconfig: ${e2.message}\n`);
    }
  }

  // ── 7. Remove default Vite boilerplate ───────────────────────────────────────
  for (const f of [
    path.join(targetDir, 'public', 'vite.svg'),
    path.join(targetDir, 'src', 'assets', 'react.svg'),
  ]) {
    try { await fs.unlink(f); } catch (_) { /* skip */ }
  }

  // ── 8. Copy joker placeholder assets ────────────────────────────────────────
  notify('Copying placeholder assets...');
  const jokerSrc = path.join(__dirname, '..', '..', 'joker-assets');
  const publicDir = path.join(targetDir, 'public');
  const assets3dDir = path.join(publicDir, 'assets', '3d');
  try {
    await fs.mkdir(assets3dDir, { recursive: true });
    const jokerFiles = await fs.readdir(jokerSrc);
    for (const f of jokerFiles) {
      const src = path.join(jokerSrc, f);
      if (f.endsWith('.glb')) {
        await fs.copyFile(src, path.join(assets3dDir, f));
      } else if (/\.(jpg|png|svg|jpeg|webp)$/i.test(f)) {
        await fs.copyFile(src, path.join(publicDir, f));
      }
    }
  } catch (err) {
    log(`[Scaffolder] Warning: Could not copy joker assets: ${err.message}\n`);
  }

  // ── 9. Create dev.bat ────────────────────────────────────────────────────────
  await fs.writeFile(
    path.join(targetDir, 'dev.bat'),
    `@echo off\necho Starting dev server...\nPowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"\npause`,
    'utf-8'
  );

  // ── 10. VS Code auto-run config ─────────────────────────────────────────────
  if (runWhenDone) {
    const vsDir = path.join(targetDir, '.vscode');
    await fs.mkdir(vsDir, { recursive: true });
    await fs.writeFile(path.join(vsDir, 'tasks.json'), JSON.stringify({
      version: '2.0.0',
      tasks: [{
        label: 'BitForge: Dev Server',
        type: 'shell',
        command: `${packageManager} run dev`,
        windows: { command: `PowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"` },
        runOptions: { runOn: 'folderOpen' },
        presentation: { reveal: 'always', panel: 'dedicated', focus: true },
        problemMatcher: [],
      }],
    }, null, 2), 'utf-8');
    await fs.writeFile(path.join(vsDir, 'settings.json'), JSON.stringify({
      'terminal.integrated.showOnStartup': 'always',
      'task.allowAutomaticTasks': 'on',
    }, null, 2), 'utf-8');
  }

  // ── 11. Create src/pages/ directory (even for single-page, for cleanliness) ─
  await fs.mkdir(path.join(targetDir, 'src', 'pages'), { recursive: true });

  return { targetDir };
}

async function setupLanyard(targetDir, selectedComponents, log) {
  const lanyardDir = path.join(targetDir, 'src', 'components', 'Components', 'Lanyard');
  const jokerSrc = path.join(__dirname, '..', '..', 'joker-assets');
  for (const asset of ['card.glb', 'lanyard.png']) {
    try { await fs.copyFile(path.join(jokerSrc, asset), path.join(lanyardDir, asset)); }
    catch (e) { log(`[Scaffolder] Warning: Could not copy ${asset}: ${e.message}\n`); }
  }

  const viteConfigPath = path.join(targetDir, 'vite.config.ts');
  try {
    let cfg = await fs.readFile(viteConfigPath, 'utf-8');
    if (!cfg.includes('assetsInclude')) {
      cfg = cfg.replace(/plugins:\s*\[/, `assetsInclude: ['**/*.glb'],\n  plugins: [`);
      await fs.writeFile(viteConfigPath, cfg, 'utf-8');
    }
  } catch (e) { log(`[Scaffolder] Warning: Could not patch vite.config: ${e.message}\n`); }

  await fs.writeFile(path.join(targetDir, 'src', 'global.d.ts'),
    `export {};\ndeclare module '*.glb';\ndeclare module '*.png';\ndeclare module 'meshline' {\n  export const MeshLineGeometry: any;\n  export const MeshLineMaterial: any;\n}\ndeclare global {\n  namespace JSX {\n    interface IntrinsicElements {\n      meshLineGeometry: any;\n      meshLineMaterial: any;\n    }\n  }\n}\n`,
    'utf-8'
  );
}

module.exports = { buildScaffold };
