/**
 * colorContrast.cjs
 * WCAG-based color contrast utilities for TextAnimation component generation.
 * No external dependencies.
 */

// ─── WCAG Contrast Math ──────────────────────────────────────────────────────

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toLinear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns '#ffffff' or '#000000' — whichever achieves WCAG AA contrast (≥4.5:1)
 * against the given background hex color.
 */
function getContrastColor(bgHex) {
  try {
    const ratioWhite = getContrastRatio(bgHex, '#ffffff');
    const ratioBlack = getContrastRatio(bgHex, '#000000');
    return ratioWhite >= ratioBlack ? '#ffffff' : '#000000';
  } catch {
    return '#ffffff'; // safe fallback for dark backgrounds
  }
}

// ─── Component Color Prop Map ────────────────────────────────────────────────

/**
 * TextAnimation components that have EXPLICIT color props (vs. CSS inheritance).
 * type 'text' = prop should receive the contrast text color
 * type 'bg'   = prop should receive the background color itself
 */
const COLOR_PROP_MAP = {
  FuzzyText:    [{ prop: 'color',           type: 'text' }],
  ASCIIText:    [{ prop: 'textColor',       type: 'text' }],
  TextPressure: [{ prop: 'textColor',       type: 'text' }],
  GlitchText:   [
    { prop: 'color',           type: 'text' },
    { prop: 'backgroundColor', type: 'bg'   },
  ],
  PixelTrail:   [
    { prop: 'textColor',       type: 'text' },
    { prop: 'backgroundColor', type: 'bg'   },
  ],
  // GradientText  → uses colors[] array gradient, always visible → skip
  // FallingText   → backgroundColor is physics canvas bg, no text color prop → skip
};

/**
 * CSS-inheriting components: these pick up color from the parent container.
 * No prop injection needed — just ensure the wrapper has the right color.
 */
const CSS_INHERITING_COMPONENTS = [
  'BlurText', 'CircularText', 'CountUp', 'CurvedLoop', 'DecryptedText',
  'FallingText', 'RotatingText', 'ScrambleText', 'ScrollFloat', 'ScrollReveal',
  'ScrollVelocity', 'ShinyText', 'SplitText', 'TextCursor', 'TextType',
  'TrueFocus', 'VariableProximity', 'GradientText',
];

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Returns an object of prop → value for a given component and background color.
 * Returns null if the component is not in the map (i.e. it uses CSS inheritance).
 *
 * @param {string} componentName
 * @param {string} bgHex - e.g. '#000000'
 * @returns {object|null}
 */
function getColorPropsForComponent(componentName, bgHex) {
  const mapping = COLOR_PROP_MAP[componentName];
  if (!mapping) return null;

  const textColor = getContrastColor(bgHex);
  const result = {};

  for (const { prop, type } of mapping) {
    result[prop] = type === 'text' ? textColor : bgHex;
  }

  return result;
}

/**
 * Injects or overwrites color props directly into a JSX usage code string.
 * Handles self-closing and open tags, single-line and multiline.
 *
 * @param {string} usageCode - Raw JSX/TSX string from UsageXxx.md
 * @param {string} componentName
 * @param {string} bgHex - e.g. '#000000'
 * @returns {string} Modified usage code
 */
function injectColorPropsIntoUsage(usageCode, componentName, bgHex) {
  const props = getColorPropsForComponent(componentName, bgHex);
  if (!props || Object.keys(props).length === 0) return usageCode;

  // Find the first opening tag for this component
  const tagStart = usageCode.indexOf(`<${componentName}`);
  if (tagStart === -1) return usageCode;

  // Walk forward from after the component name to find the end of the opening tag.
  // We track brace depth to skip over JSX expressions like prop={value}.
  let i = tagStart + componentName.length + 1;
  let tagEnd = -1;
  let braceDepth = 0;

  while (i < usageCode.length) {
    const ch = usageCode[i];
    if (ch === '{') { braceDepth++; }
    else if (ch === '}') { braceDepth--; }
    else if (braceDepth === 0) {
      if (ch === '/' && usageCode[i + 1] === '>') { tagEnd = i; break; }
      if (ch === '>' && usageCode[i - 1] !== '=') { tagEnd = i; break; }
    }
    i++;
  }

  if (tagEnd === -1) return usageCode;

  const isSelfClosing = usageCode[tagEnd] === '/';
  const tagLength = tagEnd - tagStart + (isSelfClosing ? 2 : 1);
  let tagContent = usageCode.substring(tagStart, tagStart + tagLength);

  // For each prop, replace existing value or inject after component name
  for (const [propName, propValue] of Object.entries(props)) {
    const newPropStr = `${propName}="${propValue}"`;

    // Match existing prop with string or expression value
    const existingProp = new RegExp(
      `\\b${propName}=(?:"[^"]*"|'[^']*'|\\{[^}]*\\})`,
      'g'
    );

    if (existingProp.test(tagContent)) {
      tagContent = tagContent.replace(existingProp, newPropStr);
    } else {
      // Insert right after <ComponentName
      tagContent = tagContent.replace(
        `<${componentName}`,
        `<${componentName}\n  ${newPropStr}`
      );
    }
  }

  return usageCode.substring(0, tagStart) + tagContent + usageCode.substring(tagStart + tagLength);
}

/**
 * Builds the TextAnimation Color Rules section for CLAUDE.md.
 *
 * @param {string[]} textAnimComponentNames - Names of selected TextAnimation components
 * @param {string} bgHex - The project background color from designTokens
 * @returns {string} Markdown section to append to CLAUDE.md
 */
function buildColorGuidanceSection(textAnimComponentNames, bgHex) {
  if (!textAnimComponentNames || textAnimComponentNames.length === 0) return '';

  // Normalise bgHex - handle names like 'black', 'white', or missing #
  let bg = bgHex || '#000000';
  if (!bg.startsWith('#')) bg = '#000000';

  const textColor = getContrastColor(bg);
  const canvasBased = [];
  const cssInheriting = [];

  for (const name of textAnimComponentNames) {
    const props = getColorPropsForComponent(name, bg);
    if (props) {
      const propStr = Object.entries(props)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      canvasBased.push(`  - <${name} ${propStr} />`);
    } else {
      cssInheriting.push(`  - ${name}`);
    }
  }

  let section = `\n## TextAnimation Color Rules — MANDATORY\n`;
  section += `The project background is \`${bg}\`. To prevent invisible text:\n\n`;

  if (canvasBased.length > 0) {
    section += `**Canvas-based components** (require explicit props — do NOT omit these):\n`;
    section += canvasBased.join('\n') + '\n\n';
  }

  if (cssInheriting.length > 0) {
    section += `**CSS-inheriting components** (set text color on their wrapper):\n`;
    section += cssInheriting.join('\n') + '\n';
    section += `  → Wrap each in: \`<div style={{ color: '${textColor}' }}>...</div>\`\n\n`;
  }

  section += `8. **DO NOT** change the color prop values listed above.\n`;

  return section;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getContrastColor,
  getContrastRatio,
  getColorPropsForComponent,
  injectColorPropsIntoUsage,
  buildColorGuidanceSection,
  COLOR_PROP_MAP,
  CSS_INHERITING_COMPONENTS,
};
