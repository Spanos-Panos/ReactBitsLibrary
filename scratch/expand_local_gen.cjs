const fs = require('fs');
const path = 'c:\\Users\\Walking Dead\\Desktop\\Programming\\Full Stack Apps\\ReactBitsAntigravity\\DemoCLI\\synthetic-client\\local-generator.cjs';
let content = fs.readFileSync(path, 'utf8');

const keywordMap = {
  "LuxuryWatch": "luxury watch, swiss movement, horology, premium lifestyle",
  "RacingStore": "race car parts, turbocharger, performance automotive, track day",
  "BrutalistPortfolio": "brutalist architecture, raw concrete, industrial design, experimental typography",
  "MinimalStudio": "minimalist workspace, clean aesthetic, architectural detail, white space",
  "CyberpunkSaaS": "server room, fiber optics, neon tech, futuristic data center",
  "PhotographyBook": "urban street photography, black and white city, film grain, gallery wall",
  "CoffeeShop": "specialty coffee beans, latte art, rustic cafe, coffee roaster",
  "PunkLabel": "punk rock show, vinyl records, diy zine, cassette tapes",
  "LawFirm": "modern law office, legal documents, professional handshake, corporate skyline",
  "WellnessClinic": "acupuncture needles, herbal tea, yoga studio, calm spa",
  "IndieGameStudio": "pixel art, neon arcade, game development setup, synthwave aesthetic",
  "FashionBrand": "high fashion runway, avant-garde clothing, moody studio, fabric texture",
  "ArchitectureFirm": "architectural model, skyscraper blueprint, modern concrete building, light and shadow",
  "DeFiProtocol": "blockchain visualization, digital currency, crypto security, complex network",
  "StreetArtCo": "graffiti alley, mural painting, spray paint cans, urban art",
  "FitnessApp": "hiit workout, smartwatch biometric, runner at night, gym equipment",
  "FineRestaurant": "molecular gastronomy, fine dining plate, chef plating, candlelit restaurant",
  "BoutiqueRealty": "modern penthouse, architectural home, luxury living room, infinity pool",
  "MusicProducer": "techno studio, modular synthesizer, audio waveform, club strobe lights",
  "SustainableFashion": "recycled fabric, organic cotton, sustainable clothing label, nature aesthetic"
};

for (const [archetype, keywords] of Object.entries(keywordMap)) {
  const regex = new RegExp(`("${archetype}": \\{[\\s\\S]*?ctas: \\[.*?\\]),`);
  content = content.replace(regex, `$1,\n    imageSearchKeywords: ["${keywords}"],`);
}

// Also expand COMPONENT_COMBOS for some aesthetics to improve variety
// Add more to Minimal|Landing
content = content.replace(/("Minimal\|Landing": \[\s*[\s\S]*?\]),/, 
`$1,
  "Minimal|Landing": [
    ["TextAnimations/SplitText", "Animations/FadeContent", "Components/Counter", "Backgrounds/DotGrid"],
    ["TextAnimations/BlurText", "Animations/GradualBlur", "Components/SpotlightCard"],
    ["TextAnimations/SplitText", "Components/Counter", "Animations/FadeContent"],
    ["Backgrounds/DotGrid", "TextAnimations/BlurText", "Components/AnimatedList", "Animations/FadeContent"],
    ["TextAnimations/ScrollReveal", "Components/SpotlightCard", "Animations/GradualBlur"],
    ["TextAnimations/SplitText", "Animations/FadeContent", "Components/TiltedCard"],
    ["TextAnimations/BlurText", "Components/MagicBento", "Animations/FadeContent"],
    ["Backgrounds/Aurora", "TextAnimations/SplitText", "Components/Stepper"],
    ["TextAnimations/ScrollFloat", "Components/SpotlightCard", "Animations/FadeContent"]
  ],`);

fs.writeFileSync(path, content);
console.log('Added imageSearchKeywords and expanded variety');
