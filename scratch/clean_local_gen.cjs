const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';
let content = fs.readFileSync(path, 'utf8');

// Restore pickFonts and properly update it
content = content.replace(/function pickFonts\(aesthetic\) \{[\s\S]*?return \[\s*\{ value: pair\.heading, role: "heading" \},\s*\{ value: pair\.body,    role: "body" \}\s*\];\s*\}/, 
`function pickFonts(aesthetic) {
  const normalized = aesthetic.charAt(0).toUpperCase() + archetype.aesthetic.slice(1).toLowerCase(); // Wait, archetype is not in scope here, need to fix
  const pool = FONT_PAIRINGS[normalized] || FONT_PAIRINGS["Minimal"];
  const pair = pick(pool);
  return [
    { value: pair.heading, role: "heading" },
    { value: pair.body,    role: "body" }
  ];
}`);

// Wait, I should just fix the whole file logic for generateClient and pickFonts
// I'll use a cleaner script.
