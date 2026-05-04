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
const { getComponent, isNavComponent } = require('../shared/component-mapper.cjs');
const { buildSinglePageSections, writePageFiles } = require('./page-builder.cjs');
const { buildContent } = require('./content-builder.cjs');

const CURSOR_NAMES = new Set([
  'BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor',
]);
const DEFAULT_LOGO_DATA_URI = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 48%22%3E%3Crect width=%22160%22 height=%2248%22 rx=%2210%22 fill=%22%2311151a%22/%3E%3Ctext x=%2280%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%23f8fafc%22 font-family=%22Inter,Arial,sans-serif%22 font-size=%2216%22 font-weight=%22700%22%3EBITFORGE%3C/text%3E%3C/svg%3E';

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
    const pointerEvents = 'none';
    const layerZ = c.isCursor ? 9999 : c.zIndex;
    return `      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: ${layerZ}, pointerEvents: '${pointerEvents}', transform: 'translateZ(0)' }}>
        ${data.jsx}
      </div>`;
  }).join('\n');

  // Nav layer JSX — overrides already contain fixed positioning
  const navLayers = navs.map(c => {
    const data = getComponent(c.name);
    return `      ${data.jsx}`;
  }).join('\n');

  // Add top padding when nav exists so content clears the fixed navbar
  const wrapperStyle = hasNav
    ? `position: 'relative', minHeight: '100vh', paddingTop: '4.5rem', isolation: 'isolate', background: 'var(--color-bg)'`
    : `position: 'relative', minHeight: '100vh', isolation: 'isolate', background: 'var(--color-bg)'`;

  const appContent = `${allImports}

export default function App() {
  return (
    <div style={{ ${wrapperStyle} }}>
${fixedLayers ? `      {/* Fixed ambient layers */}\n${fixedLayers}\n` : ''}${navLayers ? `      {/* Navigation */}\n${navLayers}\n` : ''}
      {/* Page sections */}
      <div style={{ position: 'relative', zIndex: 40 }}>
${sections.join('\n')}
      </div>
    </div>
  );
}
`;

  await fs.writeFile(path.join(targetDir, 'src', 'App.tsx'), appContent, 'utf-8');
}

/**
 * Builds nav JSX with items derived from the actual pages, not hardcoded placeholders.
 * Falls back to the static component-mapper JSX for unknown nav types.
 */
function buildNavJsxForPages(navName, pages) {
  const items = pages.map((p, i) => ({
    label: p.pageName,
    href:  i === 0 ? '/' : p.path,
  }));

  switch (navName) {
    case 'StaggeredMenu': {
      const itemsStr = items
        .map(it => `      { label: '${it.label}', ariaLabel: 'Go to ${it.label.toLowerCase()}', link: '${it.href}' }`)
        .join(',\n');
      return `<div style={{ position: 'fixed', top: 0, right: 0, zIndex: 999, pointerEvents: 'auto' }}>
  <StaggeredMenu
    position="right"
    items={[\n${itemsStr}\n    ]}
    displayItemNumbering={true}
  />
</div>`;
    }
    case 'GooeyNav': {
      const itemsStr = items
        .map(it => `      { label: '${it.label}', href: '${it.href}' }`)
        .join(',\n');
      return `<nav style={{ position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <GooeyNav
    items={[\n${itemsStr}\n    ]}
    particleCount={12}
    particleDistances={[80, 10]}
    particleR={80}
    initialActiveIndex={0}
    animationTime={400}
    timeVariance={200}
    colors={[1, 2, 3, 1, 2, 3, 1, 4]}
  />
</nav>`;
    }
    case 'CardNav': {
      const itemsStr = items
        .map((it, idx) => {
          const bg = ['#0D0716', '#170D27', '#0D1A27'][idx % 3];
          return `      { label: '${it.label}', bgColor: '${bg}', textColor: '#fff', links: [{ label: '${it.label}', href: '${it.href}', ariaLabel: 'Go to ${it.label}' }] }`;
        })
        .join(',\n');
      return `<div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, pointerEvents: 'auto' }}>
  <CardNav
    logo="${DEFAULT_LOGO_DATA_URI}"
    logoAlt="Site logo"
    items={[\n${itemsStr}\n    ]}
  />
</div>`;
    }
    case 'Dock': {
      const labels = ['⌂', '☰', '✦', '◈', '⊕'];
      const itemsStr = items
        .map((it, i) => `      { icon: <span style={{ fontSize: '1.1rem' }}>${labels[i] || '•'}</span>, label: '${it.label}', onClick: () => window.location.href='${it.href}' }`)
        .join(',\n');
      return `<div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <Dock
    items={[\n${itemsStr}\n    ]}
    panelHeight={68}
    baseItemSize={50}
    magnification={70}
  />
</div>`;
    }
    case 'PillNav': {
      const itemsStr = items
        .map(it => `      { label: '${it.label}', href: '${it.href}' }`)
        .join(',\n');
      return `<nav style={{ position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <PillNav
    logo="${DEFAULT_LOGO_DATA_URI}"
    logoAlt="Site logo"
    items={[\n${itemsStr}\n    ]}
  />
</nav>`;
    }
    case 'FlowingMenu': {
      const itemsStr = items
        .map(it => `      { link: '${it.href}', text: '${it.label}', image: '/joker-square.jpg' }`)
        .join(',\n');
      return `<div style={{ position: 'relative', width: '100%', height: '160px', zIndex: 999, pointerEvents: 'auto', overflow: 'hidden', borderBottom: '1px solid var(--color-border)' }}>
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <FlowingMenu
      items={[\n${itemsStr}\n      ]}
    />
  </div>
</div>`;
    }
    default: {
      // Unknown nav types: fall back to component-mapper static JSX
      return getComponent(navName).jsx;
    }
  }
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
    const pointerEvents = 'none';
    const layerZ = c.isCursor ? 9999 : c.zIndex;
    return `        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: ${layerZ}, pointerEvents: '${pointerEvents}', transform: 'translateZ(0)' }}>
          ${data.jsx}
        </div>`;
  }).join('\n');

  // Nav layer JSX — fixed overlays with links matching the actual pages
  const navLayers = navs.map(c => {
    const jsx = buildNavJsxForPages(c.name, uniquePages);
    return `        ${jsx}`;
  }).join('\n');

  const fixedImports = fixed
    .filter(c => c.name && c.category)
    .map(c => getComponent(c.name).importLine)
    .join('\n');

  const navImports = navs
    .filter(c => c.name && c.category)
    .map(c => getComponent(c.name).importLine)
    .join('\n');

  // When no nav component is selected, auto-generate a NavLink-based navbar with active state.
  // Without this, multi-page sites have routes but no way to navigate between them.
  const needsAutoNav = !hasNav && uniquePages.length > 1;
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
    ? `position: 'relative', minHeight: '100vh', paddingTop: '3.5rem', isolation: 'isolate', background: 'var(--color-bg)'`
    : `position: 'relative', minHeight: '100vh', isolation: 'isolate', background: 'var(--color-bg)'`;

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
        <div style={{ position: 'relative', zIndex: 40 }}>
        <Routes>
${routeElements}
        </Routes>
        </div>
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
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const generatedAt = now.toISOString();
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
  const totalComponents = selectedComponents.length;
  const categoryStats = Object.entries(byCategory)
    .map(([cat, names]) => `| ${cat} | ${names.length} |`)
    .join('\n') || '| None | 0 |';
  const componentSection = Object.entries(byCategory)
    .map(([cat, names]) => `### ${cat}\n${names.map(n => `- ${n}`).join('\n')}`)
    .join('\n\n');

  // Colors
  const colors = (designRules.colors || []);
  const colorRows = colors.length > 0
    ? colors.map(c => {
      const hex = c.value || c.hex || '—';
      const swatch = hex && hex.startsWith('#')
        ? `<span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:${hex};border:1px solid rgba(255,255,255,.25);vertical-align:middle;"></span>`
        : '—';
      return `| ${c.role || 'auto'} | ${hex} | ${swatch} |`;
    }).join('\n')
    : '| auto | — | — |';

  // Fonts
  const fonts = (designRules.fonts || []);
  const fontLines = fonts.length > 0
    ? fonts.map(f => `- **${f.role || 'auto'}**: ${f.family || f.value}${f.weight ? ` (weight: ${f.weight})` : ''}`).join('\n')
    : '- Default system font';

  // Layout / sizes
  const sizes = designRules.sizes || {};
  const optimTarget = sizes.optimizationTarget || 'adaptive';
  const spacing = sizes.spacingScale || '—';
  const radius = sizes.borderRadius || '—';

  // Pages
  const pagesSection = Array.isArray(pages) && pages.length > 0
    ? pages.map((p, i) => `| ${i + 1} | ${p.title || p.name || `Page ${i + 1}`} | ${p.type || 'custom'} | \`${pageTypeToRoute(p.type || 'custom', p.title || p.name || `Page ${i + 1}`)}\` |`).join('\n')
    : '| 1 | Home | home | `/` |';

  const lines = [
    `# Project Brief: ${brand}`,
    ``,
    `> Generated by BitForge`,
    `> Date: ${date}`,
    `> Timestamp: ${generatedAt}${presetName ? `\n> Preset: ${presetName}` : ''}`,
    ``,
    `---`,
    ``,
    `## Snapshot`,
    ``,
    `| Key | Value |`,
    `| --- | --- |`,
    `| Project | ${brand} |`,
    `| Tagline | ${clientBrief.tagline || '—'} |`,
    `| Site Type | ${siteType} |`,
    `| Aesthetic | ${aesthetic} |`,
    `| Color Strategy | ${styleDirection.colorStrategy || '—'} |`,
    `| Industry | ${clientBrief.industry || '—'} |`,
    `| Call to Action | ${clientBrief.callToAction || '—'} |`,
    `| Total Components | ${totalComponents} |`,
    `| Total Pages | ${Array.isArray(pages) ? pages.length : 1} |`,
    ``,
    `---`,
    ``,
    `## Brand Narrative`,
    ``,
    clientBrief.description
      ? `> ${clientBrief.description.replace(/\n/g, '\n> ')}`
      : '> (no description provided)',
    ``,
    clientBrief.targetAudience ? `**Target Audience:** ${clientBrief.targetAudience}` : '',
    clientBrief.usp            ? `**Unique Value:** ${clientBrief.usp}` : '',
    clientBrief.tone           ? `**Tone:** ${clientBrief.tone}` : '',
    clientBrief.personality    ? `**Personality:** ${clientBrief.personality}` : '',
    ``,
    `---`,
    ``,
    `## Style Direction`,
    ``,
    `| Setting | Value |`,
    `| --- | --- |`,
    `| Aesthetics | ${(styleDirection.aesthetics || []).join(', ') || '—'} |`,
    `| Typography Intensity | ${styleDirection.typographyIntensity || '—'} |`,
    `| Visual Effects | ${(styleDirection.visualEffects || []).join(', ') || '—'} |`,
    `| Audience Hint | ${styleDirection.audience || '—'} |`,
    ``,
    `---`,
    ``,
    `## Design System`,
    ``,
    `### Colors`,
    ``,
    `| Role | Value | Swatch |`,
    `| --- | --- | --- |`,
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
    radius !== '—' ? `- Border Radius: **${radius}**` : '',
    ``,
    `---`,
    ``,
    `## Component Inventory`,
    ``,
    `| Category | Count |`,
    `| --- | ---: |`,
    categoryStats,
    ``,
    componentSection || '- (none)',
    ``,
    `---`,
    ``,
    `## Page Map`,
    ``,
    `| # | Name | Type | Route |`,
    `| ---: | --- | --- | --- |`,
    pagesSection,
    ``,
    `---`,
    ``,
    `## Quick Start`,
    ``,
    `\`\`\`bash`,
    `npm install`,
    `npm run dev`,
    `\`\`\``,
    ``,
  ].filter(l => l !== undefined).join('\n');

  await fs.writeFile(path.join(targetDir, 'Brief.md'), lines, 'utf-8');
}

/**
 * Main export: buildApp(options)
 * Decides single vs multi-page and generates App.tsx (+ page files if multi-page).
 */
async function buildApp({ targetDir, selectedComponents, styleDirection, designRules, clientBrief, pages, presetName, resolvedPages = [] }) {
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
      resolvedPages,
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
