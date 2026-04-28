/**
 * app-builder.cjs
 * Generates src/App.tsx from:
 *   - Fixed layer components (Backgrounds, Cursors)
 *   - Section JSX strings (from page-builder)
 *   - Router setup (if multi-page)
 * Output must be complete, functional TypeScript — no placeholder comments.
 */

const path = require('path');
const fs   = require('fs/promises');
const { getComponent, isNavComponent } = require('./component-mapper.cjs');
const { buildSinglePageSections, writePageFiles } = require('./page-builder.cjs');
const { buildContent } = require('./content-builder.cjs');

const CURSOR_NAMES = new Set([
  'BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor',
]);

/**
 * Splits selectedComponents into fixed (backgrounds + cursors), navs, and in-flow.
 * Nav components are rendered as fixed overlays in App.tsx, never passed to page-builder.
 */
function classifyComponents(selectedComponents) {
  const fixed = [];
  const navs  = [];
  const inFlow = [];

  for (const comp of selectedComponents) {
    const isBackground = comp.category === 'Backgrounds';
    const isCursor = CURSOR_NAMES.has(comp.name);
    if (isBackground || isCursor) {
      fixed.push({ ...comp, zIndex: isBackground ? 0 : 9999, isCursor });
    } else if (isNavComponent(comp.name)) {
      navs.push({ ...comp, zIndex: 999, isNav: true });
    } else {
      inFlow.push(comp);
    }
  }
  return { fixed, navs, inFlow };
}

/**
 * Generates src/App.tsx for a single-page site.
 */
async function buildSinglePageApp({ targetDir, selectedComponents, content, styleDirection }) {
  const { fixed, navs, inFlow } = classifyComponents(selectedComponents);

  const hasNav = navs.length > 0;
  const siteType = (styleDirection && styleDirection.siteType) || 'Landing';
  const inFlowNames = inFlow.map(c => c.name);

  // Build section JSX blocks (pass hasNav so hero section adjusts padding)
  const sections = buildSinglePageSections({
    content,
    styleDirection,
    selectedComponentNames: inFlowNames,
    siteType,
    hasNav,
  });

  // Import lines for all selected components
  const allImports = selectedComponents
    .filter(c => c.name && c.category)
    .map(c => getComponent(c.name).importLine)
    .join('\n');

  // Fixed layer JSX (backgrounds + cursors)
  const fixedLayers = fixed.map(c => {
    const data = getComponent(c.name);
    const pointerEvents = c.isCursor ? 'auto' : 'none';
    const jsx = data.isFixed
      ? data.jsx
      : `<${c.name} style={{ position: 'fixed', inset: 0, zIndex: ${c.zIndex}, pointerEvents: '${pointerEvents}' }} />`;
    return `      ${jsx}`;
  }).join('\n');

  // Nav layer JSX — overrides already contain fixed positioning
  const navLayers = navs.map(c => {
    const data = getComponent(c.name);
    return `      ${data.jsx}`;
  }).join('\n');

  // Add top padding when nav exists so content clears the fixed navbar
  const wrapperStyle = hasNav
    ? `position: 'relative', minHeight: '100vh', paddingTop: '4.5rem'`
    : `position: 'relative', minHeight: '100vh'`;

  const appContent = `${allImports}

export default function App() {
  return (
    <div style={{ ${wrapperStyle} }}>
${fixedLayers ? `      {/* Fixed ambient layers */}\n${fixedLayers}\n` : ''}${navLayers ? `      {/* Navigation */}\n${navLayers}\n` : ''}
      {/* Page sections */}
${sections.join('\n')}
    </div>
  );
}
`;

  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), appContent, 'utf-8');
}

/**
 * Generates src/App.tsx for a multi-page site using react-router-dom.
 */
async function buildMultiPageApp({ targetDir, selectedComponents, pageInfo, clientBrief = {} }) {
  const { fixed, navs } = classifyComponents(selectedComponents);

  const hasNav = navs.length > 0;

  // Deduplicate pages by pageName — keep first occurrence only
  const seenNames = new Set();
  const uniquePages = pageInfo.filter(p => {
    if (seenNames.has(p.pageName)) return false;
    seenNames.add(p.pageName);
    return true;
  });

  const pageImports = uniquePages
    .map(p => `import ${p.pageName}Page from './pages/${p.pageName}';`)
    .join('\n');

  const routeElements = uniquePages.map((p, i) => {
    const routePath = i === 0 ? '/' : p.path;
    return `          <Route path="${routePath}" element={<${p.pageName}Page />} />`;
  }).join('\n');

  const fixedLayers = fixed.map(c => {
    const data = getComponent(c.name);
    const pointerEvents = c.isCursor ? 'auto' : 'none';
    return `        ${data.isFixed ? data.jsx : `<${c.name} style={{ position: 'fixed', inset: 0, zIndex: ${c.zIndex}, pointerEvents: '${pointerEvents}' }} />`}`;
  }).join('\n');

  // Nav layer JSX — fixed overlays, shared across all routes
  const navLayers = navs.map(c => {
    const data = getComponent(c.name);
    return `        ${data.jsx}`;
  }).join('\n');

  const fixedImports = fixed
    .filter(c => c.name && c.category)
    .map(c => getComponent(c.name).importLine)
    .join('\n');

  const navImports = navs
    .filter(c => c.name && c.category)
    .map(c => getComponent(c.name).importLine)
    .join('\n');

  // Always generate a NavLink-based navbar for multi-page sites — reliable page links regardless
  // of whether a ReactBits nav component is selected. ReactBits nav renders as an additional overlay.
  const needsAutoNav = uniquePages.length > 1;
  const brandName = clientBrief.brandName || 'Brand';
  const autoNavLinks = uniquePages.map((p, i) => {
    const href = i === 0 ? '/' : p.path;
    const endProp = i === 0 ? ' end' : '';
    return `        <NavLink to="${href}"${endProp} style={({ isActive }) => ({ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, opacity: isActive ? 1 : 0.65, borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent', paddingBottom: '2px', transition: 'opacity 0.2s, border-color 0.2s' })}>${p.pageName}</NavLink>`;
  }).join('\n');
  const autoNavJsx = needsAutoNav ? `        {/* Auto-generated nav */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 3rem)', height: '3.5rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '1rem' }}>${brandName}</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
${autoNavLinks}
          </div>
        </nav>` : '';

  const routerImport = needsAutoNav
    ? `import { useEffect } from 'react';\nimport { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';`
    : `import { BrowserRouter, Routes, Route } from 'react-router-dom';`;

  const wrapperStyle = (hasNav || needsAutoNav)
    ? `position: 'relative', minHeight: '100vh', paddingTop: '3.5rem'`
    : `position: 'relative', minHeight: '100vh'`;

  const scrollToTop = needsAutoNav ? `
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
` : '';

  const appContent = `${routerImport}
${fixedImports}
${navImports}
${pageImports}
${scrollToTop}
export default function App() {
  return (
    <BrowserRouter>
${needsAutoNav ? '      <ScrollToTop />\n' : ''}      <div style={{ ${wrapperStyle} }}>
${fixedLayers ? `        {/* Fixed ambient layers */}\n${fixedLayers}\n` : ''}${autoNavJsx ? `${autoNavJsx}\n` : ''}${navLayers ? `        {/* Navigation */}\n${navLayers}\n` : ''}
        <Routes>
${routeElements}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
`;

  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), appContent, 'utf-8');
}

/**
 * Writes Brief.md to the project root with a readable summary of everything
 * used to create this project: components, brief, style, colors, fonts, pages.
 */
async function writeBriefMd({ targetDir, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName }) {
  const date = new Date().toISOString().slice(0, 10);
  const brand = clientBrief.brandName || 'Project';
  const aesthetic = (styleDirection.aesthetics && styleDirection.aesthetics[0]) || 'Minimal';
  const siteType = styleDirection.siteType || 'Landing';

  // Components by category
  const byCategory = {};
  for (const c of selectedComponents) {
    const cat = c.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c.name);
  }
  const componentSection = Object.entries(byCategory)
    .map(([cat, names]) => `### ${cat}\n${names.map(n => `- ${n}`).join('\n')}`)
    .join('\n\n');

  // Colors
  const colors = (designRules.colors || []);
  const colorRows = colors.length > 0
    ? colors.map(c => `| ${c.role || '—'} | ${c.hex || c.value || '—'} | ${c.label || '—'} |`).join('\n')
    : '| — | — | — |';

  // Fonts
  const fonts = (designRules.fonts || []);
  const fontLines = fonts.length > 0
    ? fonts.map(f => `- **${f.role || f.family}**: ${f.family}${f.weight ? ` (weight: ${f.weight})` : ''}`).join('\n')
    : '- Default system font';

  // Layout / sizes
  const sizes = designRules.sizes || {};
  const optimTarget = sizes.optimizationTarget || 'adaptive';
  const spacing = sizes.spacingScale || '—';

  // Pages
  const pagesSection = Array.isArray(pages) && pages.length > 1
    ? pages.map((p, i) => `- **${p.title || p.name || `Page ${i + 1}`}** (${p.type || 'custom'}) → \`/${(p.title || '').toLowerCase().replace(/\s+/g, '-') || i}\``).join('\n')
    : '- Single page';

  const lines = [
    `# Brief — ${brand}`,
    `> Generated by BitForge · ${date}${presetName ? ` · Preset: **${presetName}**` : ''}`,
    ``,
    `---`,
    ``,
    `## Overview`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| Brand | ${brand} |`,
    `| Tagline | ${clientBrief.tagline || '—'} |`,
    `| Site Type | ${siteType} |`,
    `| Aesthetic | ${aesthetic} |`,
    `| Industry | ${clientBrief.industry || '—'} |`,
    `| Call to Action | ${clientBrief.callToAction || '—'} |`,
    ``,
    `---`,
    ``,
    `## Client Brief`,
    ``,
    clientBrief.description
      ? `> ${clientBrief.description.replace(/\n/g, '\n> ')}`
      : '> (no description provided)',
    ``,
    clientBrief.targetAudience ? `**Target Audience:** ${clientBrief.targetAudience}` : '',
    clientBrief.uniqueValue    ? `**Unique Value:** ${clientBrief.uniqueValue}` : '',
    clientBrief.tone           ? `**Tone:** ${clientBrief.tone}` : '',
    ``,
    `---`,
    ``,
    `## Style Direction`,
    ``,
    `| Setting | Value |`,
    `|---|---|`,
    `| Aesthetics | ${(styleDirection.aesthetics || []).join(', ') || '—'} |`,
    `| Vibe | ${(styleDirection.vibe || []).join(', ') || '—'} |`,
    `| Color Mode | ${styleDirection.colorMode || '—'} |`,
    `| Motion Level | ${styleDirection.motionLevel || '—'} |`,
    ``,
    `---`,
    ``,
    `## Design Rules`,
    ``,
    `### Colors`,
    ``,
    `| Role | Hex | Label |`,
    `|---|---|---|`,
    colorRows,
    ``,
    `### Fonts`,
    ``,
    fontLines,
    ``,
    `### Layout`,
    ``,
    `- Optimization Target: **${optimTarget}**`,
    spacing !== '—' ? `- Spacing Scale: **${spacing}**` : '',
    ``,
    `---`,
    ``,
    `## Selected Components`,
    ``,
    componentSection || '- (none)',
    ``,
    `---`,
    ``,
    `## Pages`,
    ``,
    pagesSection,
    ``,
  ].filter(l => l !== undefined).join('\n');

  await fs.writeFile(path.join(targetDir, 'Brief.md'), lines, 'utf-8');
}

/**
 * Main export: buildApp(options)
 * Decides single vs multi-page and generates App.tsx (+ page files if multi-page).
 */
async function buildApp({ targetDir, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName }) {
  const content = buildContent(clientBrief, styleDirection && styleDirection.siteType);

  // Safety net: write a minimal valid App.tsx first — overwritten below if generation succeeds.
  // Prevents the Vite template default (with broken svg/png imports) from remaining on failure.
  const minimalApp = `export default function App() {
  return (
    <div style={{ padding: '4rem 2rem', color: 'var(--color-text, white)', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '1rem' }}>Project</h1>
      <p style={{ opacity: 0.6 }}>Generation encountered an issue — check the generator logs.</p>
    </div>
  );
}
`;
  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), minimalApp, 'utf-8');

  const isMultiPage = Array.isArray(pages) && pages.length > 1;

  if (isMultiPage) {
    const inFlowNames = selectedComponents
      .filter(c => c.category !== 'Backgrounds' && !CURSOR_NAMES.has(c.name) && !isNavComponent(c.name))
      .map(c => c.name);

    const pageInfo = await writePageFiles({
      pagesConfig: pages,
      content,
      styleDirection,
      selectedComponentNames: inFlowNames,
      targetDir,
    });

    await buildMultiPageApp({ targetDir, selectedComponents, pageInfo, clientBrief });
  } else {
    await buildSinglePageApp({ targetDir, selectedComponents, content, styleDirection });
  }

  // Write Brief.md with the full project brief for reference
  await writeBriefMd({ targetDir, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName }).catch(() => {});

  return { isMultiPage };
}

module.exports = { buildApp };
