/**
 * style-builder.cjs
 * Generates tokens.css and globals.css from designRules + styleDirection.
 * Produces aesthetic-specific CSS that is always injected — never depends on AI.
 */

const { getContrastColor, getContrastRatio } = require('../../utils/colorContrast.cjs');

const AESTHETIC_GLOBALS = {
  minimal: `
/* ── Minimal aesthetic ─────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body {
  font-weight: 300;
  line-height: 1.85;
  letter-spacing: 0.01em;
  color: var(--color-text);
}
h1, h2, h3, h4 {
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-text);
}
p { color: var(--color-text); }
section {
  padding: 8rem 0;
  position: relative;
}
section > * { position: relative; z-index: 2; }
button, .btn {
  background: transparent;
  border: 1px solid var(--color-text);
  border-radius: 4px;
  padding: 0.6em 1.4em;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.3s ease;
}
button:hover { opacity: 0.6; }
`,

  editorial: `
/* ── Editorial aesthetic ────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body {
  font-weight: 300;
  line-height: 1.65;
  color: var(--color-text);
}
h1 {
  font-size: clamp(4rem, 12vw, 10rem);
  font-weight: 300;
  letter-spacing: -0.04em;
  line-height: 0.92;
}
h2 {
  font-size: clamp(2rem, 6vw, 5rem);
  letter-spacing: -0.03em;
  line-height: 0.95;
}
h3 { font-size: clamp(1.2rem, 3vw, 2rem); }
section {
  padding: 8rem 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative;
}
section > * { position: relative; z-index: 2; }
hr {
  border: none;
  border-top: 1px solid var(--color-text);
  margin: 4rem 0;
  opacity: 0.2;
}
button, .btn {
  border: 1px solid currentColor;
  background: transparent;
  padding: 0.6em 1.6em;
  cursor: pointer;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.2s ease;
}
`,

  brutalist: `
/* ── Brutalist aesthetic ────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
}
body {
  font-weight: 400;
  line-height: 1.4;
}
h1, h2, h3 {
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.95;
  text-transform: uppercase;
}
h1 { font-size: clamp(3rem, 10vw, 9rem); }
h2 { font-size: clamp(2rem, 6vw, 5rem); }
section {
  padding: 5rem 0;
  border-top: 3px solid var(--color-text);
  position: relative;
}
section > * { position: relative; z-index: 2; }
button, .btn {
  background: var(--color-text);
  color: var(--color-bg);
  border: 2px solid var(--color-text);
  padding: 0.7em 1.8em;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: none;
}
button:hover {
  background: transparent;
  color: var(--color-text);
  transition: background 0.08s, color 0.08s;
}
`,

  futuristic: `
/* ── Futuristic aesthetic ───────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body {
  line-height: 1.6;
  font-weight: 400;
  background: var(--color-bg);
  color: var(--color-text);
}
h1, h2 {
  text-shadow: 0 0 30px var(--color-accent);
  letter-spacing: 0.05em;
  color: var(--color-text);
}
h1 {
  font-size: clamp(2.5rem, 8vw, 7rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
h2 { font-size: clamp(1.8rem, 5vw, 4rem); text-transform: uppercase; }
p { color: var(--color-text); opacity: 0.8; }
small, .label, .tag {
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.7rem;
  color: var(--color-accent);
}
section {
  padding: 6rem 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  position: relative;
}
/* Ensure text is readable on top of animated backgrounds */
section > * { position: relative; z-index: 2; }
button, .btn {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 0.7em 2em;
  cursor: pointer;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  box-shadow: 0 0 12px rgba(0,245,255,0.15);
}
button:hover {
  background: var(--color-accent);
  color: var(--color-bg);
  box-shadow: 0 0 24px rgba(0,245,255,0.4);
}
`,
};

const AESTHETIC_TOKEN_DEFAULTS = {
  minimal: {
    bg: '#fafafa',
    text: '#111111',
    primary: '#111111',
    secondary: '#666666',
    accent: '#111111',
    border: 'rgba(0,0,0,0.1)',
    surface: 'rgba(0,0,0,0.03)',
  },
  editorial: {
    bg: '#f5f3ee',
    text: '#1a1a1a',
    primary: '#1a1a1a',
    secondary: '#555555',
    accent: '#c8392b',
    border: 'rgba(0,0,0,0.12)',
    surface: 'rgba(0,0,0,0.02)',
  },
  brutalist: {
    bg: '#ffffff',
    text: '#000000',
    primary: '#000000',
    secondary: '#333333',
    accent: '#ff2200',
    border: '#000000',
    surface: '#f0f0f0',
  },
  futuristic: {
    bg: '#050508',
    text: '#e0e8ff',
    primary: '#00f5ff',
    secondary: '#6366f1',
    accent: '#00f5ff',
    border: 'rgba(255,255,255,0.1)',
    surface: 'rgba(255,255,255,0.03)',
  },
};

const RESPONSIVE_CSS = {
  mobile: `
@media (min-width: 768px) { body { font-size: 16px; } }
`,
  desktop: `
@media (max-width: 1023px) {
  .desktop-only { display: none !important; }
}
`,
  adaptive: `
@media (max-width: 767px) {
  h1 { font-size: clamp(2rem, 8vw, 4rem) !important; }
  section { padding: 4rem 0 !important; }
  .grid-cols-3 { grid-template-columns: 1fr !important; }
  .grid-cols-2 { grid-template-columns: 1fr !important; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .grid-cols-3 { grid-template-columns: 1fr 1fr !important; }
}
`,
  tablet: `
@media (max-width: 767px) {
  h1 { font-size: clamp(2rem, 8vw, 3.5rem) !important; }
}
@media (min-width: 1025px) {
  section { padding: 8rem 0; }
}
`,
};

/**
 * Resolves a color value from designRules.colors by role.
 */
function resolveColor(colors, role) {
  if (!Array.isArray(colors)) return null;
  const entry = colors.find(c => c.role === role);
  return entry && entry.value ? entry.value.trim() : null;
}

/**
 * Resolves a font value from designRules.fonts by role.
 */
function resolveFont(fonts, role) {
  if (!Array.isArray(fonts)) return null;
  const entry = fonts.find(f => f.role === role);
  return entry && entry.value ? entry.value.trim() : null;
}

/**
 * buildTokensCSS(designRules, styleDirection)
 * Returns CSS string for :root tokens + body base styles.
 */
function buildTokensCSS(designRules, styleDirection) {
  const aesthetic = ((styleDirection && styleDirection.aesthetics && styleDirection.aesthetics[0]) || 'minimal').toLowerCase();
  const defaults = AESTHETIC_TOKEN_DEFAULTS[aesthetic] || AESTHETIC_TOKEN_DEFAULTS.minimal;

  const colors = (designRules && designRules.colors) || [];
  const fonts = (designRules && designRules.fonts) || [];

  const bg      = resolveColor(colors, 'background') || defaults.bg;
  let   text    = resolveColor(colors, 'text')       || defaults.text;
  const accent  = resolveColor(colors, 'accent')     || defaults.accent;
  const primary = resolveColor(colors, 'components') || defaults.primary;
  const surfaceResolved = resolveColor(colors, 'surface') || defaults.surface;

  // Ensure text is readable against the background (WCAG AA body-text target ~4.5:1)
  try {
    if (getContrastRatio(bg, text) < 4.5) {
      text = getContrastColor(bg);
    }
  } catch { /* non-hex colors (rgba, var()) — skip check */ }

  // Body copy on tinted cards (--color-surface) must not collapse into the surface tint
  let textOnSurface = text;
  try {
    if (getContrastRatio(surfaceResolved, text) < 4.5) {
      textOnSurface = getContrastColor(surfaceResolved);
    }
  } catch {
    textOnSurface = text;
  }

  const headingFont = resolveFont(fonts, 'heading');
  const bodyFont    = resolveFont(fonts, 'body');
  const accentFont  = resolveFont(fonts, 'accent');

  const fontLines = [
    headingFont ? `  --font-heading: '${headingFont}', sans-serif;` : "  --font-heading: 'Inter', sans-serif;",
    bodyFont    ? `  --font-body: '${bodyFont}', sans-serif;`       : "  --font-body: 'Inter', sans-serif;",
    accentFont  ? `  --font-accent: '${accentFont}', monospace;`    : '  --font-accent: monospace;',
  ].join('\n');

  return `@import "tailwindcss";

:root {
  --color-bg: ${bg};
  --color-text: ${text};
  --color-primary: ${primary};
  --color-secondary: ${defaults.secondary};
  --color-accent: ${accent};
  --color-border: ${defaults.border};
  --color-surface: ${surfaceResolved};
  --color-text-on-surface: ${textOnSurface};
  --max-width: 1280px;
${fontLines}
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  min-height: 100vh;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  margin: 0;
}

* { box-sizing: border-box; }
`;
}

/**
 * buildGlobalsCSS(aesthetic, optimizationTarget, scrollbarStyle)
 * Returns aesthetic-specific global overrides + responsive rules + scrollbar.
 */
function buildGlobalsCSS(aesthetic, optimizationTarget, scrollbarStyle) {
  const key = (aesthetic || 'minimal').toLowerCase();
  const aestheticCSS = AESTHETIC_GLOBALS[key] || AESTHETIC_GLOBALS.minimal;
  const responsiveCSS = RESPONSIVE_CSS[optimizationTarget] || RESPONSIVE_CSS.adaptive;

  let scrollBehaviorCSS = '';
  if (scrollbarStyle && scrollbarStyle.scrollBehavior === 'smooth') {
    scrollBehaviorCSS = `\nhtml { scroll-behavior: smooth; }`;
  }

  let scrollbarCSS = '';
  if (scrollbarStyle && scrollbarStyle.mode !== 'default') {
    if (scrollbarStyle.mode === 'hidden') {
      scrollbarCSS = `\n* { scrollbar-width: none; }\n*::-webkit-scrollbar { display: none; }`;
    } else {
      const track = scrollbarStyle.track || 'transparent';
      const thumb = scrollbarStyle.thumb || '#555';
      scrollbarCSS = `\n*::-webkit-scrollbar { width: 6px; height: 6px; }\n*::-webkit-scrollbar-track { background: ${track}; }\n*::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 3px; }\n* { scrollbar-width: thin; scrollbar-color: ${thumb} ${track}; }`;
    }
  }

  const layeringCSS = `
/* Keep document content above global fixed backgrounds */
#root, main, section, footer {
  position: relative;
  z-index: 10;
}

/* Improve readability on animated/detailed backgrounds */
main section {
  isolation: isolate;
}

main section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-bg) 84%, transparent);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

main section > * {
  position: relative;
  z-index: 1;
}
`;

  return `/* Generated by BitForge — do not edit directly */\n${aestheticCSS}\n${layeringCSS}\n${responsiveCSS}\n${scrollBehaviorCSS}\n${scrollbarCSS}`;
}

/**
 * buildGoogleFontsLink(fonts)
 * Returns an HTML <link> tag for Google Fonts given the fonts array from designRules.
 */
function buildGoogleFontsLink(fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) return '';
  const families = fonts
    .map(f => f.value && f.value.trim())
    .filter(Boolean)
    .filter(f => !f.match(/^(serif|sans-serif|monospace|system-ui|inherit|initial)$/i))
    .map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800;900`)
    .join('&');
  if (!families) return '';
  return `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet">`;
}

/**
 * buildResponsiveCSS(optimizationTarget)
 * Returns responsive CSS media queries for the given device target.
 * Standalone export for use by page-builder and other modules.
 */
function buildResponsiveCSS(optimizationTarget) {
  return RESPONSIVE_CSS[optimizationTarget] || RESPONSIVE_CSS.adaptive;
}

module.exports = { buildTokensCSS, buildGlobalsCSS, buildGoogleFontsLink, buildResponsiveCSS };
