const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';

// 1. Clean state
require('child_process').execSync('git restore DemoCLI/generators/page-builder.cjs');
let content = fs.readFileSync(path, 'utf8');

const newWithContentText = `function withContentText(compName, jsx, text) {
  if (!TEXT_PROP_COMPONENTS.has(compName) || !text) return jsx;
  const updatedJsx = jsx.replace(/(text=["'])(.*?)(["'])/, ($, p1, p2, p3) => \`\${p1}\${text.replace(/"/g, "'")}\${p3}\`);
  
  return \`<div style={{ maxWidth: '100%', overflow: 'hidden', padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 'max-content' }}>
      \${updatedJsx}
    </div>
  </div>\`;
}`;

const newBuildShowcaseSection = `function buildShowcaseSection(componentNames, aesthetic, layout) {
  const blocks = componentNames
    .map(name => {
      const comp = getComponent(name);
      if (!comp) return null;
      if (comp.category === 'Backgrounds' || comp.category === 'Animations' || comp.isFixed) return null;

      const jsx = fixImageUrls(comp.usageMarkdown);
      return \`<div key="\${name}" style={{ marginBottom: '6rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '1.5rem', opacity: 0.6 }}>Experimental: \${name}</div>
        \${jsx}
      </div>\`;
    })
    .filter(Boolean);

  if (blocks.length === 0) return '';

  return \`      <section style={{ padding: '8rem 0', position: 'relative', zIndex: 1 }}>
        <div \${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '5rem', letterSpacing: '-0.03em' }}>Experimental Showcase</h2>
          \${blocks.join('\\n')}
        </div>
      </section>\`;
}`;

// SPLIT 1
const boundary1 = '// ── Text prop substitution for TextAnimation components ───────────────────────';
const parts1 = content.split(boundary1);
// SPLIT 2
const boundary2 = '// ── Section builders ──────────────────────────────────────────────────────────';
const parts2 = parts1[1].split(boundary2);

const middle1 = `

const TEXT_PROP_COMPONENTS = new Set([
  'SplitText', 'ShinyText', 'GradientText', 'BlurText', 'TextPressure',
  'FuzzyText', 'Typewriter', 'ScrambleText', 'RotatingText', 'CircularText', 'ShimmerText',
]);

` + newWithContentText + `

`;

content = parts1[0] + boundary1 + middle1 + boundary2 + parts2[1];

// SPLIT 3
const boundary3 = 'function buildShowcaseSection';
const parts3 = content.split(boundary3);
// SPLIT 4
const boundary4 = 'function buildFooterSection';
const parts4 = parts3[1].split(boundary4);

content = parts3[0] + newBuildShowcaseSection + '\n\n' + boundary4 + parts4[1];

fs.writeFileSync(path, content);
console.log('Final polish applied.');
