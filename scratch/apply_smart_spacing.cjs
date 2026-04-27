const fs = require('fs');
const pathPageBuilder = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';

// 1. Update page-builder.cjs
let pbContent = fs.readFileSync(pathPageBuilder, 'utf8');

// Fix lineHeight in buildHeroSection
pbContent = pbContent.replace(
  /lineHeight:\s*['"]1\.0['"]/,
  `lineHeight: '1.15'`
);

// Fix layout padding to be slightly smarter
const layoutOld = `const LAYOUT = {
  minimal:    { heroAlign: 'left',   maxWidth: '720px',  sectionPad: '8rem 0',   headingSize: 'clamp(3rem,8vw,6rem)',   bodyWeight: '300' },
  editorial:  { heroAlign: 'left',   maxWidth: '1100px', sectionPad: '10rem 0',  headingSize: 'clamp(4rem,12vw,10rem)', bodyWeight: '300' },
  brutalist:  { heroAlign: 'left',   maxWidth: '100%',   sectionPad: '5rem 0',   headingSize: 'clamp(3rem,10vw,9rem)',  bodyWeight: '900' },
  futuristic: { heroAlign: 'center', maxWidth: '1280px', sectionPad: '10rem 0',  headingSize: 'clamp(2.5rem,8vw,7rem)', bodyWeight: '700' },
};`;

// We'll change sectionPad to be a bit tighter for mobile, and add a "gap" logic
const layoutNew = `const LAYOUT = {
  minimal:    { heroAlign: 'left',   maxWidth: '720px',  sectionPad: 'clamp(4rem, 8vw, 8rem) 0',   headingSize: 'clamp(2.5rem,8vw,5.5rem)',   bodyWeight: '300' },
  editorial:  { heroAlign: 'left',   maxWidth: '1100px', sectionPad: 'clamp(5rem, 10vw, 10rem) 0', headingSize: 'clamp(3.5rem,10vw,8rem)',  bodyWeight: '300' },
  brutalist:  { heroAlign: 'left',   maxWidth: '100%',   sectionPad: 'clamp(3rem, 6vw, 5rem) 0',   headingSize: 'clamp(3rem,10vw,8rem)',      bodyWeight: '900' },
  futuristic: { heroAlign: 'center', maxWidth: '1280px', sectionPad: 'clamp(4rem, 8vw, 8rem) 0',   headingSize: 'clamp(2.5rem,7vw,6rem)',     bodyWeight: '700' },
};`;

pbContent = pbContent.replace(layoutOld, layoutNew);

// Adjust features/benefits gap logic
// We can find where sections are joined and add a smart wrapper. But actually just updating the clamp padding helps tremendously.

fs.writeFileSync(pathPageBuilder, pbContent);
console.log('Updated page-builder.cjs spacing and line height');

// 2. Update local-generator.cjs
const pathLocalGen = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';
let lgContent = fs.readFileSync(pathLocalGen, 'utf8');

// Ensure SpotlightCard defaults to a visible spotlight
if (!lgContent.includes("spotlightColor: 'rgba(255, 255, 255, 0.2)'")) {
  lgContent = lgContent.replace(
    /return \{ name: compName, props \};/g,
    `if (compName === 'SpotlightCard' && !props.spotlightColor) props.spotlightColor = 'rgba(255, 255, 255, 0.2)';
    return { name: compName, props };`
  );
  fs.writeFileSync(pathLocalGen, lgContent);
  console.log('Updated local-generator.cjs SpotlightCard default');
}
