const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// The corruption is around lines 189-194 (0-indexed: 188-193)
// Let's find the line with }""; or }"";
const startLine = lines.findIndex(l => l.includes('}"`;'));
if (startLine !== -1) {
  // Line 189 is "  </div>`;"
  // Line 190 is "}"`;"
  // Line 191 is "  return jsx"
  // Line 192 is "    .replace(/\btext="[^"]*"/, replacement)"
  // Line 193 is "    .replace(/\btext='[^']*'/, replacement);"
  // Line 194 is "}"
  
  // We want to keep line 189 and then just add "}"
  // So we remove lines startLine through startLine + 4
  lines.splice(startLine, 5); 
  // lines[startLine-1] is "  </div>`;"
  // We need to add "}" after it.
  // Actually, let's just replace the whole function again with a fresh one.
}

const functionStart = lines.findIndex(l => l.includes('function withContentText'));
const functionEnd = lines.findIndex((l, i) => i > functionStart && l.trim() === '}' && lines[i+1]?.includes('Section builders'));

if (functionStart !== -1 && functionEnd !== -1) {
  const newFunction = [
    'function withContentText(compName, jsx, text) {',
    '  if (!TEXT_PROP_COMPONENTS.has(compName) || !text) return jsx;',
    "  const updatedJsx = jsx.replace(/(text=[\"'])(.*?)([\"'])/, ($, p1, p2, p3) => `${p1}${text.replace(/\"/g, \"'\")}${p3}`);",
    '  ',
    '  return `<div style={{ maxWidth: \'100%\', overflow: \'hidden\', padding: \'1rem 0\', display: \'flex\', justifyContent: \'center\' }}>',
    '    <div style={{ width: \'100%\', maxWidth: \'max-content\' }}>',
    '      ${updatedJsx}',
    '    </div>',
    '  </div>`;',
    '}'
  ];
  lines.splice(functionStart, functionEnd - functionStart + 1, ...newFunction);
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Surgically repaired page-builder.cjs');
