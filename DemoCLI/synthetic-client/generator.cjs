const { Anthropic } = require('@anthropic-ai/sdk');

/**
 * Known component IDs from reactbits-manifest.json.
 * Used for validation of Claude's output.
 */
const VALID_COMPONENT_IDS = new Set([
  // Components
  "Components/AnimatedList", "Components/BounceCards", "Components/CardNav",
  "Components/CardSwaps", "Components/Carousel", "Components/ChromeGrid",
  "Components/CircularGallery", "Components/Counter", "Components/DecayCard",
  "Components/Dock", "Components/ElasticSlider", "Components/FlowingMenu",
  "Components/FluidGlass", "Components/FlyingPosters", "Components/Folder",
  "Components/GlassIcons", "Components/GlassSurface", "Components/GooeyNav",
  "Components/InfiniteMenu", "Components/InfiniteScroll", "Components/Lanyard",
  "Components/MagicBento", "Components/Mansory", "Components/ModelViewer",
  "Components/PillNav", "Components/PixelCard", "Components/ProfileCard",
  "Components/RollingGallery", "Components/ScrollStack", "Components/SpotlightCard",
  "Components/Stack", "Components/StaggeredMenu", "Components/Stepper",
  "Components/TiltedCard",

  // Animations
  "Animations/AnimatedContent", "Animations/BlobCursor", "Animations/ClickSpark",
  "Animations/Crosshair", "Animations/Cubes", "Animations/FadeContent",
  "Animations/GlareHover", "Animations/GradualBlur", "Animations/ImageTrail",
  "Animations/LogoLoop", "Animations/MagicRings", "Animations/Magnet",
  "Animations/MagnetLines", "Animations/MetaBalls", "Animations/MetalicPaint",
  "Animations/Noise", "Animations/PixelTrail", "Animations/PixelTransition",
  "Animations/Ribbons", "Animations/ShapeBlur", "Animations/SplashCursor",
  "Animations/StarBorder", "Animations/StickerPeel", "Animations/TargetCursor",

  // Backgrounds
  "Backgrounds/Aurora", "Backgrounds/Balatro", "Backgrounds/Ballpit",
  "Backgrounds/Beams", "Backgrounds/ColorBends", "Backgrounds/DarkVeil",
  "Backgrounds/Dither", "Backgrounds/DotGrid", "Backgrounds/FaultyTerminal",
  "Backgrounds/FloatingLines", "Backgrounds/Galaxy", "Backgrounds/GridDistortion",
  "Backgrounds/GridMotion", "Backgrounds/HyperSpeed", "Backgrounds/Iridescence",
  "Backgrounds/LatterGlitch", "Backgrounds/Lightning", "Backgrounds/LightRays",
  "Backgrounds/LiquidChrome", "Backgrounds/Orb", "Backgrounds/Particles",
  "Backgrounds/Plasma", "Backgrounds/PlasmaWave", "Backgrounds/Prism",
  "Backgrounds/RippleGrid", "Backgrounds/Silk", "Backgrounds/Squares",
  "Backgrounds/Threads", "Backgrounds/Waves",

  // TextAnimations
  "TextAnimations/ASCIIText", "TextAnimations/BlurText", "TextAnimations/CircularText",
  "TextAnimations/CountUp", "TextAnimations/CurvedLoop", "TextAnimations/DecryptedText",
  "TextAnimations/FallingText", "TextAnimations/FuzzyText", "TextAnimations/GlitchText",
  "TextAnimations/GradientText", "TextAnimations/RotatingText", "TextAnimations/ScrambleText",
  "TextAnimations/ScrollFloat", "TextAnimations/ScrollReveal", "TextAnimations/ScrollVelocity",
  "TextAnimations/ShinyText", "TextAnimations/SplitText", "TextAnimations/TextCursor",
  "TextAnimations/TextPressure", "TextAnimations/TextType", "TextAnimations/TrueFocus",
  "TextAnimations/VariableProximity"
]);

const SYSTEM_PROMPT = `You are a synthetic client briefing tool. You output only valid JSON — no prose, no markdown, no explanation. Generate a realistic, specific client profile for a web design project. The client should feel like a real person with an opinion, not a template. Be specific about brand names, locations, colors, and font choices — avoid generic placeholder language.`;

async function generateClient(archetype) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing from environment variables.");
  }

  const anthropic = new Anthropic({ apiKey });

  const userPrompt = `
Generate a client brief for the following project seed:

ARCHETYPE: ${archetype.name}
DESCRIPTION: ${archetype.description}
AESTHETIC: ${archetype.aesthetic}
SITE TYPE: ${archetype.siteType}
COLOR STRATEGY: ${archetype.colorStrategy}
INDUSTRY: ${archetype.industryHints}

Return a JSON object with exactly this structure — no extra fields, no missing fields:

{
  "clientBrief": {
    "brandName": "...",
    "tagline": "...",
    "industry": "...",
    "description": "...",
    "usp": "...",
    "services": "service 1\\nservice 2\\nservice 3",
    "targetAudience": "...",
    "callToAction": "...",
    "keyBenefits": "benefit 1\\nbenefit 2\\nbenefit 3\\nbenefit 4",
    "tone": "...",
    "personality": "...",
    "contactEmail": "...",
    "contactPhone": "...",
    "location": "...",
    "socialLinks": "..."
  },
  "styleDirection": {
    "aesthetics": ["${archetype.aesthetic}"],
    "siteType": "${archetype.siteType}",
    "typographyIntensity": "<one of: subtle | dramatic | experimental>",
    "visualEffects": ["...", "..."],
    "colorStrategy": "${archetype.colorStrategy}",
    "audience": "..."
  },
  "designRules": {
    "fonts": [
      { "value": "<Google Font name>", "role": "heading" },
      { "value": "<Google Font name>", "role": "body" }
    ],
    "colors": [
      { "value": "#xxxxxx", "role": "background" },
      { "value": "#xxxxxx", "role": "text" },
      { "value": "#xxxxxx", "role": "accent" }
    ],
    "sizes": {
      "optimizationTarget": "<one of: mobile | tablet | desktop | adaptive>",
      "spacingScale": "<one of: compact | comfortable | spacious>",
      "borderRadius": "<one of: none | small | medium | large | pill>"
    },
    "images": []
  },
  "selectedComponentIds": ["Category/Name", ...],
  "pages": [
    {
      "id": "page-home",
      "title": "Home",
      "type": "home",
      "componentIds": [],
      "content": {
        "pageTitle": "<specific h1 for this page>",
        "tagline": "<one-line subheading>",
        "sections": [
          { "sectionType": "hero", "heading": "...", "bodyCopy": "1-2 sentences", "cta": "button label" }
        ],
        "valueProps": ["benefit 1", "benefit 2", "benefit 3"],
        "teamMembers": [],
        "services": [],
        "faqs": []
      }
    }
  ],
  "projectPrompt": "...",
  "projectName": "<lowercase-slug>",
  "reasoning": {
    "clientPersona": "...",
    "aestheticChoice": "...",
    "colorChoices": "...",
    "fontChoices": "...",
    "componentChoices": {
      "ComponentName": "reason why this client would choose this component"
    }
  }
}

RULES FOR selectedComponentIds:
- Pick exactly 5 to 8 components from this list:
  Components: AnimatedList, BounceCards, CardNav, CardSwaps, Carousel, ChromeGrid, CircularGallery, Counter, DecayCard, Dock, ElasticSlider, FlowingMenu, FluidGlass, FlyingPosters, Folder, GlassIcons, GlassSurface, GooeyNav, InfiniteMenu, InfiniteScroll, Lanyard, MagicBento, Mansory, ModelViewer, PillNav, PixelCard, ProfileCard, RollingGallery, ScrollStack, SpotlightCard, Stack, StaggeredMenu, Stepper, TiltedCard
  Animations: AnimatedContent, BlobCursor, ClickSpark, Crosshair, Cubes, FadeContent, GlareHover, GradualBlur, ImageTrail, LogoLoop, MagicRings, Magnet, MagnetLines, MetaBalls, MetalicPaint, Noise, PixelTrail, PixelTransition, Ribbons, ShapeBlur, SplashCursor, StarBorder, StickerPeel, TargetCursor
  Backgrounds: Aurora, Balatro, Ballpit, Beams, ColorBends, DarkVeil, Dither, DotGrid, FaultyTerminal, FloatingLines, Galaxy, GridDistortion, GridMotion, HyperSpeed, Iridescence, LatterGlitch, Lightning, LightRays, LiquidChrome, Orb, Particles, Plasma, PlasmaWave, Prism, RippleGrid, Silk, Squares, Threads, Waves
  TextAnimations: ASCIIText, BlurText, CircularText, CountUp, CurvedLoop, DecryptedText, FallingText, FuzzyText, GlitchText, GradientText, RotatingText, ScrambleText, ScrollFloat, ScrollReveal, ScrollVelocity, ShinyText, SplitText, TextCursor, TextPressure, TextType, TrueFocus, VariableProximity
- ID format MUST be "Category/Name" e.g. "Backgrounds/Silk", "TextAnimations/SplitText"
- At most 1 Background component
- At most 1 nav component (CardNav, StaggeredMenu, GooeyNav, Dock, PillNav, FlowingMenu)
- At most 1 cursor (BlobCursor, SplashCursor, PixelTrail, ImageTrail, TargetCursor, Crosshair)
- If the site has MORE THAN ONE page, you MUST include exactly 1 nav component
- AVOID REPETITION: Do NOT default to GradualBlur, SplitText, or CircularGallery in every project. Vary your choices widely across the full component list based on the specific client's aesthetic and industry
- Aesthetic matching rules:
  * Editorial / monochromatic: prefer ScrollReveal, ScrollStack, FadeContent, TiltedCard, AnimatedContent, ShinyText, GradientText
  * Futuristic / dark-bold-accent: prefer SplashCursor, Ribbons, MetaBalls, ScrambleText, GlitchText, PixelCard, Cubes, CountUp
  * Brutalist / high-contrast-bw: prefer ASCIIText, TextPressure, GradualBlur, Noise, FuzzyText, PixelTransition, BounceCards
  * Minimal / light-subtle: prefer FadeContent, LogoLoop, Counter, Stepper, AnimatedList, BlurText, TrueFocus, GlassSurface
  * Colorful / playful: prefer BounceCards, MagicBento, GlassIcons, Folder, StarBorder, ClickSpark, Cubes
- Choose components that match this client's industry and aesthetic — make each project feel uniquely tailored

RULES FOR fonts:
- Must be real Google Fonts names. Safe choices: Inter, Space Grotesk, Playfair Display, Neue Haas Grotesk, IBM Plex Mono, DM Sans, DM Serif Display, Syne, Josefin Sans, Outfit, Plus Jakarta Sans, Bebas Neue, Anton, Cormorant Garamond, Instrument Serif, Montserrat, Raleway, Work Sans, Barlow, Archivo Black, Unbounded, Orbitron, Share Tech Mono, Oxanium, Rajdhani

RULES FOR colors:
- Must be valid hex codes (#rrggbb format)
- Match the colorStrategy: dark-bold-accent = dark bg + bright accent, light-subtle = off-white/cream bg + muted accent, high-contrast-bw = pure black/white + one accent, monochromatic = same hue family, colorful = vivid multi-color

RULES FOR pages (siteType determines default page structure):
- Landing → [{ id: "page-home", title: "Home", type: "home", componentIds: [], content: {...} }]
- Portfolio → home + work + about pages (each with their own content)
- SaaS → home + features pages (each with their own content)
- Agency → home + services + contact pages (each with their own content)

RULES FOR pages[n].content — fill fields relevant to each page type:
- home / Landing: fill pageTitle, tagline, valueProps (3-5 short benefits), sections (3-4: hero + features + cta)
- about: fill pageTitle, tagline, teamMembers (2-4 people with real names + roles), sections (about + team)
- services / features: fill pageTitle, tagline, services (3-5 items with name + 1-line description), sections
- contact: fill pageTitle, tagline, faqs (3 realistic Q&A pairs), sections (contact)
- work / custom: fill pageTitle, tagline, sections, leave teamMembers/services/faqs as []
- pageTitle must be a specific, punchy headline — NOT a generic page name like "Home" or "About Us"
- All text must be specific to this brand, industry, and client — no Lorem ipsum, no generic filler

RULES FOR projectName:
- Lowercase slug, no spaces or special chars, max 20 chars, based on brandName
- Must be unique and specific to this brand — do NOT use generic names like "studio-project", "brand-site", or "demo-site"
- Good format examples: "noir-atelier", "drift-labs", "arca-studio", "vela-motion", "crest-works"

RULES FOR projectPrompt:
- 2-3 sentences. First sentence: what the site is for and who it's for. Second: the key design goals. Third (optional): any specific feature or mood.
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 1.0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }]
    });

    let content = response.content[0].text;
    // Strip markdown code blocks if present
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse Claude response as JSON:");
      console.error(content);
      throw new Error(`JSON parse error: ${e.message}`);
    }

    // Validation
    const requiredKeys = ["clientBrief", "styleDirection", "designRules", "selectedComponentIds", "pages", "projectPrompt", "projectName"];
    for (const key of requiredKeys) {
      if (!data[key]) {
        console.warn(`[Validator] Missing required key: "${key}"`);
      }
    }

    // Component validation (Task 2.1)
    if (Array.isArray(data.selectedComponentIds)) {
      data.selectedComponentIds = data.selectedComponentIds.filter(id => {
        if (VALID_COMPONENT_IDS.has(id)) return true;
        console.warn(`[Validator] Unknown component ID removed: "${id}"`);
        return false;
      });
    }

    // Nav enforcement: multi-page sites must have exactly 1 nav component
    const NAV_COMPONENTS = [
      "Components/CardNav", "Components/StaggeredMenu", "Components/GooeyNav",
      "Components/Dock", "Components/PillNav", "Components/FlowingMenu",
    ];
    const NAV_BY_AESTHETIC = {
      Editorial:   "Components/CardNav",
      Minimal:     "Components/PillNav",
      Futuristic:  "Components/FlowingMenu",
      Brutalist:   "Components/StaggeredMenu",
      colorful:    "Components/GooeyNav",
    };
    const isMultiPage = Array.isArray(data.pages) && data.pages.length > 1;
    if (isMultiPage && Array.isArray(data.selectedComponentIds)) {
      const hasNav = data.selectedComponentIds.some(id => NAV_COMPONENTS.includes(id));
      if (!hasNav) {
        const navId = NAV_BY_AESTHETIC[archetype.aesthetic] || "Components/PillNav";
        data.selectedComponentIds.push(navId);
        console.warn(`[Validator] Multi-page site had no nav — injected ${navId}`);
      }
    }

    return data;
  } catch (err) {
    console.error(`Error in generateClient for ${archetype.name}:`, err.message);
    throw err;
  }
}

module.exports = {
  generateClient,
  VALID_COMPONENT_IDS
};
