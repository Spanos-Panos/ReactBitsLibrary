'use strict';
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

// ── Shell runner (same pattern as vite-react.cjs) ─────────────────────────────
function runCommand(command, args, cwd, onLog) {
  return new Promise((resolve, reject) => {
    if (!command) return reject(new Error('Attempted to run an empty command.'));
    const safeCwd = path.resolve(cwd);
    const env = { ...process.env, CI: 'true', FORCE_COLOR: '1', YES: 'true', NPM_CONFIG_YES: 'true' };
    const child = spawn(command, args, { cwd: safeCwd, shell: true, env });
    const handleOutput = (data) => { if (onLog) onLog(data.toString()); };
    child.stdout.on('data', handleOutput);
    child.stderr.on('data', handleOutput);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

// ── Route helpers ─────────────────────────────────────────────────────────────
function pageTypeToRoute(type, title) {
  if (type === 'home') return '/';
  if (type === 'about') return '/about';
  if (type === 'services') return '/services';
  if (type === 'contact') return '/contact';
  // custom → slugify the title
  return '/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// "My Cool Page" → "MyCoolPage"  (safe React component name)
function titleToPascalCase(title) {
  const clean = title.replace(/[^a-zA-Z0-9\s]/g, '');
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('') || 'Page';
}

// ── Navbar prop detection ─────────────────────────────────────────────────────
// Tries to find which prop name the navbar uses for its link list.
function detectNavLinksProps(navbarSrc) {
  if (!navbarSrc) return null;
  const candidates = ['navLinks', 'links', 'items', 'menuItems', 'navItems'];
  for (const prop of candidates) {
    // Match prop appearing in a TypeScript interface/type or destructured params
    if (new RegExp(`\\b${prop}\\b.*[:{\\[]`).test(navbarSrc)) return prop;
  }
  return null;
}

/**
 * Returns true for navbars that use position:absolute/fixed inside a
 * full-viewport wrapper (e.g. StaggeredMenu, FlowingMenu).
 * These MUST be placed inside a `position:relative; height:100vh` shell,
 * NOT as a flex row item — otherwise their panels collapse.
 */
function isOverlayNavbar(navbarSrc, navName) {
  if (!navbarSrc && !navName) return false;
  const overlayNames = ['StaggeredMenu', 'FlowingMenu'];
  if (overlayNames.some(n => navName && navName.toLowerCase().includes(n.toLowerCase()))) return true;
  // Heuristic: component uses position:absolute on its panel + height:100%
  if (
    navbarSrc &&
    navbarSrc.includes('position: absolute') &&
    navbarSrc.includes('height: 100%')
  ) return true;
  return false;
}

// ── File content builders ─────────────────────────────────────────────────────

function buildMainLayout(navbarComponent, pages, navbarSrc) {
  const navName = navbarComponent.name;
  const importPath = `../components/${navbarComponent.category}/${navName}/${navName}`;

  const routes = pages.map(p => ({ label: p.title, href: pageTypeToRoute(p.type, p.title) }));
  const linksProp = detectNavLinksProps(navbarSrc);
  const overlayNav = isOverlayNavbar(navbarSrc, navName);

  // Build the props string to forward to the navbar
  let propsStr = '';
  if (linksProp) {
    const linksLiteral = routes
      .map(r => `{ label: '${r.label}', link: '${r.href}', href: '${r.href}', ariaLabel: 'Go to ${r.label}' }`)
      .join(', ');
    propsStr += ` ${linksProp}={[${linksLiteral}]}`;
  }
  // StaggeredMenu also needs 'items' (its actual prop) and a safe logoUrl
  if (navName === 'StaggeredMenu') {
    const itemsLiteral = routes
      .map(r => `{ label: '${r.label}', ariaLabel: 'Go to ${r.label}', link: '${r.href}' }`)
      .join(', ');
    // Override the default logoUrl which points to an internal ReactBits path
    propsStr = ` items={[${itemsLiteral}]} logoUrl="/logo.svg"`;
  }

  const todoComment = `{/* TODO: pass navigation links to ${navName} — routes: ${routes.map(r => r.href).join(', ')} */}`;
  const navbarJsx = propsStr
    ? `      <${navName}${propsStr} />`
    : `      ${todoComment}\n      <${navName} />`;

  if (overlayNav) {
    // Overlay navbars use position:absolute inside a height:100vh container.
    // Wrap in a fixed viewport shell so the panel and GSAP animations work.
    return `import { Outlet } from 'react-router-dom';
import ${navName} from '${importPath}';

export default function MainLayout() {
  return (
    <>
      {/* Overlay navbar — fixed viewport shell required */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
${navbarJsx}
        </div>
      </div>
      {/* Page content — top padding reserves space under the header bar */}
      <main style={{ paddingTop: '5rem' }}>
        <Outlet />
      </main>
    </>
  );
}
`;
  }

  // Standard inline navbar (top of flex column)
  return `import { Outlet } from 'react-router-dom';
import ${navName} from '${importPath}';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
${navbarJsx}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
`;
}

function buildPageComponent(page, allSelectedComponents) {
  const pageName = titleToPascalCase(page.title);

  // Resolve component objects for this page's componentIds
  const pageComps = page.componentIds
    .map(id => allSelectedComponents.find(c =>
      `${c.category}/${c.name}` === id || c.id === id || c.name === id
    ))
    .filter(Boolean);

  const importLines = pageComps
    .map(c => `import ${c.name} from '../components/${c.category}/${c.name}/${c.name}';`)
    .join('\n');

  let sectionsContent;
  if (pageComps.length === 0) {
    sectionsContent =
      `      <section style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <p style={{ opacity: 0.5 }}>No components assigned to this page yet.</p>
      </section>`;
  } else {
    sectionsContent = pageComps
      .map(c => `      <section style={{ width: '100%', position: 'relative' }}>\n        <${c.name} />\n      </section>`)
      .join('\n');
  }

  return `${importLines ? importLines + '\n\n' : ''}export default function ${pageName}() {
  return (
    <main>
${sectionsContent}
    </main>
  );
}
`;
}

function buildAppTsx(pages) {
  const imports = pages
    .map(p => `import ${titleToPascalCase(p.title)} from './pages/${titleToPascalCase(p.title)}';`)
    .join('\n');

  const routes = pages
    .map(p => {
      const name = titleToPascalCase(p.title);
      const route = pageTypeToRoute(p.type, p.title);
      return `          <Route path="${route}" element={<${name} />} />`;
    })
    .join('\n');

  return `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
${routes}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
`;
}

function buildIndexCss(projectName) {
  return `/* ${projectName} — generated by ReactBits Explorer */

:root {
  --color-bg: #0a0a0a;
  --color-text: #f5f5f5;
  --color-primary: #6366f1;
  --color-secondary: #a1a1aa;
  --color-accent: #f59e0b;
  --max-width: 1280px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
}

img, svg {
  display: block;
  max-width: 100%;
}
`;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function generateStructure(payload, event, taskId) {
  const {
    pages,
    navbarComponentId,
    projectName,
    outputPath,
    packageManager = 'npm',
    selectedComponents = [],
  } = payload;

  const notify = (msg) => {
    console.log(`[Structure:${taskId}] ${msg}`);
    if (event && event.sender) event.sender.send('generate-progress', msg, taskId);
  };
  const log = (msg) => {
    process.stdout.write(msg);
    if (event && event.sender) event.sender.send('generate-log', msg, taskId);
  };

  try {
    const safeProjectName = (projectName || 'my-app').replace(/[^a-z0-9-_]/gi, '-');
    const parentDir = path.resolve(outputPath);
    const targetDir = path.join(parentDir, safeProjectName);

    // Locate the navbar component object
    const navbarComponent = selectedComponents.find(c =>
      `${c.category}/${c.name}` === navbarComponentId ||
      c.id === navbarComponentId ||
      c.name === navbarComponentId
    );
    if (!navbarComponent) {
      throw new Error(`Navbar component not found: ${navbarComponentId}`);
    }

    // ── Step 1: Vite scaffold ────────────────────────────────────────────────
    notify(`Scaffolding Vite + React TypeScript project '${safeProjectName}'...`);
    const scaffoldCmds = {
      npm: `npm create vite@latest ${safeProjectName} -- --template react-ts`,
      pnpm: `pnpm create vite ${safeProjectName} --template react-ts`,
      yarn: `yarn create vite ${safeProjectName} --template react-ts`,
    };
    await runCommand(scaffoldCmds[packageManager] || scaffoldCmds.npm, [], parentDir, log);

    // ── Step 2: Patch package.json (add router + common deps in one install) ─
    notify(`Adding react-router-dom and common dependencies...`);
    const pkgJsonPath = path.join(targetDir, 'package.json');
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
    pkgJson.dependencies = pkgJson.dependencies || {};
    const extraDeps = [
      'react-router-dom',
      'framer-motion',
      'motion',
      'gsap',
      'ogl',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'react-icons',
    ];
    for (const dep of extraDeps) {
      if (!pkgJson.dependencies[dep] && !pkgJson.devDependencies?.[dep]) {
        pkgJson.dependencies[dep] = 'latest';
      }
    }
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');

    // ── Step 3: Install ──────────────────────────────────────────────────────
    notify(`Installing dependencies via ${packageManager}...`);
    const installCmd = packageManager === 'npm' ? 'install --no-audit --no-fund' : 'install';
    await runCommand(`${packageManager} ${installCmd}`, [], targetDir, log);

    // ── Step 4: Inject component files ──────────────────────────────────────
    notify(`Injecting ${selectedComponents.length} component file(s)...`);
    for (const comp of selectedComponents) {
      if (!comp.name || !comp.files?.length) continue;
      const compDir = path.join(targetDir, 'src', 'components', comp.category || 'Components', comp.name);
      await fs.mkdir(compDir, { recursive: true });
      for (const file of comp.files) {
        await fs.writeFile(path.join(compDir, file.name), file.content, 'utf-8');
      }
    }

    // ── Step 5: Create layouts/ ──────────────────────────────────────────────
    notify(`Generating MainLayout...`);
    await fs.mkdir(path.join(targetDir, 'src', 'layouts'), { recursive: true });
    const navbarTsxFile = navbarComponent.files?.find(f => f.name.endsWith('.tsx') || f.name.endsWith('.ts'));
    const mainLayoutContent = buildMainLayout(navbarComponent, pages, navbarTsxFile?.content || '');
    await fs.writeFile(path.join(targetDir, 'src', 'layouts', 'MainLayout.tsx'), mainLayoutContent, 'utf-8');

    // ── Step 6: Create pages/ ────────────────────────────────────────────────
    notify(`Generating ${pages.length} page file(s)...`);
    await fs.mkdir(path.join(targetDir, 'src', 'pages'), { recursive: true });
    for (const page of pages) {
      const pageName = titleToPascalCase(page.title);
      const content = buildPageComponent(page, selectedComponents);
      await fs.writeFile(path.join(targetDir, 'src', 'pages', `${pageName}.tsx`), content, 'utf-8');
    }

    // ── Step 7: App.tsx with React Router ────────────────────────────────────
    notify(`Writing App.tsx with React Router...`);
    await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), buildAppTsx(pages), 'utf-8');

    // ── Step 8: CSS & HTML ────────────────────────────────────────────────────
    notify(`Writing styles and index.html...`);
    await fs.writeFile(path.join(targetDir, 'src', 'index.css'), buildIndexCss(safeProjectName), 'utf-8');
    await fs.writeFile(path.join(targetDir, 'src', 'App.css'), '/* App.css — unused by this project */\n', 'utf-8');
    await fs.writeFile(path.join(targetDir, 'index.html'), `<!doctype html>
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

    // ── Step 9: Remove Vite boilerplate ──────────────────────────────────────
    notify(`Cleaning up Vite boilerplate...`);
    for (const f of [
      path.join(targetDir, 'public', 'vite.svg'),
      path.join(targetDir, 'src', 'assets', 'react.svg'),
    ]) {
      try { await fs.unlink(f); } catch (_) { /* already gone */ }
    }

    // ── Step 10: Windows helper script ───────────────────────────────────────
    await fs.writeFile(
      path.join(targetDir, 'dev.bat'),
      `@echo off\necho Starting ${safeProjectName}...\nPowerShell -ExecutionPolicy Bypass -Command "${packageManager} run dev"\npause`,
      'utf-8'
    );

    // ── Step 11: TypeScript verification ─────────────────────────────────────
    notify(`Verifying TypeScript (tsc --noEmit)...`);
    try {
      await runCommand('npx tsc --noEmit', [], targetDir, log);
      notify(`TypeScript check passed — zero errors.`);
    } catch {
      notify(`TypeScript check found issues — project created, open in VS Code to fix.`);
    }

    notify(`${safeProjectName} — ${pages.length} page${pages.length !== 1 ? 's' : ''} ready`);
    return { success: true, path: targetDir };

  } catch (err) {
    console.error('[StructureGenerator] Fatal error:', err);
    notify(`Generation failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { generateStructure };
