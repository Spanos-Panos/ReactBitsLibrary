const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix withContentText (remove garbage lines)
content = content.replace(/function withContentText\(compName, jsx, text\) \{[\s\S]*?\}\s*"\s*;\s*return jsx[\s\S]*?\}/, 
`function withContentText(compName, jsx, text) {
  if (!TEXT_PROP_COMPONENTS.has(compName) || !text) return jsx;
  const updatedJsx = jsx.replace(/(text=["'])(.*?)(["'])/, ($, p1, p2, p3) => \`\${p1}\${text.replace(/"/g, "'")}\${p3}\`);
  
  return \`<div style={{ maxWidth: '100%', overflow: 'hidden', padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: 'max-content' }}>
      \${updatedJsx}
    </div>
  </div>\`;
}`);

// 2. Restore buildShowcaseSection (improved version)
content = content.replace(/function buildShowcaseSection\(unplacedNames, aesthetic, layout\) \{[\s\S]*?\}/, 
`function buildShowcaseSection(componentNames, aesthetic, layout) {
  const blocks = componentNames
    .map(name => {
      const comp = getComponent(name);
      if (!comp) return null;
      
      // Filter out background/animation components from being rendered in-flow
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
}`);

fs.writeFileSync(path, content);
console.log('Fixed syntax errors and restored improved showcase section in page-builder.cjs');
