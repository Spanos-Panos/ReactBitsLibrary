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

// ── App.tsx structural scaffold builder ──────────────────────────────────────
function buildAppScaffold(selectedComponents, layoutConfig) {
  const lc = layoutConfig || [];
  const allComponents = (selectedComponents || []).filter(c => c.name && c.category);

  const hHint = { fullscreen: '100vh', large: '85vh', medium: '50vh', strip: '20vh' };
  const ANIM_MOTION = {
    'fade-in':  { init: '{ opacity: 0 }',                              view: '{ opacity: 1 }',                          dur: '0.6' },
    'slide-up': { init: '{ y: 40, opacity: 0 }',                       view: '{ y: 0, opacity: 1 }',                    dur: '0.7' },
    'scale-up': { init: '{ scale: 0.95, opacity: 0 }',                 view: '{ scale: 1, opacity: 1 }',                dur: '0.6' },
    'blur-in':  { init: "{ filter: 'blur(8px)', opacity: 0 }",         view: "{ filter: 'blur(0px)', opacity: 1 }",     dur: '0.7' },
  };
  const CURSOR_NAMES = ['BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor'];

  let fixed = [];
  let inFlow = [];

  if (lc.length > 0) {
    fixed = lc.filter(i => i.position === 'fixed');
    inFlow = lc.filter(i => i.position === 'in-flow');
  } else {
    for (const c of allComponents) {
      if (c.category === 'Backgrounds') {
        fixed.push({ componentName: c.name, zLayer: 'background', entranceAnimation: 'none' });
      } else if (CURSOR_NAMES.includes(c.name)) {
        fixed.push({ componentName: c.name, zLayer: 'overlay', entranceAnimation: 'none' });
      } else {
        inFlow.push({ componentName: c.name, heightHint: 'fullscreen', entranceAnimation: 'none' });
      }
    }
  }

  const hasMotion = inFlow.some(i => i.entranceAnimation && i.entranceAnimation !== 'none' && ANIM_MOTION[i.entranceAnimation]);
  const motionImport = hasMotion ? "import { motion } from 'framer-motion';\n" : '';

  const imports = allComponents
    .map(c => `import ${c.name} from './components/${c.category}/${c.name}/${c.name}'; // ← DO NOT REMOVE`)
    .join('\n');

  const fixedLines = fixed.map(item => {
    const zIdx = item.zLayer === 'overlay' ? 9999 : 0;
    return `      <${item.componentName} style={{ position: 'fixed', inset: 0, zIndex: ${zIdx}, pointerEvents: 'none' }} />`;
  }).join('\n');

  const sectionLines = [];
  inFlow.forEach((item, idx) => {
    const minH = hHint[item.heightHint] || '50vh';
    const anim = ANIM_MOTION[item.entranceAnimation];
    const styleVal = `{{ width: '100%', minHeight: '${minH}', position: 'relative', zIndex: 1 }}`;

    sectionLines.push(`      {/* SECTION ${idx + 1} — ${item.componentName} */}`);
    if (anim) {
      sectionLines.push(`      <motion.section`);
      sectionLines.push(`        style=${styleVal}`);
      sectionLines.push(`        initial={${anim.init}}`);
      sectionLines.push(`        whileInView={${anim.view}}`);
      sectionLines.push(`        transition={{ duration: ${anim.dur}, ease: [0.16, 1, 0.3, 1] }}`);
      sectionLines.push(`        viewport={{ once: true }}`);
      sectionLines.push(`      >`);
      sectionLines.push(`        {/* FILL: render <${item.componentName} /> with correct props here, plus surrounding content */}`);
      sectionLines.push(`      </motion.section>`);
    } else {
      sectionLines.push(`      <section style=${styleVal}>`);
      sectionLines.push(`        {/* FILL: render <${item.componentName} /> with correct props here, plus surrounding content */}`);
      sectionLines.push(`      </section>`);
    }
  });

  const fixedPart = fixedLines ? `\n      {/* ── Fixed / ambient layers — DO NOT MOVE outside this div ── */}\n${fixedLines}\n` : '';
  const sectionsPart = sectionLines.length > 0 ? `\n      {/* ── Content sections — DO NOT REORDER ── */}\n${sectionLines.join('\n')}` : '';

  return `${motionImport}${imports}\n\nexport default function App() {\n  return (\n    <div style={{ position: 'relative', minHeight: '100vh' }}>${fixedPart}${sectionsPart}\n    </div>\n  );\n}\n`;
}

// ── Layout spec builder ───────────────────────────────────────────────────────
function buildPageLayoutSpec(enhancedPrompt, layoutConfig, ambientNames, cursorNames) {
  const hHint = { fullscreen: '100vh', large: '85vh', medium: '50vh', strip: '20vh' };
  const ANIM_MOTION = {
    'fade-in':  { init: '{ opacity: 0 }',                        view: '{ opacity: 1 }',                        dur: '0.6' },
    'slide-up': { init: '{ y: 40, opacity: 0 }',                 view: '{ y: 0, opacity: 1 }',                  dur: '0.7' },
    'scale-up': { init: '{ scale: 0.95, opacity: 0 }',           view: '{ scale: 1, opacity: 1 }',              dur: '0.6' },
    'blur-in':  { init: "{ filter: 'blur(8px)', opacity: 0 }",   view: "{ filter: 'blur(0px)', opacity: 1 }",   dur: '0.7' },
  };

  const lc = layoutConfig || [];
  const fixed  = lc.filter(i => i.position === 'fixed');
  const inFlow = lc.filter(i => i.position === 'in-flow');

  // Cross-reference with enhancedPrompt sections for any extra context
  const sections = enhancedPrompt?.siteArchitecture?.sections || [];

  const lines = ['# PAGE LAYOUT SPECIFICATION', ''];
  lines.push('Build the page in this exact section order. Heights, z-indices, and positions are fixed constraints. Visual styling, content, and spacing are yours to decide.');
  lines.push('');

  // Fixed layers
  if (fixed.length > 0 || ambientNames.length > 0) {
    lines.push('## Fixed Layers (render at App root, OUTSIDE all `<section>` elements):');
    lines.push('```tsx');
    const renderedFixed = new Set();
    for (const item of fixed) {
      lines.push(`<${item.componentName} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />`);
      renderedFixed.add(item.componentName);
    }
    for (const name of ambientNames) {
      if (!renderedFixed.has(name)) {
        lines.push(`<${name} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />`);
      }
    }
    for (const name of cursorNames) {
      lines.push(`<${name} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />`);
    }
    lines.push('```');
    lines.push('');
  }

  // Content sections table
  if (inFlow.length > 0) {
    lines.push('## Content Sections (top → bottom):');
    lines.push('| # | Component | Min-Height | Width | Align | Notes |');
    lines.push('|---|-----------|------------|-------|-------|-------|');
    inFlow.forEach((item, idx) => {
      const height = hHint[item.heightHint] || '50vh';
      const width  = item.widthHint === 'half' ? '50%' : item.widthHint === 'third' ? '33%' : '100%';
      const align  = item.xAlign === 'center' ? 'center' : item.xAlign === 'right' ? 'right' : 'left';
      // Find matching section in enhancedPrompt for any role notes
      const matchedSection = sections.find(s => (s.componentRef || '').toLowerCase().includes(item.componentName.toLowerCase()));
      const notes = matchedSection?.content?.headline ? `headline: "${matchedSection.content.headline}"` : '';
      lines.push(`| ${idx + 1} | ${item.componentName} | ${height} | ${width} | ${align} | ${notes} |`);
    });
    lines.push('');

    // Entrance animations
    const animated = inFlow.filter(i => i.entranceAnimation && i.entranceAnimation !== 'none' && ANIM_MOTION[i.entranceAnimation]);
    if (animated.length > 0) {
      lines.push('## Entrance Animations (Framer Motion `whileInView`):');
      lines.push('Wrap each listed section\'s root element with the corresponding motion wrapper:');
      lines.push('```tsx');
      animated.forEach(item => {
        const m = ANIM_MOTION[item.entranceAnimation];
        lines.push(`// ${item.componentName} — ${item.entranceAnimation}`);
        lines.push(`<motion.section initial={${m.init}} whileInView={${m.view}}`);
        lines.push(`  transition={{ duration: ${m.dur}, ease: [0.16, 1, 0.3, 1] }} viewport={{ once: true }}>`);
        lines.push('');
      });
      lines.push('```');
      lines.push('');
    }

    // Multi-column hint
    const multiCol = inFlow.filter(i => i.widthHint === 'half' || i.widthHint === 'third');
    if (multiCol.length >= 2) {
      lines.push('## Multi-Column Layout:');
      lines.push(`Components ${multiCol.map(i => `**${i.componentName}**`).join(' and ')} are configured for partial width — place them side-by-side in a flex or CSS grid row.`);
      lines.push('');
    }
  }

  // Generic structural rules (always included)
  lines.push('## Section Structure Pattern:');
  lines.push('Use this for every in-flow content section:');
  lines.push('```tsx');
  lines.push('<section style={{ width: \'100%\', padding: \'8rem 0\', position: \'relative\', zIndex: 1 }}>');
  lines.push('  <div style={{ maxWidth: \'var(--max-width, 1280px)\', margin: \'0 auto\', padding: \'0 clamp(1.5rem, 5vw, 5rem)\' }}>');
  lines.push('    {/* content */}');
  lines.push('  </div>');
  lines.push('</section>');
  lines.push('```');
  lines.push('NEVER apply `max-width` to the outer `<section>` — only to the inner wrapper `<div>`. ALL content sections MUST have `position: relative; zIndex: 1` to stack above fixed backgrounds.');
  lines.push('');
  lines.push('**Layout variety rules:**');
  lines.push('- NEVER create three equal-width cards in a single row — use 2-col asymmetric or full-width alternating layout');
  lines.push('- Hero sections must be at minimum 85vh tall');
  lines.push('- Alternate section backgrounds using `var(--color-primary)` or `var(--color-accent)` for 1–2 non-hero sections');
  lines.push('- Left-align body text in most sections — centered text for heroes and short CTAs only');
  lines.push('- Do NOT wrap full-viewport components in fixed-height containers');

  return lines.join('\n');
}

// ── Style enforcement rules (all 8 aesthetics) ───────────────────────────────
const STYLE_RULES = {
  brutalist: [
    'Borders: 2–4px solid (--color-text or --color-primary) ONLY — no border-radius ever (set border-radius: 0 everywhere)',
    'Typography: font-weight 800–900, large sizes, ALL flush-left (no text-align: center on headings)',
    'Layout: NO centering. All content grid-aligned or flush left. No max-width centering on text — use full grid columns.',
    'Colors: maximum 2 colors only (background + 1 accent). Pure contrast.',
    'Transitions: NONE except on buttons (:hover only, < 0.1s)',
    'Sections separated by thick borders (3px solid), NOT whitespace or cards',
    'Buttons: uppercase, no border-radius, solid colored background',
  ],
  editorial: [
    'Typography: h1 clamp(5rem, 12vw, 11rem), font-weight 300, tight line-height 0.9–1.0',
    'Layout: asymmetric — large left margin (min 8vw), content never fully centered',
    'Large oversized numbers for section indexes (display: block, font-size: clamp(6rem, 15vw, 14rem))',
    'Long horizontal rules (<hr>) between sections',
    'Text columns: max 60ch for body, left-aligned',
    'Images: full-bleed or harsh crop, no rounded corners',
    'Lots of negative space — sections can be almost empty',
  ],
  futuristic: [
    'Typography: text-shadow on headings (0 0 20px currentColor). Uppercase labels with wide letter-spacing (0.15em+)',
    'Borders: 1px solid with glow — box-shadow: 0 0 8px var(--color-primary)',
    'Background: dark (#050508). Text: near-white or neon accent',
    'Scanline/grid texture via CSS repeating-linear-gradient background',
    'Transitions: 0.4s ease-out. Hover effects on all interactive elements.',
    'HUD-style labels: small, monospace, uppercase',
    'Use CSS clip-path for geometric shapes instead of border-radius',
  ],
  minimal: [
    'Font-weight: 300–400 only. No bold except for single hero word.',
    'Monochrome palette: 2 colors max (off-white + near-black). No color accents.',
    'Single column layout. Generous line-height (1.8+). Max-width 640px for body text.',
    'No decorative elements: no borders, no shadows, no gradients.',
    'Lots of whitespace — section padding: 8rem+ top/bottom',
    'Buttons: text-only with underline or minimal border',
    'No transitions except opacity fade (0.3s)',
  ],
  organic: [
    'Border-radius: generous (24px–48px or 50% on cards)',
    'Colors: warm, earthy (terracotta, sage, sand, cream). No pure black — use #1a1208 max.',
    'Typography: serif or humanist sans. Mixed weights.',
    'Irregular grid — columns of different widths, staggered cards',
    'Soft shadows (box-shadow: 0 8px 40px rgba(0,0,0,0.08))',
    'Blob or soft shape separators between sections (SVG or border-radius tricks)',
    'Transitions: slow, ease (0.6s+). Gentle hover lifts.',
  ],
  playful: [
    'Colors: bright, saturated (use all 5 CSS variables in rotation)',
    'Border-radius: extreme (full pill on buttons: border-radius: 999px)',
    'Typography: mixed weights within headings. Some rotated text (transform: rotate(-3deg))',
    'Bold section backgrounds: alternate bg color every section',
    'Hover effects: scale(1.05)+ bounce (spring easing)',
    'Borders: 2px solid in accent colors, mixed radii',
  ],
  luxury: [
    'Colors: near-black (#0a0a0a) + gold (#C9A96E) or platinum (#E8E4DC). Never more than 3 colors.',
    'Typography: thin weight (100–200) at large sizes. Wide letter-spacing (0.2em+) on headings.',
    'Images: always full-bleed, high contrast. No rounded corners.',
    'Spacing: extreme. Section padding: min 12rem top/bottom.',
    'Borders: only 1px hairlines. No box-shadows except 0 1px 0 rgba(255,255,255,0.1).',
    'Transitions: very slow (0.8s–1.2s), ease-in-out. No bouncing.',
    'NO busy patterns, gradients, or texture. Silence is the design.',
  ],
  corporate: [
    'Colors: professional — primary blue (#1d4ed8 range) + neutrals. Max 3 colors.',
    'Typography: font-weight 500–700. Clean sans-serif. Left-aligned body text.',
    'Layout: structured grid, consistent column spacing',
    'Sections: clearly delineated with subtle background shifts or thin borders',
    'Buttons: filled primary + ghost secondary. border-radius: 6–8px.',
    'Trust signals: icons, badges, lists — structure over decoration',
    'Transitions: subtle, 0.2s. Professional, no flashy animations.',
  ],
};

function buildStyleEnforcementBlock(aesthetics) {
  const active = (aesthetics || []).map(a => a.toLowerCase()).filter(a => STYLE_RULES[a]);
  if (!active.length) return '';
  const lines = ['## ❗ STYLE ENFORCEMENT RULES — MANDATORY, NOT SUGGESTIONS', ''];
  for (const style of active) {
    lines.push(`### ${style.charAt(0).toUpperCase() + style.slice(1)}`);
    for (const rule of STYLE_RULES[style]) lines.push(`- ${rule}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ── Layout personality (aesthetic → layout decisions) ─────────────────────────
const LAYOUT_PERSONALITY_MAP = {
  brutalist:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'dense',  gridStyle: 'raw' },
  editorial:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'airy',   gridStyle: 'asymmetric' },
  futuristic: { textAlign: 'center', heroAlign: 'center', sectionDensity: 'medium', gridStyle: 'geometric' },
  minimal:    { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'airy',   gridStyle: 'single-column' },
  organic:    { textAlign: 'left',   heroAlign: 'center', sectionDensity: 'medium', gridStyle: 'irregular' },
  playful:    { textAlign: 'center', heroAlign: 'center', sectionDensity: 'dense',  gridStyle: 'mixed' },
  luxury:     { textAlign: 'center', heroAlign: 'center', sectionDensity: 'sparse', gridStyle: 'single-column' },
  corporate:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'medium', gridStyle: 'structured' },
};

function buildLayoutPersonalityBlock(lp) {
  if (!lp) return '';
  const densityDesc = {
    airy:   'Generous whitespace. Section padding: min 8rem top/bottom. Sections breathe.',
    dense:  'Tight sections. Padding: 3–5rem top/bottom. Pack content close.',
    sparse: 'Extreme whitespace. Section padding: min 12rem top/bottom. Silence is design.',
    medium: 'Balanced. Section padding: 5–7rem top/bottom.',
  };
  const gridDesc = {
    asymmetric:      'Columns of unequal width. Never 50/50. Shift content off-center.',
    'single-column': 'Single centered column, max-width 800px for all body content.',
    raw:             'No max-width centering. Full-width flush blocks. No inner padding.',
    geometric:       'Grid-based with sharp edges. Use clip-path for shape variety.',
    irregular:       'Staggered cards, varying column widths per section.',
    mixed:           'Mix grid and full-bleed freely. No consistent column count.',
    structured:      'Consistent 12-column grid, uniform gutters.',
  };
  return [
    '## LAYOUT PERSONALITY — FOLLOW EXACTLY',
    '',
    `- **Default text-align:** \`${lp.textAlign}\` on ALL sections unless overridden`,
    `- **Hero alignment:** Content in the first section is ${lp.heroAlign === 'center' ? 'centered' : 'flush-left'}`,
    `- **Section density:** ${densityDesc[lp.sectionDensity] || ''}`,
    `- **Grid style:** ${gridDesc[lp.gridStyle] || ''}`,
    '',
  ].join('\n');
}

// ── Style reference library (offline, curated) ────────────────────────────────
const STYLE_REFERENCES = {
  brutalist: [
    'Bloomberg Terminal aesthetic: dense info grid, monospace type, zero whitespace wasted',
    'Observed: border-top: 3px solid on every section break — the only decoration',
    'Observed: links as plain underlined text, no hover color change',
  ],
  editorial: [
    'NYT/Le Monde aesthetic: wide leading, columnar layout, huge headline + narrow body',
    'Observed: section numbers as huge decorative elements (opacity: 0.08, font-size: 20vw)',
    'Observed: pull quotes at 130% body size, left-bordered with 4px solid accent',
  ],
  luxury: [
    'LVMH/Bottega Veneta: maximum restraint, long pauses between elements',
    'Observed: heading letter-spacing: 0.3em, font-weight: 200, all uppercase',
    'Observed: product images at 70vw width, no caption, full silence around them',
  ],
  minimal: [
    'Muji/Dieter Rams aesthetic: function over decoration, every element earns its place',
    'Observed: single typeface, two weights only (300 + 600)',
    'Observed: sections separated only by vertical space, never borders or backgrounds',
  ],
  futuristic: [
    'Linear/Vercel aesthetic: dark base, sharp geometric shapes, data-dense HUD elements',
    'Observed: glow on primary CTA (box-shadow: 0 0 20px var(--color-primary))',
    'Observed: grid overlay texture at opacity: 0.04 on hero background',
  ],
  organic: [
    'Aesop/Kinfolk aesthetic: warm paper tones, editorial photography, generous margins',
    'Observed: blob-shaped image masks (border-radius: 60% 40% 55% 45%)',
    'Observed: section dividers as wavy SVG paths, never straight lines',
  ],
  playful: [
    'Duolingo/Figma aesthetic: bright color blocks, personality-driven micro-copy',
    'Observed: section backgrounds alternate between 4 distinct colors',
    'Observed: CTAs use pill shape with bounce hover animation',
  ],
  corporate: [
    'Stripe/Salesforce aesthetic: trust signals, clear hierarchy, professional restraint',
    'Observed: 3-column feature grid with icon + heading + 2-line description',
    'Observed: testimonials as full-width quote blocks with avatar + name + company',
  ],
};

function buildReferenceBlock(aesthetics) {
  const refs = (aesthetics || []).flatMap(a => STYLE_REFERENCES[a.toLowerCase()] || []);
  if (!refs.length) return '';
  return ['## REFERENCE PATTERNS (from award-winning sites)', '', ...refs.map(r => `- ${r}`), ''].join('\n');
}

// ── Scrollbar CSS ─────────────────────────────────────────────────────────────
function buildScrollbarCSS(scrollbarStyle) {
  if (!scrollbarStyle || scrollbarStyle.mode === 'default') return '';
  if (scrollbarStyle.mode === 'hidden') return `
* { scrollbar-width: none; }
*::-webkit-scrollbar { display: none; }`;
  const track = scrollbarStyle.track || 'transparent';
  const thumb = scrollbarStyle.thumb || '#555';
  return `
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: ${track}; }
*::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 3px; }
* { scrollbar-width: thin; scrollbar-color: ${thumb} ${track}; }`;
}

function validateGeneratedLayout({ appTsx, selectedComponents, layoutConfig }) {
  const issues = [];
  if (!appTsx || typeof appTsx !== 'string') {
    return { ok: false, issues: ['src/App.tsx could not be read for validation.'] };
  }

  if (appTsx.includes('/* FILL:')) {
    issues.push('App.tsx still contains scaffold placeholders (/* FILL */).');
  }

  const inFlowComponents = (selectedComponents || []).filter(c => {
    const lc = layoutConfig || [];
    if (lc.length > 0) {
      const entry = lc.find(i => i.componentName === c.name);
      return entry ? entry.position === 'in-flow' : true;
    }
    return c.category !== 'Backgrounds' && !['BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor'].includes(c.name);
  });

  const fixedComponents = (selectedComponents || []).filter(c => {
    const lc = layoutConfig || [];
    if (lc.length > 0) {
      const entry = lc.find(i => i.componentName === c.name);
      return entry ? entry.position === 'fixed' : c.category === 'Backgrounds';
    }
    return c.category === 'Backgrounds';
  });

  const missingInFlow = inFlowComponents
    .map(c => c.name)
    .filter(name => !appTsx.includes(`<${name}`));
  if (missingInFlow.length > 0) {
    issues.push(`Missing required in-flow components: ${missingInFlow.join(', ')}`);
  }

  const sectionCount = (appTsx.match(/<section|<motion\.section/g) || []).length;
  if (sectionCount < Math.max(1, inFlowComponents.length)) {
    issues.push(`Expected at least ${inFlowComponents.length} sections, found ${sectionCount}.`);
  }

  const minHeightCount = (appTsx.match(/minHeight:/g) || []).length;
  if (minHeightCount < Math.max(1, inFlowComponents.length)) {
    issues.push('Section minHeight constraints appear to be missing.');
  }

  for (const comp of fixedComponents) {
    const fixedRegex = new RegExp(`<${comp.name}[^>]*style=\\{\\{[^}]*position:\\s*'fixed'`, 'm');
    if (!fixedRegex.test(appTsx)) {
      issues.push(`Fixed layer missing or not fixed-positioned: ${comp.name}`);
    }
  }

  if (!/--color-primary|var\(--color-primary\)/.test(appTsx) && !/var\(--color-primary\)/.test(appTsx)) {
    issues.push('App.tsx appears not to use CSS token variables for key styling.');
  }

  return { ok: issues.length === 0, issues };
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
    !d.startsWith('@react-bits/') &&   // local components — never real npm packages
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
    const installCmd = packageManager === 'npm' ? 'install --no-audit --no-fund' : 'add';
    if (depList) await runCommand(`${packageManager} ${installCmd} ${depList}`, [], targetDir, log);
  }

  notify(`Installing all dependencies via ${packageManager}...`);
  const allInstallCmd = packageManager === 'npm' ? 'install --no-audit --no-fund' : 'install';
  await runCommand(`${packageManager} ${allInstallCmd}`, [], targetDir, log);

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
    // For AI builds, inject a structural scaffold — fixed layers placed, sections stubbed
    // with correct heights and entrance animations. Claude Code fills in props + content only.
    const appTsxPath = path.join(targetDir, 'src', 'App.tsx');
    const scaffoldApp = buildAppScaffold(selectedComponents, options.layoutConfig || null);
    await fs.writeFile(appTsxPath, scaffoldApp, 'utf-8');
  }

  notify(`Cleaning up boilerplate styles...`);
  const appCssPath = path.join(targetDir, 'src', 'App.css');
  const indexCssPath = path.join(targetDir, 'src', 'index.css');
  const indexHtmlPath = path.join(targetDir, 'index.html');

  await fs.writeFile(appCssPath, '/* Generated by ReactBits Explorer */\n', 'utf-8');
  const baseScrollbarCSS = buildScrollbarCSS(options.scrollbarStyle || null);
  await fs.writeFile(indexCssPath, `@import "tailwindcss";\n\nbody { margin: 0; background: #000; color: #fff; min-height: 100vh; overflow-x: hidden; }${baseScrollbarCSS}`, 'utf-8');

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

    // ── Build mandatory component usage checklist (hard FAIL format) ─────────
    const mandatoryComponents = allComponents.filter(c => c.name && c.category);
    const mandatoryChecklist = mandatoryComponents
      .map(c => {
        if (c.category === 'Backgrounds')
          return `[ ] ${c.name}  ← AMBIENT: <${c.name} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} /> at App root`;
        if (cursorNames.includes(c.name))
          return `[ ] ${c.name}  ← OVERLAY: <${c.name} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} /> at App root`;
        return `[ ] ${c.name}  ← must appear in JSX of at least one <section> in App.tsx`;
      })
      .join('\n');
    const mandatoryList = mandatoryChecklist;

    // ── Build CSS foundation from designTokens ────────────────────────────────
    const dt = enhancedPrompt?.designTokens || {};
    const dtColors = dt.colors || {};
    const dtTypo = dt.typography || {};
    const resolveFont = (v) => {
      if (!v) return '';
      if (typeof v === 'string') return v.split(',')[0].trim();
      if (typeof v === 'object') return (v.family || v.font || '').split(',')[0].trim();
      return '';
    };
    const headingFont = resolveFont(dtTypo.heading || dtTypo.headingFont);
    const bodyFont   = resolveFont(dtTypo.body    || dtTypo.bodyFont);
    const accentFont = resolveFont(dtTypo.accent  || dtTypo.accentFont);
    const maxWidthMatch = (enhancedPrompt?.technicalRequirements?.layoutStrategy || '').match(/(\d{3,4})px/);
    const maxWidthPx = maxWidthMatch ? maxWidthMatch[1] : '1280';
    // Detect aesthetic from mood string (enhancer sets projectMeta.mood)
    const mood = (enhancedPrompt?.projectMeta?.mood || '').toLowerCase();
    const isBrutalist = mood.includes('brutal') || dt.borderRadius === '0px' || dt.borderRadius === '0';
    const isEditorial = mood.includes('editorial');
    const isFuturistic = mood.includes('futuristic') || mood.includes('cyber') || mood.includes('neo');
    const isMinimal = mood.includes('minimal') || mood.includes('clean');
    const isOrganic = mood.includes('organic') || mood.includes('natural') || mood.includes('earthy');
    const isPlayful = mood.includes('playful') || mood.includes('fun') || mood.includes('vibrant');
    const isLuxury = mood.includes('luxury') || mood.includes('premium') || mood.includes('elegant');
    const isCorporate = mood.includes('corporate') || mood.includes('professional') || mood.includes('business');

    // Build aesthetics array for new style blocks
    const aesthetics = [];
    if (isBrutalist) aesthetics.push('brutalist');
    if (isEditorial) aesthetics.push('editorial');
    if (isFuturistic) aesthetics.push('futuristic');
    if (isMinimal) aesthetics.push('minimal');
    if (isOrganic) aesthetics.push('organic');
    if (isPlayful) aesthetics.push('playful');
    if (isLuxury) aesthetics.push('luxury');
    if (isCorporate) aesthetics.push('corporate');
    // Also check if enhancer added layoutPersonality (Issue 3A)
    const layoutPersonality = enhancedPrompt?.layoutPersonality
      || (aesthetics.length > 0 ? LAYOUT_PERSONALITY_MAP[aesthetics[0]] : null);

    // Build new CLAUDE.md blocks
    const styleEnforcementBlock = buildStyleEnforcementBlock(aesthetics);
    const layoutPersonalityBlock = buildLayoutPersonalityBlock(layoutPersonality);
    const referenceBlock = buildReferenceBlock(aesthetics);
    const scrollbarStyle = options.scrollbarStyle || null;
    const scrollbarCSS = buildScrollbarCSS(scrollbarStyle);

    const aestheticCSS = isBrutalist ? `
/* Brutalist overrides */
h1, h2, h3 { font-weight: 900; letter-spacing: -0.02em; }
section + section { border-top: 2px solid var(--color-text); }
button, [role="button"], a.btn { border: 2px solid currentColor; border-radius: 0; text-transform: uppercase; letter-spacing: 0.1em; }
small, .label, caption { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.7rem; }` : isEditorial ? `
/* Editorial overrides */
h1 { font-size: clamp(4rem, 12vw, 10rem); letter-spacing: -0.04em; line-height: 0.9; }
h2 { font-size: clamp(2rem, 6vw, 5rem); letter-spacing: -0.03em; }` : isFuturistic ? `
/* Futuristic overrides */
h1, h2 { text-shadow: 0 0 30px var(--color-accent); }
small, .label, code { font-family: var(--font-accent); text-transform: uppercase; letter-spacing: 0.15em; }` : isMinimal ? `
/* Minimal overrides */
h1, h2 { font-weight: 300; letter-spacing: 0.02em; }` : '';

    const cssFundamentals = `
# CSS FOUNDATION

Replace the **entire** content of \`src/index.css\` with the following (\`@import\` MUST be the first line — PostCSS will throw an error if anything precedes it):

\`\`\`css
@import "tailwindcss";

:root {
  --color-bg: ${dtColors.background || '#000'};
  --color-text: ${dtColors.text || '#fff'};
  --color-primary: ${dtColors.primary || '#fff'};
  --color-secondary: ${dtColors.secondary || '#888'};
  --color-accent: ${dtColors.accent || '#f00'};
  --max-width: ${maxWidthPx}px;${headingFont ? `\n  --font-heading: '${headingFont}', sans-serif;` : ''}${bodyFont ? `\n  --font-body: '${bodyFont}', sans-serif;` : ''}${accentFont ? `\n  --font-accent: '${accentFont}', monospace;` : ''}
}

body {
  background: var(--color-bg);
  color: var(--color-text);${bodyFont ? `\n  font-family: var(--font-body);` : ''}
}

h1, h2, h3 {${headingFont ? `\n  font-family: var(--font-heading);` : ''}
}
${isBrutalist ? '*, *::before, *::after { border-radius: 0 !important; }' : ''}${aestheticCSS}
\`\`\`

Do not add any rules before \`@import "tailwindcss"\` — it will break the build.`;

    // ── Build page layout spec from user's layout config ─────────────────────
    const layoutConfig = options.layoutConfig || null;
    const pageLayoutSpec = buildPageLayoutSpec(enhancedPrompt, layoutConfig, ambientNames, cursorNames);

    // ── Write CLAUDE.md (self-contained mission brief) ────────────────────────
    const claudeMdContent = `# MISSION

You are a senior React + TypeScript developer and UI designer. Build a complete, production-quality site.

- **Editable files**: \`src/App.tsx\`, \`src/index.css\`, \`index.html\` — do not create other source files
- **App.tsx is pre-scaffolded**: section structure, heights, z-indices, and entrance animations are already written. Fill in component props and content — do NOT restructure or reorder
- **Layout is locked**: section order, fixed-layer semantics, and min-heights are strict constraints
- **Stack**: Vite + React 18 (TypeScript) + Tailwind CSS v4
- **Stop condition**: when \`npx tsc --noEmit\` passes with zero errors, output the word **DONE** and stop

---

# AESTHETIC DIRECTION

You must produce something visually distinctive — not generic AI output. Before writing any code, commit to a clear aesthetic direction based on the project theme and mood in the design brief.

**Typography**
- Apply the fonts from \`designTokens.typography\` — load them from Google Fonts (add a \`<link>\` in \`index.html\`, apply via \`font-family\` in \`src/index.css\`)
- NEVER use Inter, Roboto, Arial, or system-ui as the primary typeface — these are generic defaults
- Heading font: \`h1\`, \`h2\`, \`h3\` elements ONLY
- Body font: all \`p\`, \`li\`, \`span\`, \`label\` elements — the dominant typeface (majority of the page)
- Accent font: labels, tags, code snippets, small captions ONLY (max 10–15% of text elements)
- **Never distribute 3 fonts at equal visual weight** — heading and body must dominate

**Color**
- Follow \`designTokens.colors\` exactly — use the primary, secondary, background, text, and accent values
- Use CSS variables in \`src/index.css\` (e.g. \`--color-primary: #...\`) so colors are consistent throughout

**Content — NO AI SLOP**
- Write copy that is specific to the project's actual theme and purpose
- NEVER use phrases like: "Unleash Your Creativity", "Cutting-Edge Solutions", "Transform Your Business", "Elevate Your Experience", "Revolutionary Platform", "Seamlessly Integrated"
- Write real, contextual content: named features, realistic taglines, specific benefit statements tied to the actual product/topic
- Never leave sections visually empty. Each section must include either component visuals, image/media, or intentional design content.

**Interactions**
- Preserve every component's native animations and interaction behavior exactly as designed
- Do NOT wrap interactive components (Dock, carousels, sliders) in containers that constrain their width/height or block pointer events

---

${styleEnforcementBlock}${styleEnforcementBlock ? '---\n\n' : ''}${referenceBlock}${referenceBlock ? '\n---\n\n' : ''}# COMPONENT IMPORT PATHS

All components are pre-installed in \`src/components/\`. Use these exact import paths:

\`\`\`tsx
${importLines || '// No components — build a plain HTML/CSS site'}
\`\`\`

Before using any component, **read its source file** to understand its props interface exactly.

---

# ❗ MANDATORY COMPONENTS — CHECKLIST

> **Every component below MUST appear in \`src/App.tsx\` JSX. Missing any = TASK FAILURE. Verify this list before outputting DONE.**

\`\`\`
${mandatoryList || '(no components selected)'}
\`\`\`

---

# DESIGN BRIEF

\`\`\`json
${JSON.stringify(enhancedPrompt, null, 2)}
\`\`\`

---

${pageLayoutSpec}

${layoutPersonalityBlock}
- Do **NOT** scan \`node_modules\` or install new packages unless \`tsc\` reveals a missing \`@types/\` package
- Use Tailwind classes and/or inline styles for all layout and spacing
- Stats and numbers: display at \`4rem\` minimum font-size, not in small badge cards
- NEVER apply identical padding to every section — vary: hero 0, feature sections 8rem, closing 16rem

---

# TYPESCRIPT RULES

- Read the component's \`.tsx\` source to verify exact prop names before using them
- Use \`string\` color values (hex literals) for WebGL/canvas components — not CSS variables
- TextAnimation components must have explicit color props set (WCAG AA contrast ≥ 4.5:1)
- **Icons**: Do NOT add new icon-library imports in \`App.tsx\`. Use inline SVG or Unicode symbols unless an imported ReactBits component already provides icons internally.
- **Placeholder images**: For any component prop that expects an image path (\`src\`, \`icon\`, \`image\`, \`imageSrc\`, \`avatar\`, \`backgroundImage\`, etc.), use one of these pre-installed files — they are already in \`public/\` and served at root:
  - Square / profile → \`/joker-square.jpg\`
  - Portrait / tall → \`/joker-portrait.jpg\`
  - Landscape / banner → \`/joker-landscape.jpg\`
  - Icon / logo SVG → \`/ReactIcon.svg\`
  Do NOT invent URLs, use \`picsum.photos\`, or reference any other external image URLs.
- **Interactive component props**: When a component prop expects a React element (e.g. an icon), pass an actual JSX element — not a string

## COLOR USAGE RULES — MANDATORY

- \`var(--color-text)\` is the ONLY allowed color for body copy, paragraphs, and labels under 0.85rem
- \`var(--color-muted)\` / \`var(--color-accent)\`: use ONLY for display text ≥ 1.5rem, decorative labels, or large uppercase section headings
- NEVER use muted/accent colors for: \`<p>\`, small body text, nav links, form labels
- Every text color must pass WCAG AA (4.5:1 contrast ratio) against its background

${colorGuidanceSection}

---
${cssFundamentals}

## PADDING RULES — NO EXCEPTIONS

- Horizontal padding is handled ENTIRELY by the max-width wrapper \`<div>\` (margin: 0 auto, padding: 0 clamp(1.5rem, 4vw, 4rem))
- Section elements and their direct children MUST NOT add left/right padding or margin
- Only top/bottom padding belongs on \`<section>\` elements
- ✅ Correct:  \`<section style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>\`
- ❌ WRONG:   \`<section style={{ padding: '6rem 5rem' }}>\` ← never do this

---

# WORKFLOW

1. Read this file fully
2. Read \`src/components/{Category}/{Name}/{Name}.tsx\` for each component — understand its exact props interface
3. Commit to an aesthetic direction (typography, color, spatial layout) true to the design brief mood
4. Add Google Fonts \`<link>\` to \`index.html\` for the fonts in \`designTokens.typography\`
5. Write the CSS foundation (variables, resets) in \`src/index.css\` as specified in CSS FOUNDATION above
6. Fill in \`src/App.tsx\` — the structural scaffold is already in place (fixed layers, section stubs, entrance animations). Your job: replace each \`{/* FILL */}\` comment with the real component and surrounding content. Do NOT change section order, \`minHeight\`, \`position\`, or \`zIndex\` values — those are locked constraints
7. **Verify the MANDATORY COMPONENTS checklist above — every component must appear in JSX**
8. Run: \`npx tsc --noEmit\`
9. If errors → fix them and re-run \`tsc\`
10. Verify that no scaffold placeholders remain and layout constraints are preserved
11. When checks are clean → output **DONE** and stop
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
      maxBudgetUsd: options.aiBudgetUsd,
    });

    // Post-generation: verify component presence + locked layout constraints
    try {
      const appTsx = require('fs').readFileSync(path.join(targetDir, 'src', 'App.tsx'), 'utf-8');
      const validation = validateGeneratedLayout({
        appTsx,
        selectedComponents,
        layoutConfig: options.layoutConfig || null,
      });

      if (!validation.ok) {
        notify(`[Validator] ⚠️ Layout/style issues detected — running correction pass...`);
        const correctionPrompt = `Fix these issues in src/App.tsx while preserving all existing design intent:\n- ${validation.issues.join('\n- ')}\n\nRules:\n- Keep the existing section order.\n- Keep fixed layers as fixed-position with correct z-index semantics.\n- Ensure all required components are present.\n- Remove any remaining scaffold placeholders.\nOutput DONE when finished.`;
        await generateCode({
          projectPath: targetDir,
          onProgress: notify,
          prompt: correctionPrompt,
          maxBudgetUsd: Math.min(0.2, Number(options.aiBudgetUsd || 0.2)),
        });
        notify(`[Validator] Correction pass complete.`);
      } else {
        notify(`[Validator] ✓ Layout and component validation passed.`);
      }
    } catch (e) {
      log(`[Validator] Warning: Could not verify App.tsx — ${e.message}\n`);
    }

    // Optional Polish Pass (screenshot + Claude vision + CSS patches)
    if (options.polishPass) {
      try {
        const { runPolishPass } = require('../../electron/polishPass.cjs');
        await runPolishPass({
          projectPath: targetDir,
          enhancedPrompt,
          aesthetics,
          onLog: log,
        });
      } catch (ppErr) {
        log(`[Polish] Polish pass skipped: ${ppErr.message}\n`);
      }
    }
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
