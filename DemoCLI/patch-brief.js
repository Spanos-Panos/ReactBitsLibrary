/**
 * Patch script — run once via `node DemoCLI/patch-brief.js` to update writeReviewerBrief.
 * Delete this file after running.
 */
const fs = require('fs');
const p = 'c:/Users/Walking Dead/Desktop/Programming/Full Stack Apps/ReactBitsAntigravity/DemoCLI/index.cjs';
let src = fs.readFileSync(p, 'utf-8');

// ── 1. Insert AESTHETIC_STYLE_EXAMPLES before the writeReviewerBrief function ─
const insertMarker = '// ── Write REVIEWER_BRIEF.md to the project root ───────────────────────────────';
const insertIdx = src.indexOf(insertMarker);
if (insertIdx === -1) { console.error('insertMarker not found'); process.exit(1); }

const aestheticExamplesCode = `
// ── Aesthetic-specific style examples for REVIEWER_BRIEF.md ───────────────────
const AESTHETIC_STYLE_EXAMPLES = {
  futuristic: [
    "h1/h2: text-shadow: '0 0 30px var(--color-accent)' — apply on EVERY heading",
    "Labels/small text: fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)'",
    "Buttons: border: '1px solid var(--color-accent)', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.15em'",
    "Sections: borderTop: '1px solid rgba(255,255,255,0.06)' — scan-line divider between sections",
    "Accent color (--color-accent) MUST appear on: at least 1 button, 1 label, 1 interactive element per section",
  ],
  minimal: [
    "Typography: fontWeight 300 for body, 600 for headings, letterSpacing: '-0.02em'",
    "Buttons: transparent background, thin 1px border, borderRadius: '4px' max",
    "Whitespace: minimum 8rem section padding — never compress content vertically",
    "Colors: max 2-3 colors total, accent used sparingly for 1-2 elements only",
  ],
  editorial: [
    "h1: fontSize: 'clamp(4rem,12vw,10rem)', fontWeight: 300, letterSpacing: '-0.04em'",
    "Sections: borderTop: '1px solid rgba(255,255,255,0.1)' to separate content blocks",
    "Buttons: uppercase, letterSpacing: '0.08em', transparent background",
    "Layout: generous whitespace 8rem+, editorial left-alignment throughout",
  ],
  brutalist: [
    "Headings: fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em'",
    "Sections: borderTop: '3px solid var(--color-text)' — thick hard borders",
    "Buttons: background: 'var(--color-text)', color: 'var(--color-bg)', NO border-radius",
    "Borders: borderRadius: 0 everywhere — absolutely NO rounded corners",
  ],
  luxury: [
    "Headings: fontWeight: 300, letterSpacing: '0.08em' — extreme thin weight is essential",
    "Labels: textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.65rem'",
    "Buttons: thin 1px border in accent color, uppercase, padding: '0.8em 2.4em'",
    "Spacing: 10rem+ section padding — extreme whitespace IS the luxury aesthetic",
    "Accent (gold/cream) used ONLY on labels, thin borders, and 1 CTA button",
  ],
  organic: [
    "Buttons: borderRadius: '999px' (pill shape), boxShadow: '0 4px 16px rgba(0,0,0,0.1)'",
    "Cards/images: borderRadius: '16px' minimum — everything should feel rounded and soft",
    "Colors: warm tones, avoid stark black/white — use var(--color-text) for all text",
    "Sections: 7rem padding, comfortable breathing room between sections",
  ],
  playful: [
    "Headings: fontWeight: 900, high contrast against background",
    "Buttons: borderRadius: '999px', boxShadow: '4px 4px 0 var(--color-accent)' (offset shadow)",
    "Colors: bold saturated primary (--color-primary) used prominently on CTAs and highlights",
    "Hover effects: transform: 'translate(-2px,-2px)' on buttons for bouncy feel",
  ],
  corporate: [
    "Clean grid layout: strict alignment, no decorative elements or random asymmetry",
    "Buttons: borderRadius: '6px', solid primary color (#1d4ed8 range), fontWeight: 600",
    "Typography: no extreme sizes — keep h1 max 4rem, clean readable stack",
    "Accent (--color-accent) on links, border highlights, active/hover states only",
  ],
};

`;

src = src.slice(0, insertIdx) + aestheticExamplesCode + src.slice(insertIdx);

// ── 2. Replace the writeReviewerBrief function body ───────────────────────────
const oldFuncMarker = 'async function writeReviewerBrief(projectPath, briefContext, tsErrors) {';
const oldFuncIdx = src.indexOf(oldFuncMarker);
if (oldFuncIdx === -1) { console.error('function not found'); process.exit(1); }

const afterFuncStart = oldFuncIdx + oldFuncMarker.length;
let braces = 1;
let funcEndIdx = afterFuncStart;
while (funcEndIdx < src.length && braces > 0) {
  if (src[funcEndIdx] === '{') braces++;
  else if (src[funcEndIdx] === '}') braces--;
  funcEndIdx++;
}

const newFuncBody = `{
  const { isComponentMapped, getSectionHint } = require('./generators/component-mapper.cjs');
  const compList   = briefContext.components || [];
  const mapped     = compList.filter(c => isComponentMapped(c.name)).map(c => c.name);
  const unmapped   = compList.map(c => c.name).filter(n => !mapped.includes(n));
  const aesthetic  = (briefContext.aesthetic || 'minimal').toLowerCase();
  const TEXT_ANIM_SET = new Set([
    'SplitText', 'ShinyText', 'GradientText', 'BlurText', 'TextPressure',
    'FuzzyText', 'Typewriter', 'ScrambleText', 'RotatingText', 'CircularText', 'ShimmerText',
    'DecryptedText', 'TypingAnimation', 'MorphingText', 'FallingText',
  ]);
  const textAnimComponents = compList.filter(c => TEXT_ANIM_SET.has(c.name));
  const backgroundComponents = compList.filter(c => c.category === 'Backgrounds');

  // Component Placement Guide rows
  const placementRows = compList.map(c => {
    const hint = getSectionHint(c.name);
    if (!hint) return null;
    return '| ' + c.name + ' | ' + hint.sectionHint + ' | ' + hint.note + ' |';
  }).filter(Boolean);

  // Content Overrides
  const overrides = briefContext.contentOverrides || {};
  const overrideLines = Object.entries(overrides)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => '- ' + k + ' → "' + v + '"');

  // Aesthetic style examples
  const styleExamples = AESTHETIC_STYLE_EXAMPLES[aesthetic] || AESTHETIC_STYLE_EXAMPLES.minimal;

  const textAnimSection = textAnimComponents.length > 0 ? [
    '## TextAnimation Components',
    'The following components are **text animation wrappers** — they animate heading text:',
    textAnimComponents.map(c => '- **' + c.name + '**').join('\n'),
    '',
    'RULE: Place TextAnimation components INSIDE an h1 or h2 heading, NOT as standalone sections.',
    'CORRECT: <h2><SplitText text="Our Features" /></h2>',
    'WRONG: <section><SplitText text="Our Features" /></section>',
  ].join('\n') : '';

  const bgSection = backgroundComponents.length > 0 ? [
    '## Background Components',
    'The following are **fixed overlay backgrounds** (position: fixed, z-index: 0):',
    backgroundComponents.map(c => '- **' + c.name + '**').join('\n'),
    '',
    'RULE: DO NOT move or add wrappers to these. They are already position:fixed; inset:0; z-index:0.',
    'Ensure all page content sections have position:relative and z-index:1 or higher.',
  ].join('\n') : '';

  const placementSection = placementRows.length > 0 ? [
    '## Component Placement Guide',
    '| Component | Ideal Section | Notes |',
    '|---|---|---|',
    ...placementRows,
  ].join('\n') : '';

  const overridesSection = [
    '## Content Overrides (apply these EXACTLY)',
    '- Brand name: "' + briefContext.brandName + '"',
    '- Tagline: "' + (briefContext.tagline || 'Use brand voice') + '"',
    '- CTA button: "' + briefContext.callToAction + '"',
    overrideLines.length > 0 ? '\n### AI-Generated Overrides:\n' + overrideLines.join('\n') : '',
  ].filter(Boolean).join('\n');

  const styleSection = [
    '## Aesthetic Style Guide: ' + briefContext.aesthetic,
    'Apply ALL of these patterns — check every section before finishing:',
    styleExamples.map(e => '- ' + e).join('\n'),
  ].join('\n');

  const parts = [
    '# REVIEWER_BRIEF.md',
    '_Generated by BitForge — this file is your mission for the AI reviewer._',
    '',
    '## Project Info',
    '| Field | Value |',
    '|---|---|',
    '| Brand | ' + briefContext.brandName + ' |',
    '| Tagline | ' + (briefContext.tagline || '—') + ' |',
    '| Industry | ' + (briefContext.industry || '—') + ' |',
    '| Aesthetic | ' + briefContext.aesthetic + ' |',
    '| Site Type | ' + briefContext.siteType + ' |',
    '| CTA | ' + briefContext.callToAction + ' |',
    '',
    '## Components',
    '### Mapped (template-generated, should be working):',
    mapped.length > 0 ? mapped.map(n => '- ✓ ' + n).join('\n') : '- (none)',
    '',
    '### Unmapped (placeholder divs — YOU MUST FIX THESE):',
    unmapped.length > 0 ? unmapped.map(n => '- ✗ ' + n + ' → find in src/components/, implement real usage').join('\n') : '- (all mapped)',
    '',
    textAnimSection,
    '',
    bgSection,
    '',
    placementSection,
    '',
    overridesSection,
    '',
    styleSection,
    '',
    '## TypeScript Errors',
    tsErrors ? ('```\n' + tsErrors.slice(0, 3000) + '\n```') : '✓ Clean — no TS errors.',
    '',
    '## Priority Fix Order',
    '1. **Unmapped components** — replace placeholder divs with real usage from src/components/',
    '2. **TypeScript errors** — fix every error listed above',
    '3. **TextAnimation** — verify they wrap headings, not standalone sections (see section above)',
    '4. **Content overrides** — apply all brand-specific copy from Content Overrides section',
    '5. **Aesthetic style** — apply every rule from the Aesthetic Style Guide above',
    '6. **Z-index** — backgrounds z:0, content z:1+, nav z:100+',
    '',
    '## Rules',
    '- DO NOT rewrite files that have no issues',
    '- DO NOT add new dependencies — all packages are already installed',
    '- DO NOT add placeholder comments or TODO comments',
    '- Use CSS variables: --color-bg, --color-text, --color-accent, --color-primary, --color-border',
    '- Text contrast: every <p>, <h1>-<h6>, <span>, <li> must have readable color vs its background',
    '- When finished with all fixes, output: DONE',
    '',
    '## Brief Context JSON',
    '```json',
    JSON.stringify(briefContext, null, 2),
    '```',
  ];

  await fs.writeFile(path.join(projectPath, 'REVIEWER_BRIEF.md'), parts.filter(s => s !== undefined).join('\n'), 'utf-8');
}`;

src = src.slice(0, oldFuncIdx) + 'async function writeReviewerBrief(projectPath, briefContext, tsErrors) ' + newFuncBody + src.slice(funcEndIdx);
fs.writeFileSync(p, src, 'utf-8');
console.log('writeReviewerBrief replaced OK');
console.log('Has AESTHETIC_STYLE_EXAMPLES:', src.includes('AESTHETIC_STYLE_EXAMPLES'));
console.log('Has getSectionHint:', src.includes('getSectionHint'));
console.log('Has TextAnimation section:', src.includes('TextAnimation Components'));
console.log('Has Aesthetic Style Guide:', src.includes('Aesthetic Style Guide'));
