const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const { injectColorPropsIntoUsage, buildColorGuidanceSection } = require('../utils/colorContrast.cjs');

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
  const discoveredDeps = new Set(['@tailwindcss/vite', 'tailwindcss', 'clsx', 'tailwind-merge', 'lucide-react', 'framer-motion', 'motion', 'gsap', 'ogl', '@react-three/fiber', '@react-three/drei', 'three', 'maath', 'react-spring', '@react-spring/three', 'react-icons', 'meshline', '@react-three/rapier']);

  // Merge AI dependencies if present.
  // Filter out subpath imports like "react-icons/vsc" — they aren't packages; npm
  // misreads the slash as a GitHub shorthand and tries to clone via SSH (exit 128).
  // Scoped packages (@org/pkg) are fine since they always start with @.
  const isValidPackageName = (d) => typeof d === 'string' && d.trim() &&
    (d.startsWith('@') || !d.includes('/'));

  if (enhancedPrompt?.technicalRequirements?.dependencies) {
    enhancedPrompt.technicalRequirements.dependencies
      .filter(isValidPackageName)
      .forEach(d => discoveredDeps.add(d));
  }

  // Merge dynamic manual dependencies if passed from ReactBits component Install.json
  if (installData?.manual?.[packageManager]) {
    const manualLine = installData.manual[packageManager];
    const match = manualLine.match(/(?:add|install)\s+([^&]+)/);
    if (match && match[1]) {
      const pkgNames = match[1].trim().split(/\s+/).filter(p => p && !p.startsWith('-'));
      pkgNames.forEach(p => discoveredDeps.add(p));
    }
  }

  // 2. Merge extra deps into package.json before the single install pass.
  //    This replaces the old two-step (base install → extra install) with one
  //    resolution pass, cutting ~3-4 minutes off every generation.
  notify(`Merging dependencies...`);
  const pkgJsonPath = path.join(targetDir, 'package.json');
  try {
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
    pkgJson.dependencies = pkgJson.dependencies || {};
    for (const dep of discoveredDeps) {
      if (!pkgJson.dependencies[dep] && !pkgJson.devDependencies?.[dep]) {
        pkgJson.dependencies[dep] = 'latest';
      }
    }
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
  } catch (e) {
    log(`[DemoCLI] Warning: Could not patch package.json, falling back to separate install: ${e.message}\n`);
    // Fallback: install extras separately as before
    const depList = Array.from(discoveredDeps).join(' ');
    if (depList) await runCommand(`${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${depList}`, [], targetDir, log);
  }

  notify(`Installing all dependencies via ${packageManager}...`);
  await runCommand(`${packageManager} install`, [], targetDir, log);

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

  // 3b. Lanyard-specific setup: copy assets + patch vite config + add type declarations
  const hasLanyard = componentsToInject.some(c => c.name === 'Lanyard');
  if (hasLanyard) {
    notify(`Setting up Lanyard assets and config...`);
    const lanyardCompDir = path.join(targetDir, 'src', 'components', 'Components', 'Lanyard');

    // Copy card.glb and lanyard.png next to the component (relative imports)
    const jokerAssetsDir = path.join(__dirname, '..', 'joker-assets');
    for (const assetName of ['card.glb', 'lanyard.png']) {
      const src = path.join(jokerAssetsDir, assetName);
      const dest = path.join(lanyardCompDir, assetName);
      try { await fs.copyFile(src, dest); } catch (e) { log(`[DemoCLI] Warning: Could not copy ${assetName}: ${e.message}\n`); }
    }

    // Patch vite.config.ts to add assetsInclude for .glb files
    const viteConfigPath = path.join(targetDir, 'vite.config.ts');
    try {
      let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');
      if (!viteConfig.includes('assetsInclude')) {
        viteConfig = viteConfig.replace(
          /plugins:\s*\[/,
          `assetsInclude: ['**/*.glb'],\n  plugins: [`
        );
        await fs.writeFile(viteConfigPath, viteConfig, 'utf-8');
      }
    } catch (e) { log(`[DemoCLI] Warning: Could not patch vite.config.ts: ${e.message}\n`); }

    // Create global.d.ts with meshline and asset module declarations
    const globalDts = `export {};\n\ndeclare module '*.glb';\ndeclare module '*.png';\n\ndeclare module 'meshline' {\n  export const MeshLineGeometry: any;\n  export const MeshLineMaterial: any;\n}\n\ndeclare global {\n  namespace JSX {\n    interface IntrinsicElements {\n      meshLineGeometry: any;\n      meshLineMaterial: any;\n    }\n  }\n}\n`;
    await fs.writeFile(path.join(targetDir, 'src', 'global.d.ts'), globalDts, 'utf-8');
  }

  // 4. Overwrite App.tsx (For single component, legacy mode)
  if (!enhancedPrompt) {
    const appTsxPath = path.join(targetDir, 'src', 'App.tsx');
    let modifiedUsageCode = usageCode.replace(
      new RegExp(`from\\s+['"]\\.\\/${componentName}['"]`, 'g'),
      `from './components/${componentCategory || "Components"}/${componentName}/${componentName}'`
    );

    // Inject contrast-safe color props for TextAnimation components.
    // index.css always sets background: #000000, so we contrast against that.
    if (componentCategory === 'TextAnimations') {
      const DEMO_BG = '#000000';
      modifiedUsageCode = injectColorPropsIntoUsage(modifiedUsageCode, componentName, DEMO_BG);
    }

    if (!modifiedUsageCode.includes("export default") && !modifiedUsageCode.includes("const App =")) {
      const lines = modifiedUsageCode.split('\n');
      const importLines = lines.filter(l => l.trim().startsWith('import '));
      const nonImportLines = lines.filter(l => !l.trim().startsWith('import '));

      // Separate JS declarations (const/let/function/etc.) from JSX elements.
      // Usage markdowns sometimes include callback functions or variables before the JSX tag.
      const firstJsxIndex = nonImportLines.findIndex(l => l.trim().startsWith('<'));
      let preReturnCode = '';
      let jsxContent = nonImportLines.join('\n').trim();

      if (firstJsxIndex > 0) {
        preReturnCode = nonImportLines.slice(0, firstJsxIndex).join('\n').trim();
        jsxContent = nonImportLines.slice(firstJsxIndex).join('\n').trim();
      }

      const preReturn = preReturnCode ? `\n  ${preReturnCode.replace(/\n/g, '\n  ')}\n` : '';
      modifiedUsageCode = `${importLines.join('\n')}\n\nexport default function App() {${preReturn}\n  return (\n    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>\n      ${jsxContent.replace(/\n/g, '\n      ')}\n    </div>\n  );\n}\n`;
    }
    await fs.writeFile(appTsxPath, modifiedUsageCode, 'utf-8');
  } else {
    // For AI builds, write a temporary loading screen so Vite doesn't crash on missing SVGs while Claude generates code
    const appTsxPath = path.join(targetDir, 'src', 'App.tsx');
    const tempAiApp = `export default function App() {\n  return (\n    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', fontFamily: 'monospace' }}>\n      <p style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Claude is building your site. Please wait...</p>\n    </div>\n  );\n}\n`;
    await fs.writeFile(appTsxPath, tempAiApp, 'utf-8');
  }

  notify(`Cleaning up boilerplate styles...`);
  const appCssPath = path.join(targetDir, 'src', 'App.css');
  const indexCssPath = path.join(targetDir, 'src', 'index.css');
  const indexHtmlPath = path.join(targetDir, 'index.html');

  await fs.writeFile(appCssPath, '/* Generated by ReactBits Explorer */\n', 'utf-8');
  await fs.writeFile(indexCssPath, `@import "tailwindcss";\n\nbody { margin: 0; background: #000; color: #fff; min-height: 100vh; overflow-x: hidden; }`, 'utf-8');

  // Overwrite index.html — removes Vite favicon/logo references that trigger CORS errors
  await fs.writeFile(indexHtmlPath, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`, 'utf-8');

  // Remove default Vite/React SVG assets to avoid stale external fetches
  const filesToRemove = [
    path.join(targetDir, 'public', 'vite.svg'),
    path.join(targetDir, 'src', 'assets', 'react.svg'),
  ];
  for (const f of filesToRemove) {
    try { await fs.unlink(f); } catch (_) { /* already gone, skip */ }
  }

  notify(`Injecting Joker placeholder assets...`);
  const sourceJokerDir = path.join(__dirname, '..', 'joker-assets');
  const targetPublicDir = path.join(targetDir, 'public');
  const target3dDir = path.join(targetPublicDir, 'assets', '3d');
  try {
    await fs.mkdir(target3dDir, { recursive: true });
    const jokerFiles = await fs.readdir(sourceJokerDir);
    for (const f of jokerFiles) {
      if (f.endsWith('.glb')) {
        // FluidGlass and other 3D components expect GLBs at /assets/3d/
        await fs.copyFile(path.join(sourceJokerDir, f), path.join(target3dDir, f));
      } else if (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.svg')) {
        await fs.copyFile(path.join(sourceJokerDir, f), path.join(targetPublicDir, f));
      }
    }
  } catch (err) {
    log(`[DemoCLI] Warning: Could not copy joker assets: ${err.message}\n`);
  }

  // 5. Build AI Files if Master Build
  let isAiBuild = false;
  if (enhancedPrompt) {
    isAiBuild = true;
    notify(`Saving AI Master Brief...`);
    await fs.writeFile(path.join(targetDir, 'enhancedPrompt.json'), JSON.stringify(enhancedPrompt, null, 2), 'utf-8');

    notify(`Configuring Claude Mission Control...`);

    // ── Build component import path list ──────────────────────────────────────
    const allComponents = selectedComponents || [];
    const importLines = allComponents
      .filter(c => c.name && c.category)
      .map(c => `import ${c.name} from './components/${c.category}/${c.name}/${c.name}'`)
      .join('\n');

    // ── Classify components for layout guidance ───────────────────────────────
    const ambientNames = allComponents
      .filter(c => c.category === 'Backgrounds')
      .map(c => c.name);
    const cursorNames = allComponents
      .filter(c => c.category === 'Animations' && ['BlobCursor','Crosshair','ImageTrail','PixelTrail','SplashCursor','TargetCursor'].includes(c.name))
      .map(c => c.name);

    // ── Build TextAnimation color guidance ────────────────────────────────────
    const bgColor = enhancedPrompt?.designTokens?.colors?.background || '#000000';
    const textAnimComponents = allComponents
      .filter(c => c.category === 'TextAnimations')
      .map(c => c.name);
    const colorGuidanceSection = buildColorGuidanceSection(textAnimComponents, bgColor);

    // ── Write CLAUDE.md (self-contained mission brief) ────────────────────────
    const claudeMdContent = `# MISSION

You are a senior React + TypeScript developer and UI designer. Build a complete, production-quality site.

- **Editable files**: \`src/App.tsx\`, \`src/index.css\`, \`index.html\` — do not create other source files
- **Stack**: Vite + React 18 (TypeScript) + Tailwind CSS v4
- **Stop condition**: when \`npx tsc --noEmit\` passes with zero errors, output the word **DONE** and stop

---

# AESTHETIC DIRECTION

You must produce something visually distinctive — not generic AI output. Before writing any code, commit to a clear aesthetic direction based on the project theme and mood in the design brief.

**Typography**
- Apply the fonts from \`designTokens.typography\` — load them from Google Fonts (add a \`<link>\` in \`index.html\`, apply via \`font-family\` in \`src/index.css\`)
- NEVER use Inter, Roboto, Arial, or system-ui as the primary typeface — these are generic defaults
- Pair the heading font on all \`h1\`–\`h3\` elements; apply the body font globally via \`body\` in CSS

**Color**
- Follow \`designTokens.colors\` exactly — use the primary, secondary, background, text, and accent values
- Use CSS variables in \`src/index.css\` (e.g. \`--color-primary: #...\`) so colors are consistent throughout

**Content — NO AI SLOP**
- Write copy that is specific to the project's actual theme and purpose
- NEVER use phrases like: "Unleash Your Creativity", "Cutting-Edge Solutions", "Transform Your Business", "Elevate Your Experience", "Revolutionary Platform", "Seamlessly Integrated"
- Write real, contextual content: named features, realistic taglines, specific benefit statements tied to the actual product/topic

**Interactions**
- Preserve every component's native animations and interaction behavior exactly as designed
- Do NOT wrap interactive components (Dock, carousels, sliders) in containers that constrain their width/height or block pointer events

---

# COMPONENT IMPORT PATHS

All components are pre-installed in \`src/components/\`. Use these exact import paths:

\`\`\`tsx
${importLines || '// No components — build a plain HTML/CSS site'}
\`\`\`

Before using any component, **read its source file** to understand its props interface exactly.

---

# DESIGN BRIEF

\`\`\`json
${JSON.stringify(enhancedPrompt, null, 2)}
\`\`\`

---

# LAYOUT RULES

${ambientNames.length > 0 ? `**Ambient / Background components** (${ambientNames.join(', ')}):
\`\`\`tsx
<ComponentName style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
\`\`\`` : ''}

${cursorNames.length > 0 ? `**Cursor / Overlay components** (${cursorNames.join(', ')}):
\`\`\`tsx
<ComponentName style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />
\`\`\`` : ''}

- Do **NOT** wrap full-viewport components in fixed-height containers
- Use Tailwind classes and/or inline styles for all layout and spacing
- Do **NOT** scan \`node_modules\` or install new packages unless \`tsc\` reveals a missing \`@types/\` package

---

# TYPESCRIPT RULES

- Read the component's \`.tsx\` source to verify exact prop names before using them
- Use \`string\` color values (hex literals) for WebGL/canvas components — not CSS variables
- TextAnimation components must have explicit color props set (WCAG AA contrast ≥ 4.5:1)
- **Icons**: NEVER import named icons from \`lucide-react\` — the installed version may not export the icon you expect and TypeScript will NOT catch it. Use \`react-icons\` subpaths: \`import { FaGithub } from 'react-icons/fa'\`, \`import { VscHome } from 'react-icons/vsc'\`
- **Interactive component props**: When a component prop expects a React element (e.g. an icon), pass an actual JSX element — not a string like \`"<VscHome />"\`
${colorGuidanceSection}

---

# WORKFLOW

1. Read this file fully
2. Read \`src/components/{Category}/{Name}/{Name}.tsx\` for each component — understand its exact props interface
3. Commit to an aesthetic direction (typography, color, spatial layout) true to the design brief mood
4. Add Google Fonts \`<link>\` to \`index.html\` for the fonts in \`designTokens.typography\`
5. Write CSS variables and global font-family rules in \`src/index.css\`
6. Write \`src/App.tsx\` — complete file, real content, no placeholders
7. Run: \`npx tsc --noEmit\`
8. If errors → fix them and re-run \`tsc\`
9. When \`tsc\` is clean → output **DONE** and stop
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

  // 7. Run Claude Code agent (programmatic — no terminal window)
  if (isAiBuild) {
    notify(`Claude Code agent is building your site...`);
    const { generateCode } = require('../../electron/codeGenerator.cjs');
    await generateCode({
      projectPath: targetDir,
      onProgress: notify,
    });
  }

  // 8. Final Integrity Check (always runs after AI build completes, or for single-component builds)
  notify(`Verifying project integrity (checking for TypeScript errors)...`);
  try {
    await runCommand('npx tsc --noEmit', [], targetDir, log);
    notify(`Verification complete: No TypeScript errors found! Ready to run.`);
  } catch (e) {
    if (options.runWhenDone) {
      log(`[INTEGRITY WARNING] TypeScript check found issues. Auto-launch may show errors in browser.\n`);
      notify(`Generation finished with warnings. Check terminal output for details.`);
    } else {
      log(`[INTEGRITY WARNING] Found some TypeScript issues. Project created — open it and fix any errors.\n`);
      notify(`Generation finished with warnings. Project available at target directory.`);
    }
  }

  notify(`Finished setting up target project at ${targetDir}`);
  return true;
}

module.exports = { generateViteReact };
