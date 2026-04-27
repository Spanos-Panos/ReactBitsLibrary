const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix pickFonts (ensure it uses capitalized key)
const oldPickFonts = /function pickFonts\(aesthetic\) \{[\s\S]*?return \[\s*\{ value: pair\.heading, role: "heading" \},\s*\{ value: pair\.body,    role: "body" \}\s*\];\s*\}/;
const newPickFonts = `function pickFonts(aesthetic) {
  const normalized = aesthetic.charAt(0).toUpperCase() + aesthetic.slice(1).toLowerCase();
  const pool = FONT_PAIRINGS[normalized] || FONT_PAIRINGS["Minimal"];
  const pair = pick(pool);
  return [
    { value: pair.heading, role: "heading" },
    { value: pair.body,    role: "body" }
  ];
}`;
content = content.replace(oldPickFonts, newPickFonts);

// 2. Add imageSearchKeywords to generateCopy return
content = content.replace(/return \{\s*tagline: tagline,[\s\S]*?personality: personality,\s*\};/, 
`return {
    tagline: tagline,
    industry: industry,
    description: description,
    usp: usp,
    services: services,
    keyBenefits: benefits,
    targetAudience: audience,
    callToAction: cta,
    imageSearchKeywords: pick(pool.imageSearchKeywords) || "", // NEW
    tone: tone,
    personality: personality,
    typographyIntensity: pool.typographyIntensity || "subtle",
    visualEffects: pool.visualEffects || [],
    optimizationTarget: pool.optimizationTarget || "adaptive",
    spacingScale: pool.spacingScale || "comfortable",
    borderRadius: pool.borderRadius || "medium",
    audience: pick(pool.audiences) || "global",
  };`);

// 3. Add imageSearchKeywords to generateClient return
content = content.replace(/targetAudience: copy\.targetAudience,[\s\S]*?callToAction:   copy\.callToAction,/,
`targetAudience: copy.targetAudience,
      callToAction:   copy.callToAction,
      imageSearchKeywords: copy.imageSearchKeywords, // NEW`);

// 4. Clean up any duplicated or corrupted text from previous failed edit
// I noticed I added "// ... elsewhere in generateClient ..." etc.
content = content.replace(/\/\/ \.\.\. elsewhere in generateClient \.\.\.[\s\S]*?\/\/ Section E: Component selection tables/, '// ─────────────────────────────────────────────────────────────\n// Section E: Component selection tables');

fs.writeFileSync(path, content);
console.log('Successfully cleaned and updated local-generator.cjs');
