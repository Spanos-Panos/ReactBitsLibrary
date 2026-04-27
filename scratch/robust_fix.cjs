const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';
let content = fs.readFileSync(path, 'utf8');

// 1. Define the NEW functions
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

// 2. Split by unique boundaries
// withContentText is between TEXT_PROP_COMPONENTS and // ── Section builders
const parts1 = content.split('// ── Text prop substitution for TextAnimation components ───────────────────────');
const parts2 = parts1[1].split('// ── Section builders ──────────────────────────────────────────────────────────');

const middle1 = `

const TEXT_PROP_COMPONENTS = new Set([
  'SplitText', 'ShinyText', 'GradientText', 'BlurText', 'TextPressure',
  'FuzzyText', 'Typewriter', 'ScrambleText', 'RotatingText', 'CircularText', 'ShimmerText',
]);

\${newWithContentText}

`;

content = parts1[0] + '// ── Text prop substitution for TextAnimation components ───────────────────────' + middle1 + '// ── Section builders ──────────────────────────────────────────────────────────' + parts2[1];

// 3. Replace buildShowcaseSection
// It's between buildContactSection and buildFooterSection (usually)
// But to be safe, I'll just use a regex that matches the WHOLE function including the leftover garbage if any
content = content.replace(/function buildShowcaseSection\([\s\S]*?\}\s*\}\s*>\s*\\n\s*\$\{comp\.jsx\}[\s\S]*?\}\s*\}/, newBuildShowcaseSection);
// Wait, that regex is too specific to the corruption.

// Let's try splitting again for buildShowcaseSection
const parts3 = content.split('function buildShowcaseSection');
// The part after the first match contains the body and then the rest of the file.
// We need to find where the NEXT function starts or the module.exports starts.
const parts4 = parts3[1].split('function buildFooterSection');

content = parts3[0] + newBuildShowcaseSection + '\n\nfunction buildFooterSection' + parts4[1];

fs.writeFileSync(path, content);
console.log('REALLY fixed it this time.');
