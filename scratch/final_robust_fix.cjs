const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';
const originalContent = fs.readFileSync(path, 'utf8');

// I'll start from a clean state again just to be sure
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

const parts1 = content.split('// ── Text prop substitution for TextAnimation components ───────────────────────');
const parts2 = parts1[1].split('// ── Section builders ──────────────────────────────────────────────────────────');

const middle1 = '\\n\\nconst TEXT_PROP_COMPONENTS = new Set([\\n  \'SplitText\', \'ShinyText\', \'GradientText\', \'BlurText\', \'TextPressure\',\\n  \'FuzzyText\', \'Typewriter\', \'ScrambleText\', \'RotatingText\', \'CircularText\', \'ShimmerText\',\\n]);\\n\\n' + newWithContentText + '\\n\\n';

content = parts1[0] + '// ── Text prop substitution for TextAnimation components ───────────────────────' + middle1 + '// ── Section builders ──────────────────────────────────────────────────────────' + parts2[1];

const parts3 = content.split('function buildShowcaseSection');
const parts4 = parts3[1].split('function buildFooterSection');

content = parts3[0] + newBuildShowcaseSection + '\\n\\nfunction buildFooterSection' + parts4[1];

fs.writeFileSync(path, content);
console.log('REALLY REALLY fixed it this time.');
