/**
 * component-mapper.cjs
 * Maps every ReactBits component to its import line + working JSX snippet.
 * Uses the manifest usageMarkdown as the source of truth — those demos are proven.
 *
 * Categories:
 *   Backgrounds → fixed, zIndex: 0, pointerEvents: none
 *   Animations  → inline wrappers (scroll triggers, cursors, etc.)
 *   Components  → section content (menus, cards, lists, etc.)
 *   TextAnimations → inline inside headings/paragraphs
 *
 * Cursor names (fixed, zIndex: 9999):
 *   BlobCursor, Crosshair, ImageTrail, PixelTrail, SplashCursor, TargetCursor
 */

const path = require('path');
const MANIFEST_PATH = path.join(__dirname, '../../src/reactbits-manifest.json');

const CURSOR_NAMES = new Set([
  'BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor',
]);

/**
 * Hand-crafted JSX overrides for components whose usageMarkdown can't be cleanly extracted.
 * Use these when the example requires variable declarations, external libraries, or complex setup.
 */
// Nav component names — rendered as fixed overlays in App.tsx, never as in-flow sections
const NAV_COMPONENT_NAMES = new Set([
  'StaggeredMenu', 'GooeyNav', 'CardNav',
]);

function isNavComponent(name) {
  return NAV_COMPONENT_NAMES.has(name);
}

const COMPONENT_JSX_OVERRIDES = {
  LogoLoop: `<LogoLoop
  logos={[
    { node: <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>◈</span>, title: "Design" },
    { node: <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>◉</span>, title: "Build" },
    { node: <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>◎</span>, title: "Ship" },
    { node: <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>◆</span>, title: "Scale" },
    { node: <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>◇</span>, title: "Grow" },
  ]}
  speed={60}
  direction="left"
  logoHeight={60}
  gap={80}
  scaleOnHover={true}
  fadeOut={true}
  fadeOutColor="var(--color-bg)"
  verticalPosition="center"
/>`,

  StaggeredMenu: `<div style={{ position: 'fixed', top: 0, right: 0, zIndex: 999, pointerEvents: 'auto' }}>
  <StaggeredMenu
    position="right"
    items={[
      { label: 'Home', ariaLabel: 'Go to home', link: '/' },
      { label: 'About', ariaLabel: 'About us', link: '/about' },
      { label: 'Services', ariaLabel: 'Our services', link: '/services' },
      { label: 'Contact', ariaLabel: 'Contact us', link: '/contact' },
    ]}
    socialItems={[
      { label: 'Twitter', link: 'https://twitter.com' },
      { label: 'GitHub', link: 'https://github.com' },
      { label: 'LinkedIn', link: 'https://linkedin.com' },
    ]}
    displaySocials={true}
    displayItemNumbering={true}
  />
</div>`,

  Dock: `<div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <Dock
    items={[
      { icon: <span style={{ fontSize: '1.1rem' }}>⌂</span>, label: 'Home', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>☰</span>, label: 'Menu', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>★</span>, label: 'Saved', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>⚙</span>, label: 'Settings', onClick: () => {} },
    ]}
    panelHeight={68}
    baseItemSize={50}
    magnification={70}
  />
</div>`,

  GooeyNav: `<nav style={{ position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <GooeyNav
    items={[
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Work', href: '/work' },
      { label: 'Contact', href: '/contact' },
    ]}
    particleCount={15}
    particleDistances={[90, 10]}
    particleR={100}
    initialActiveIndex={0}
    animationTime={600}
    colors={[1, 2, 3, 1, 2]}
  />
</nav>`,

  GlassIcons: `<GlassIcons
  items={[
    { icon: <span style={{ fontSize: '1.4rem' }}>◈</span>, color: 'blue', label: 'Design' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◉</span>, color: 'purple', label: 'Build' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◎</span>, color: 'red', label: 'Launch' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◆</span>, color: 'indigo', label: 'Scale' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◇</span>, color: 'orange', label: 'Grow' },
  ]}
/>`,

  ImageTrail: `<div style={{ height: '500px', width: '100%', position: 'relative', overflow: 'hidden' }}>
  <ImageTrail
    items={['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg', '/joker-square.jpg', '/joker-portrait.jpg']}
    variant={1}
  />
</div>`,

  FlyingPosters: `<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <FlyingPosters
    items={['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg']}
  />
</div>`,

  GridMotion: `<div style={{ height: '600px', position: 'relative', overflow: 'hidden' }}>
  <GridMotion
    items={[
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
    ]}
  />
</div>`,

  CardNav: `<div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, pointerEvents: 'auto' }}>
  <CardNav
    logo="/joker-square.jpg"
    logoAlt="Logo"
    items={[
      { label: 'About', bgColor: '#0D0716', textColor: '#fff', links: [{ label: 'Company', href: '#', ariaLabel: 'About Company' }, { label: 'Team', href: '#', ariaLabel: 'Our Team' }] },
      { label: 'Work', bgColor: '#170D27', textColor: '#fff', links: [{ label: 'Projects', href: '#', ariaLabel: 'Our Projects' }, { label: 'Case Studies', href: '#', ariaLabel: 'Case Studies' }] },
      { label: 'Contact', bgColor: '#0D1A27', textColor: '#fff', links: [{ label: 'Get in Touch', href: '#', ariaLabel: 'Contact Us' }] },
    ]}
    baseColor="var(--color-text)"
    menuColor="var(--color-bg)"
    buttonBgColor="var(--color-accent)"
    buttonTextColor="var(--color-bg)"
  />
</div>`,

  PlasmaWave: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <PlasmaWave
    colors={['#7C3AED', '#22D3EE']}
    speed1={0.018}
    speed2={0.026}
    focalLength={1.05}
    bend1={0.55}
    bend2={0.35}
    dir2={1}
    rotationDeg={-8}
  />
</div>`,

  Ballpit: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <Ballpit
    count={200}
    gravity={0.7}
    friction={0.8}
    wallBounce={0.95}
    followCursor={true}
  />
</div>`,

  HyperSpeed: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <HyperSpeed effectOptions={{ onSpeedUp: () => {}, onSlowDown: () => {} }} />
</div>`,

  RippleGrid: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <RippleGrid enableRainbow={true} rippleColor={[0.3, 0.6, 1]} />
</div>`,

  GridMotion: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.15 }}>
  <GridMotion
    items={[
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
    ]}
  />
</div>`,

  Folder: `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
  <Folder
    items={[
      <div style={{ width: 40, height: 40, background: 'var(--color-accent)', borderRadius: 4 }} />,
      <div style={{ width: 40, height: 40, background: 'var(--color-primary)', borderRadius: 4 }} />,
      <div style={{ width: 40, height: 40, background: 'var(--color-secondary)', borderRadius: 4 }} />,
    ]}
  />
</div>`,

  Counter: `<Counter
  value={2500}
  places={[1000, 100, 10, 1]}
  fontSize={80}
  padding={5}
  gap={10}
  textColor="var(--color-text)"
  fontWeight={900}
  gradientFrom="var(--color-bg)"
  gradientTo="var(--color-bg)"
/>`,

  Crosshair: `<div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden', background: 'var(--color-surface)', borderRadius: 8 }}>
  <Crosshair color="var(--color-accent)" />
  <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--color-text)', opacity: 0.4, fontSize: '0.9rem', pointerEvents: 'none' }}>Move cursor here</p>
</div>`,
};

// Image replacements: swap picsum/external URLs with local joker assets
const IMAGE_REPLACEMENTS = [
  [/["']https:\/\/picsum\.photos\/\d+\/\d+[^"']*["']/g, '"/joker-square.jpg"'],
  [/["']https:\/\/picsum\.photos\/\d+[^"']*["']/g, '"/joker-square.jpg"'],
  [/"\/joker-portrait\.jpg"/g, '"/joker-portrait.jpg"'],
  [/"\/joker-landscape\.jpg"/g, '"/joker-landscape.jpg"'],
  [/"\/joker-square\.jpg"/g, '"/joker-square.jpg"'],
];

// Rotate through joker images for multi-image components
const JOKER_IMAGES = ['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg'];
function jokerImg(index) { return JOKER_IMAGES[index % JOKER_IMAGES.length]; }

/**
 * Fix all external image URLs in a JSX string to use local joker assets.
 */
function fixImageUrls(jsx) {
  // Replace picsum URLs with cycling joker images
  let imageIndex = 0;
  jsx = jsx.replace(/["']https:\/\/picsum\.photos[^"']*["']/g, () => `"${jokerImg(imageIndex++)}"`);
  // Replace any remaining http/https image references
  jsx = jsx.replace(/["'](https?:\/\/[^"']*\.(jpg|jpeg|png|webp|gif|svg))[^"']*["']/gi, () => `"${jokerImg(imageIndex++)}"`);
  return jsx;
}

/**
 * Extracts and transforms usageMarkdown into a clean JSX snippet.
 * Adjusts import path for use in generated project's src/ directory.
 */
function extractComponentData(entry) {
  const { name, category, usageMarkdown } = entry;
  const isCursor = CURSOR_NAMES.has(name);
  const isBackground = category === 'Backgrounds';
  const isFixed = isBackground || isCursor;
  const zIndex = isBackground ? 0 : isCursor ? 9999 : category === 'Components' ? 10 : 5;

  const importLine = `import ${name} from './components/${category}/${name}/${name}';`;

  // Use hand-crafted override if available
  if (COMPONENT_JSX_OVERRIDES[name]) {
    return { name, category, importLine, jsx: COMPONENT_JSX_OVERRIDES[name], isFixed, zIndex };
  }

  if (!usageMarkdown || !usageMarkdown.trim()) {
    return {
      name, category, importLine,
      jsx: buildPlaceholder(name, isFixed, zIndex),
      isFixed, zIndex,
    };
  }

  const raw = usageMarkdown.replace(/\r\n/g, '\n').trim();
  const jsx = buildCleanJsx(name, category, raw, isFixed, zIndex, isCursor);

  return { name, category, importLine, jsx, isFixed, zIndex };
}

/**
 * Builds working JSX from raw usageMarkdown.
 */
function buildCleanJsx(name, category, raw, isFixed, zIndex, isCursor) {
  const lines = raw.split('\n');

  // Track names imported from stripped import lines — their references must also be removed
  const strippedImportNames = new Set();
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('import ') || t.startsWith('import type')) continue;
    // Default import: import Name from '...'
    const defMatch = t.match(/^import\s+(\w+)\s+from/);
    if (defMatch) strippedImportNames.add(defMatch[1]);
    // Named imports: import { Foo, Bar as Baz } from '...'
    const namedMatch = t.match(/import\s*\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach(n => {
        const clean = n.trim().split(/\s+as\s+/).pop().trim();
        if (/^[a-zA-Z_$]\w*$/.test(clean)) strippedImportNames.add(clean);
      });
    }
    // Namespace: import * as Ns from '...'
    const nsMatch = t.match(/import\s*\*\s+as\s+(\w+)/);
    if (nsMatch) strippedImportNames.add(nsMatch[1]);
  }

  // Strip import lines
  const nonImport = lines.filter(l => !l.trim().startsWith('import '));

  // Remove export default function App() wrapper if present
  let content = nonImport.join('\n').trim();
  content = stripAppWrapper(content);

  // Remove outer wrapping divs that are purely for demo sizing (100vw/100vh containers)
  content = stripDemoWrappers(content);

  // If content mixes JS declarations with JSX, extract only the JSX portion
  // Pass stripped import names so their references are removed too
  content = extractJsxOnly(content, strippedImportNames);

  // Strip trailing // single-line comments from JSX prop lines
  content = stripJsxLineComments(content);

  // Fix image URLs
  content = fixImageUrls(content);

  // Trim whitespace-only lines at edges
  content = content.trim();

  // If empty or just whitespace, use placeholder
  if (!content || content.length < 10) {
    return buildPlaceholder(name, isFixed, zIndex);
  }

  // For fixed/background components, ensure they have correct positioning style
  if (isFixed) {
    return buildFixedWrapper(name, content, zIndex, isCursor);
  }

  return content;
}

/**
 * Removes export default function App() {} wrapper from usage code.
 */
function stripAppWrapper(content) {
  // Match: export default function App() { ... return ( ... ); }
  const appMatch = content.match(/export\s+default\s+function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/);
  if (appMatch) return appMatch[1].trim();

  // Match: const App = () => { return ( ... ); }
  const constMatch = content.match(/(?:const|function)\s+\w+\s*(?:=\s*\(\)\s*=>)?\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/);
  if (constMatch) return constMatch[1].trim();

  // Match bare return (...)
  const returnMatch = content.match(/^return\s*\(([\s\S]*)\);?\s*$/);
  if (returnMatch) return returnMatch[1].trim();

  return content;
}

/**
 * When usageMarkdown contains JS declarations (const/let/var) followed by JSX,
 * extract only the JSX portion and strip any references to dropped variable/import names.
 * @param {string} content - The code content (imports already stripped)
 * @param {Set<string>} extraStrippedNames - Names from stripped import statements
 */
function extractJsxOnly(content, extraStrippedNames = new Set()) {
  const trimmed = content.trim();
  const hasDeclarations = /^(const|let|var|function)\s/m.test(trimmed);

  const allStrippedNames = new Set(extraStrippedNames);
  let jsxPart = trimmed;

  if (hasDeclarations) {
    const lines = trimmed.split('\n');
    const jsxStartIndex = lines.findIndex(l => l.trim().startsWith('<'));
    if (jsxStartIndex !== -1) {
      // Collect inline-declared variable names too
      for (const line of lines.slice(0, jsxStartIndex)) {
        const m = line.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)/);
        if (m) allStrippedNames.add(m[1]);
      }
      jsxPart = lines.slice(jsxStartIndex).join('\n').trim();
    }
  }

  // Remove all references to names that were stripped (import or inline declarations)
  for (const vname of allStrippedNames) {
    const safe = vname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove prop assignment: someProp={varName}
    jsxPart = jsxPart.replace(new RegExp(`\\s+\\w+={${safe}}`, 'g'), '');
    // Remove direct JSX expression: {varName}
    jsxPart = jsxPart.replace(new RegExp(`\\{${safe}\\}`, 'g'), '');
  }

  return jsxPart;
}

/**
 * Strip trailing // single-line comments from JSX prop lines.
 * Avoids stripping inside URLs (e.g. http://).
 */
function stripJsxLineComments(content) {
  // Remove "  // comment" that follows a prop value — negative lookbehind for ":"
  // so http:// and similar are preserved
  return content.replace(/(?<!:)\s*\/\/(?!\/)[^\n]*/g, '');
}

/**
 * Removes 100vw/100vh demo wrapper divs.
 */
function stripDemoWrappers(content) {
  // Strip outermost <div style={{width:'100vw', height:'100vh'...}}> wrappers
  content = content.replace(
    /<div\s+style=\{\{[^}]*(?:100vw|100vh|width:\s*['"]100%['"])[^}]*\}\}>\s*([\s\S]*?)\s*<\/div>\s*$/,
    '$1'
  );
  return content.trim();
}

/**
 * Wraps fixed/background components with the correct position style.
 */
function buildFixedWrapper(name, content, zIndex, isCursor) {
  // Check if the component already has positioning props
  if (content.includes('position:') || content.includes("position: 'fixed'")) {
    return content;
  }

  // Self-closing or full component — add style prop if it's a simple tag
  const selfClosing = content.match(/^<(\w+)([^>]*?)\/>\s*$/s);
  if (selfClosing) {
    const attrs = selfClosing[2].trim();
    const pointerEvents = isCursor ? 'auto' : 'none';
    return `<${name} ${attrs} style={{ position: 'fixed', inset: 0, zIndex: ${zIndex}, pointerEvents: '${pointerEvents}' }} />`;
  }

  return content;
}

function buildPlaceholder(name, isFixed, zIndex) {
  if (isFixed) {
    return `<${name} style={{ position: 'fixed', inset: 0, zIndex: ${zIndex}, pointerEvents: 'none' }} />`;
  }
  return `<div style={{ padding: '2rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, textAlign: 'center', color: 'var(--color-text)' }}><p style={{ margin: 0, opacity: 0.5 }}>${name}</p></div>`;
}

// ── Load and build the component map ─────────────────────────────────────────

let _manifest = null;
function getManifest() {
  if (!_manifest) {
    try { _manifest = require(MANIFEST_PATH); }
    catch (e) { console.warn('[component-mapper] Could not load manifest:', e.message); _manifest = []; }
  }
  return _manifest;
}

let _componentMap = null;
function getComponentMap() {
  if (_componentMap) return _componentMap;
  const manifest = getManifest();
  _componentMap = {};
  for (const entry of manifest) {
    _componentMap[entry.name] = extractComponentData(entry);
  }
  return _componentMap;
}

/**
 * getComponent(name)
 * Returns { importLine, jsx, isFixed, zIndex, category } for the given component name.
 * Falls back to a placeholder if not found.
 */
function getComponent(name) {
  const map = getComponentMap();
  if (map[name]) return map[name];

  // Unknown component — build a placeholder
  return {
    name,
    category: 'Components',
    importLine: `// import ${name} from './components/Components/${name}/${name}'; // Not found in manifest`,
    jsx: buildPlaceholder(name, false, 10),
    isFixed: false,
    zIndex: 10,
  };
}

/**
 * getMappedNames()
 * Returns array of all component names that have real (non-placeholder) JSX.
 */
function getMappedNames() {
  const map = getComponentMap();
  return Object.values(map)
    .filter(c => !c.jsx.includes('dashed'))
    .map(c => c.name);
}

/**
 * isComponentMapped(name)
 * Returns true if the component has real mapped JSX (not a placeholder).
 */
function isComponentMapped(name) {
  const c = getComponent(name);
  return !c.jsx.includes('dashed');
}

module.exports = { getComponent, getMappedNames, isComponentMapped, isNavComponent };
