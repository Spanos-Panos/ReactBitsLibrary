const fs = require('fs');
const pathLocalGen = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';

let content = fs.readFileSync(pathLocalGen, 'utf8');

// Replace GradualBlur with FadeContent in combos to improve consistency
content = content.replace(/"Animations\/GradualBlur"/g, '"Animations/FadeContent"');

fs.writeFileSync(pathLocalGen, content);
console.log('Replaced GradualBlur with FadeContent in local-generator.cjs');

const pathPageBuilder = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\generators\\page-builder.cjs';
let pbContent = fs.readFileSync(pathPageBuilder, 'utf8');

// Add 'stats' to Home page sections
if (!pbContent.includes("'hero', 'features', 'stats', 'showcase'")) {
  pbContent = pbContent.replace(
    /'home':\s*\[\s*'hero', 'features', 'showcase'/,
    `'home':     ['hero', 'features', 'stats', 'showcase'`
  );
}

fs.writeFileSync(pathPageBuilder, pbContent);
console.log('Updated Home page sections in page-builder.cjs');
