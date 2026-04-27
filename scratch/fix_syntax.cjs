const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';
let content = fs.readFileSync(path, 'utf8');

// The regex I used in expand_local_gen.cjs was too greedy or duplicated things
// Let's just fix the Minimal|Landing block manually
const badBlock = /"Minimal\|Landing": \[\s*\["TextAnimations\/BlurText", "Animations\/FadeContent", "Components\/Counter", "Backgrounds\/DotGrid"\],\s*"Minimal\|Landing": \[\s*[\s\S]*?\]\s*\],/;
const goodBlock = `"Minimal|Landing": [
    ["TextAnimations/SplitText", "Animations/FadeContent", "Components/Counter", "Backgrounds/DotGrid"],
    ["TextAnimations/BlurText", "Animations/GradualBlur", "Components/SpotlightCard"],
    ["TextAnimations/SplitText", "Components/Counter", "Animations/FadeContent"],
    ["Backgrounds/DotGrid", "TextAnimations/BlurText", "Components/AnimatedList", "Animations/FadeContent"],
    ["TextAnimations/ScrollReveal", "Components/SpotlightCard", "Animations/GradualBlur"],
    ["TextAnimations/SplitText", "Animations/FadeContent", "Components/TiltedCard"],
    ["TextAnimations/BlurText", "Components/MagicBento", "Animations/FadeContent"],
    ["Backgrounds/Aurora", "TextAnimations/SplitText", "Components/Stepper"],
    ["TextAnimations/ScrollFloat", "Components/SpotlightCard", "Animations/FadeContent"]
  ],`;

content = content.replace(badBlock, goodBlock);

// Also check for any other mess-ups
content = content.replace(/\]\s*\],\s*\["TextAnimations\/SplitText", "Animations\/GradualBlur", "Components\/SpotlightCard"\]/g, '],');

fs.writeFileSync(path, content);
console.log('Fixed local-generator.cjs syntax error');
