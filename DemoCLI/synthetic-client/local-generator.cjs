'use strict';

// ─────────────────────────────────────────────────────────────
// Section A: Utility helpers
// ─────────────────────────────────────────────────────────────

function pick(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────
// Section B: Brand name data + generator
// ─────────────────────────────────────────────────────────────

const BRAND_POOLS = {
  automotive: {
    prefixes: ["Apex", "Arc", "Volt", "Peak", "Vex", "Surge", "Torq", "Grid", "Rev", "Flux", "Boost", "Nitro"],
    roots: ["Dynamics", "Racing", "Motors", "Drive", "Speed", "Works", "Performance", "Labs", "Tech", "Garage"],
    suffixes: ["Co", "Corp", "", "", "Industries"]
  },
  luxury: {
    single: [
      "Aurel", "Verdane", "Maison Colette", "Elwood & Sons", "Lormont", "Veyne",
      "Atelier Solis", "Maison Harel", "Casa Bellini", "Estève", "Cliveden",
      "Maison Voss", "Ardène", "Croisette", "Sable & Oak", "Maison Lautrec",
      "Derome", "Atelier Frey", "Veran & Co", "Chateau Elise"
    ]
  },
  studio: {
    single: [
      "Form Studio", "Basis Studio", "Arc Studio", "Void Works", "Adjacent",
      "Criterion Studio", "Outline", "Substrat", "Parallel Studio", "Method Co",
      "Signal Studio", "Ground Studio", "Field Work", "Syntax Studio", "Plane Co",
      "Bureau Adjacent", "Studio Null", "Fragment Works", "Order Studio", "Margin Co"
    ]
  },
  saas: {
    prefixes: ["Nova", "Hex", "Neo", "Core", "Edge", "Mesh", "Node", "Layer", "Rift", "Axiom", "Prism", "Kode"],
    roots: ["Labs", "Systems", "Protocol", "Stack", "Net", "Grid", "Flow", "IO", "AI", "Works", "HQ", "Base"],
    suffixes: ["", "", ".io", " HQ", " Labs"]
  },
  food: {
    single: [
      "Origin Coffee", "Plot Roasters", "Silo Coffee", "Common Ground", "Sunday Roast Co",
      "Velle", "Terroir Coffee", "Press Coffee", "The Local Roast", "Grounds & Co",
      "Harvest Roasters", "Ritual Coffee", "Slate Coffee", "Tandem Coffee",
      "Counter Culture", "Fellow Roasters", "Onyx Coffee", "Verve Coffee", "Parlor Coffee"
    ]
  },
  fashion: {
    single: [
      "Vestige", "Forme Studio", "Adjacent Apparel", "Halo Stitch", "Remnant",
      "Seam Studio", "Layered", "Canvas Apparel", "Warp Studio", "Recto",
      "Substrate Label", "The Slow Edit", "Offgrain", "Nuage", "Verso",
      "Unthread", "Draft Studio", "Selvedge", "Mineral Label", "Bloc Apparel"
    ]
  },
  music: {
    single: [
      "Frequency Records", "Static Collective", "Null Records", "Tone Works",
      "Monolith Music", "Signal Records", "White Noise Collective", "Phase Label",
      "Waveform Records", "Resonant", "Dub Works", "Pulse Label", "Circuit Records",
      "Void Collective", "Sub Frequency", "Dispatch Audio", "Dark Matter Records"
    ]
  },
  professional: {
    prefixes: ["Meridian", "Atlas", "Summit", "Arcadia", "Vantage", "Beacon", "Crest", "Apex", "Veritas", "Nexus"],
    roots: ["Capital", "Partners", "Advisory", "Group", "Legal", "Counsel", "Associates", "Law", "Ventures"],
    suffixes: ["", " & Co", " LLP", " LLC", " Group"]
  }
};

const ARCHETYPE_INDUSTRY = {
  "LuxuryWatch":        "luxury",
  "RacingStore":        "automotive",
  "BrutalistPortfolio": "studio",
  "MinimalStudio":      "studio",
  "CyberpunkSaaS":      "saas",
  "PhotographyBook":    "studio",
  "CoffeeShop":         "food",
  "PunkLabel":          "music",
  "LawFirm":            "professional",
  "WellnessClinic":     "professional",
  "IndieGameStudio":    "saas",
  "FashionBrand":       "fashion",
  "ArchitectureFirm":   "studio",
  "DeFiProtocol":       "saas",
  "StreetArtCo":        "studio",
  "FitnessApp":         "saas",
  "FineRestaurant":     "food",
  "BoutiqueRealty":     "professional",
  "MusicProducer":      "music",
  "SustainableFashion": "fashion"
};

function generateBrandName(archetype) {
  const category = ARCHETYPE_INDUSTRY[archetype.name] || "studio";
  const pool = BRAND_POOLS[category];
  if (pool.single) return pick(pool.single);
  const prefix = pick(pool.prefixes);
  const root   = pick(pool.roots);
  const suffix = pick(pool.suffixes);
  return [prefix, root, suffix].filter(Boolean).join(" ").trim();
}

function generateProjectName(brandName) {
  return brandName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20)
    .replace(/-$/, '');
}

// ─────────────────────────────────────────────────────────────
// Section C: Color palette tables
// ─────────────────────────────────────────────────────────────

const COLOR_PALETTES = {
  "dark-bold-accent": [
    { bg: "#0a0a0f", text: "#e8e8f0", accent: "#ff3d6b" },
    { bg: "#050810", text: "#d0e4ff", accent: "#00f5ff" },
    { bg: "#080a0e", text: "#e0f0e8", accent: "#39ff14" },
    { bg: "#0c0810", text: "#f0e0ff", accent: "#bf00ff" },
    { bg: "#0f0a00", text: "#ffe8c0", accent: "#ff6b00" },
    { bg: "#06090f", text: "#c8d8ff", accent: "#4d79ff" },
    { bg: "#0a0f08", text: "#e8f0e0", accent: "#00ff88" },
  ],
  "light-subtle": [
    { bg: "#fafafa", text: "#111111", accent: "#d4a853" },
    { bg: "#f5f3ee", text: "#1a1a1a", accent: "#8b4513" },
    { bg: "#f8f6f1", text: "#222222", accent: "#c8392b" },
    { bg: "#f0f4f8", text: "#1e2a38", accent: "#4a90d9" },
    { bg: "#faf8f3", text: "#2d2d2d", accent: "#6b8c6b" },
    { bg: "#f7f5f2", text: "#333333", accent: "#9b6b9b" },
    { bg: "#f4f4f0", text: "#1a1a1a", accent: "#c0a86b" },
  ],
  "high-contrast-bw": [
    { bg: "#ffffff", text: "#000000", accent: "#ff2200" },
    { bg: "#000000", text: "#ffffff", accent: "#ffff00" },
    { bg: "#f5f5f5", text: "#0a0a0a", accent: "#0066cc" },
    { bg: "#000000", text: "#f0f0f0", accent: "#ff6600" },
    { bg: "#ffffff", text: "#111111", accent: "#00aa44" },
    { bg: "#0a0a0a", text: "#f5f5f5", accent: "#cc00cc" },
  ],
  "monochromatic": [
    { bg: "#0a1628", text: "#c8d8f0", accent: "#3d8eff" },
    { bg: "#0f1f12", text: "#c0d8c4", accent: "#4caf6e" },
    { bg: "#1a0810", text: "#f0c8d0", accent: "#c0394a" },
    { bg: "#1a1a0f", text: "#f0f0c8", accent: "#b8a020" },
    { bg: "#0f0f1a", text: "#c8c8f0", accent: "#6060d0" },
    { bg: "#f0f0f0", text: "#1a1a1a", accent: "#888888" },
    { bg: "#1f1510", text: "#f0e0c8", accent: "#c89040" },
  ],
  "colorful": [
    { bg: "#1a1a2e", text: "#ffffff", accent: "#e94560" },
    { bg: "#0d1b2a", text: "#f0f0f0", accent: "#ff6b35" },
    { bg: "#2d1b69", text: "#e8e8ff", accent: "#f6ff00" },
    { bg: "#0f2027", text: "#ffffff", accent: "#48cfad" },
    { bg: "#1a0a2e", text: "#f0e0ff", accent: "#ff00aa" },
    { bg: "#0a1a0a", text: "#e0ffe0", accent: "#00ff66" },
  ]
};

function pickColors(colorStrategy) {
  const pool = COLOR_PALETTES[colorStrategy] || COLOR_PALETTES["light-subtle"];
  const p = pick(pool);
  return [
    { value: p.bg,     role: "background" },
    { value: p.text,   role: "text" },
    { value: p.accent, role: "accent" }
  ];
}

// ─────────────────────────────────────────────────────────────
// Section D: Font pairing tables
// ─────────────────────────────────────────────────────────────

const FONT_PAIRINGS = {
  "Minimal": [
    { heading: "Inter",             body: "DM Sans" },
    { heading: "Plus Jakarta Sans", body: "Work Sans" },
    { heading: "Outfit",            body: "Barlow" },
    { heading: "DM Sans",           body: "Inter" },
    { heading: "Work Sans",         body: "Plus Jakarta Sans" },
  ],
  "Editorial": [
    { heading: "Cormorant Garamond", body: "DM Sans" },
    { heading: "Playfair Display",   body: "Work Sans" },
    { heading: "Instrument Serif",   body: "Plus Jakarta Sans" },
    { heading: "DM Serif Display",   body: "Inter" },
    { heading: "Cormorant Garamond", body: "Raleway" },
  ],
  "Brutalist": [
    { heading: "Archivo Black", body: "Barlow" },
    { heading: "Anton",         body: "Work Sans" },
    { heading: "Bebas Neue",    body: "Montserrat" },
    { heading: "Unbounded",     body: "Barlow" },
    { heading: "Anton",         body: "DM Sans" },
  ],
  "Futuristic": [
    { heading: "Orbitron",   body: "Oxanium" },
    { heading: "Unbounded",  body: "Share Tech Mono" },
    { heading: "Rajdhani",   body: "IBM Plex Mono" },
    { heading: "Syne",       body: "Oxanium" },
    { heading: "Oxanium",    body: "Rajdhani" },
  ]
};

function pickFonts(aesthetic) {
  const pool = FONT_PAIRINGS[aesthetic] || FONT_PAIRINGS["Minimal"];
  const pair = pick(pool);
  return [
    { value: pair.heading, role: "heading" },
    { value: pair.body,    role: "body" }
  ];
}

// ─────────────────────────────────────────────────────────────
// Section E: Component selection tables
// ─────────────────────────────────────────────────────────────

const COMPONENT_COMBOS = {
  "Futuristic|Landing": [
    ["Backgrounds/Silk", "TextAnimations/SplitText", "Animations/SplashCursor", "Components/SpotlightCard", "TextAnimations/CountUp"],
    ["Backgrounds/Beams", "TextAnimations/GlitchText", "Components/MagicBento", "Animations/GlareHover"],
    ["Backgrounds/Aurora", "TextAnimations/DecryptedText", "Components/SpotlightCard", "Animations/PixelTrail"],
    ["Backgrounds/Threads", "TextAnimations/SplitText", "Components/Counter", "TextAnimations/GradientText", "Animations/SplashCursor"],
    ["Backgrounds/DotGrid", "TextAnimations/GlitchText", "Components/MagicBento", "TextAnimations/CountUp"],
    ["Backgrounds/Silk", "TextAnimations/DecryptedText", "Animations/GlareHover", "Components/TiltedCard", "TextAnimations/SplitText"],
  ],
  "Futuristic|SaaS": [
    ["Components/FlowingMenu", "TextAnimations/CountUp", "TextAnimations/SplitText", "Components/Stepper", "Animations/GlareHover", "Backgrounds/DotGrid"],
    ["Components/Dock", "TextAnimations/GradientText", "Components/SpotlightCard", "Components/MagicBento", "Animations/GlareHover"],
    ["Backgrounds/GridMotion", "TextAnimations/SplitText", "Components/Counter", "Components/Stepper"],
    ["Components/FlowingMenu", "TextAnimations/DecryptedText", "Components/MagicBento", "Animations/SplashCursor", "TextAnimations/CountUp"],
    ["Backgrounds/Beams", "TextAnimations/SplitText", "Components/SpotlightCard", "TextAnimations/GradientText"],
    ["Components/Dock", "Backgrounds/DotGrid", "Components/Stepper", "TextAnimations/GlitchText", "Animations/GlareHover", "TextAnimations/CountUp"],
  ],
  "Futuristic|Portfolio": [
    ["Components/FlowingMenu", "TextAnimations/SplitText", "Animations/ImageTrail", "Components/CircularGallery", "Backgrounds/Silk"],
    ["Components/Dock", "TextAnimations/GlitchText", "Components/MagicBento", "Animations/SplashCursor", "TextAnimations/DecryptedText"],
    ["Backgrounds/Aurora", "TextAnimations/SplitText", "Components/ScrollStack", "Animations/GlareHover"],
    ["Components/FlowingMenu", "TextAnimations/GradientText", "Components/TiltedCard", "Animations/PixelTrail", "Components/SpotlightCard"],
  ],
  "Futuristic|Agency": [
    ["Components/FlowingMenu", "Backgrounds/Beams", "TextAnimations/SplitText", "Components/Stepper", "Animations/GlareHover"],
    ["Components/Dock", "TextAnimations/GlitchText", "Components/MagicBento", "TextAnimations/CountUp", "Animations/SplashCursor"],
    ["Components/FlowingMenu", "Backgrounds/DotGrid", "TextAnimations/DecryptedText", "Components/AnimatedList", "Animations/GlareHover"],
  ],
  "Editorial|Landing": [
    ["Backgrounds/Silk", "TextAnimations/SplitText", "Components/RollingGallery", "Animations/GradualBlur"],
    ["TextAnimations/ScrollReveal", "Components/CircularGallery", "Animations/FadeContent", "TextAnimations/SplitText"],
    ["Backgrounds/Silk", "TextAnimations/SplitText", "Components/TiltedCard", "Animations/ImageTrail"],
    ["TextAnimations/BlurText", "Components/RollingGallery", "Animations/GradualBlur", "TextAnimations/SplitText"],
    ["Backgrounds/Threads", "TextAnimations/ScrollReveal", "Components/CircularGallery", "Animations/FadeContent"],
    ["TextAnimations/SplitText", "Components/TiltedCard", "Animations/GradualBlur", "TextAnimations/ScrollFloat"],
  ],
  "Editorial|Portfolio": [
    ["Components/CardNav", "TextAnimations/ScrollReveal", "Components/CircularGallery", "Animations/ImageTrail", "TextAnimations/SplitText"],
    ["Components/GooeyNav", "TextAnimations/SplitText", "Components/RollingGallery", "Animations/GradualBlur", "Components/TiltedCard"],
    ["Backgrounds/Silk", "TextAnimations/ScrollReveal", "Components/MagicBento", "Animations/FadeContent"],
    ["Components/CardNav", "TextAnimations/ScrollFloat", "Components/CircularGallery", "Animations/ImageTrail", "TextAnimations/BlurText"],
    ["Components/GooeyNav", "TextAnimations/SplitText", "Components/ScrollStack", "Animations/GradualBlur", "Components/TiltedCard"],
  ],
  "Editorial|Agency": [
    ["Components/CardNav", "TextAnimations/SplitText", "Components/AnimatedList", "Animations/GradualBlur", "TextAnimations/ScrollReveal"],
    ["Components/GooeyNav", "Backgrounds/Silk", "TextAnimations/ScrollReveal", "Components/Stepper", "Animations/FadeContent"],
    ["Components/CardNav", "TextAnimations/BlurText", "Components/AnimatedList", "Animations/GradualBlur", "Components/TiltedCard"],
    ["Components/GooeyNav", "TextAnimations/SplitText", "Components/RollingGallery", "Animations/FadeContent", "TextAnimations/ScrollReveal"],
  ],
  "Minimal|Landing": [
    ["TextAnimations/BlurText", "Animations/FadeContent", "Components/Counter", "Backgrounds/DotGrid"],
    ["TextAnimations/SplitText", "Animations/GradualBlur", "Components/SpotlightCard"],
    ["TextAnimations/SplitText", "Components/Counter", "Animations/FadeContent"],
    ["Backgrounds/DotGrid", "TextAnimations/BlurText", "Components/AnimatedList", "Animations/FadeContent"],
    ["TextAnimations/ScrollReveal", "Components/SpotlightCard", "Animations/GradualBlur"],
    ["TextAnimations/SplitText", "Animations/FadeContent", "Components/TiltedCard"],
  ],
  "Minimal|Agency": [
    ["Components/PillNav", "TextAnimations/SplitText", "Components/AnimatedList", "Animations/FadeContent", "Components/Stepper"],
    ["Components/Dock", "TextAnimations/ScrollReveal", "Components/Stepper", "Animations/GradualBlur"],
    ["Components/PillNav", "TextAnimations/BlurText", "Components/AnimatedList", "Animations/FadeContent"],
    ["Components/Dock", "TextAnimations/SplitText", "Components/SpotlightCard", "Animations/GradualBlur", "Components/Stepper"],
    ["Components/PillNav", "TextAnimations/ScrollReveal", "Components/AnimatedList", "Animations/FadeContent", "TextAnimations/SplitText"],
  ],
  "Minimal|Portfolio": [
    ["Components/PillNav", "TextAnimations/SplitText", "Components/CircularGallery", "Animations/FadeContent"],
    ["Components/Dock", "TextAnimations/BlurText", "Components/TiltedCard", "Animations/GradualBlur", "Components/RollingGallery"],
    ["Components/PillNav", "TextAnimations/ScrollReveal", "Components/CircularGallery", "Animations/FadeContent", "Components/ScrollStack"],
    ["Components/Dock", "TextAnimations/SplitText", "Components/RollingGallery", "Animations/GradualBlur"],
    ["Components/PillNav", "TextAnimations/BlurText", "Components/MagicBento", "Animations/FadeContent"],
  ],
  "Minimal|SaaS": [
    ["Components/PillNav", "TextAnimations/SplitText", "Components/Stepper", "Animations/FadeContent", "Components/Counter"],
    ["Components/Dock", "TextAnimations/ScrollReveal", "Components/AnimatedList", "Animations/GradualBlur", "Components/Stepper"],
    ["Components/PillNav", "TextAnimations/BlurText", "Components/SpotlightCard", "Animations/FadeContent", "Components/Counter"],
  ],
  "Brutalist|Landing": [
    ["TextAnimations/GlitchText", "Animations/ClickSpark", "Components/ScrollStack", "Backgrounds/DotGrid"],
    ["TextAnimations/ASCIIText", "Animations/SplashCursor", "TextAnimations/FallingText"],
    ["TextAnimations/GlitchText", "TextAnimations/ScrambleText", "Animations/ClickSpark", "Components/ScrollStack"],
    ["Backgrounds/Dither", "TextAnimations/GlitchText", "Animations/ClickSpark", "TextAnimations/FallingText"],
    ["TextAnimations/ASCIIText", "Animations/ClickSpark", "Components/ScrollStack"],
  ],
  "Brutalist|Portfolio": [
    ["Components/StaggeredMenu", "TextAnimations/GlitchText", "Components/ScrollStack", "Animations/SplashCursor", "TextAnimations/ScrambleText"],
    ["Components/Dock", "Backgrounds/DotGrid", "TextAnimations/ASCIIText", "Animations/ClickSpark", "Components/ScrollStack"],
    ["Components/StaggeredMenu", "TextAnimations/FallingText", "Animations/SplashCursor", "TextAnimations/GlitchText"],
    ["Components/Dock", "Backgrounds/Dither", "TextAnimations/ScrambleText", "Animations/ClickSpark", "Components/ScrollStack"],
    ["Components/StaggeredMenu", "TextAnimations/ASCIIText", "Components/ScrollStack", "Animations/SplashCursor", "TextAnimations/GlitchText"],
  ],
  "Brutalist|Agency": [
    ["Components/StaggeredMenu", "TextAnimations/GlitchText", "Components/AnimatedList", "Animations/ClickSpark"],
    ["Components/Dock", "Backgrounds/DotGrid", "TextAnimations/ScrambleText", "Components/ScrollStack", "Animations/ClickSpark"],
    ["Components/StaggeredMenu", "TextAnimations/ASCIIText", "Animations/SplashCursor", "Components/AnimatedList"],
  ],
};

function pickComponents(archetype) {
  const key = archetype.aesthetic + "|" + archetype.siteType;
  const combos = COMPONENT_COMBOS[key];
  if (!combos || combos.length === 0) {
    const fallbackKey = Object.keys(COMPONENT_COMBOS).find(k => k.startsWith(archetype.aesthetic));
    return fallbackKey
      ? pick(COMPONENT_COMBOS[fallbackKey])
      : ["TextAnimations/SplitText", "Animations/FadeContent", "Components/Counter"];
  }
  return pick(combos);
}

// ─────────────────────────────────────────────────────────────
// Section F: Copy tables (all 20 archetypes)
// ─────────────────────────────────────────────────────────────

const COPY_POOLS = {

  "LuxuryWatch": {
    taglines: [
      "Time, perfected.",
      "A century of craft. A lifetime of wear.",
      "Precision is not a feature. It is a philosophy.",
      "The hands never rest. Neither do we.",
    ],
    industries: ["Luxury Horology", "Fine Watchmaking", "Swiss Timepieces"],
    tones: ["Refined", "Authoritative", "Understated"],
    personalities: ["Meticulous", "Heritage-driven", "Quietly exclusive"],
    descriptions: [
      "{brand} is a multi-generation watchmaker based in Switzerland, renowned for hand-finishing every movement. The Legacy collection represents 100 years of accumulated horological knowledge, released as a limited series of 50 pieces.",
      "{brand} has been crafting mechanical watches since the early twentieth century. Each piece is built to a tolerance of a few seconds per day — not because it must be, but because it can be.",
      "{brand} does not advertise. It does not need to. The 180 watchmakers who build each piece are their only spokespeople.",
    ],
    usps: [
      "Every movement is assembled and regulated by a single master watchmaker — not a production line.",
      "A lifetime service guarantee: we service any watch bearing our name, regardless of age.",
      "Each piece is certified accurate to ±2 seconds per day by independent horological authority.",
    ],
    services: [
      "Bespoke commission pieces\nLimited collection releases\nLifetime service & restoration\nPrivate consultation by appointment",
      "Heritage collection viewing\nMovement overhaul & restoration\nEngravings & personalisation\nGlobal private delivery",
    ],
    benefits: [
      "Handcrafted Swiss movement\nLifetime servicing included\nLimited to 50 pieces worldwide\nAuthenticity certificate with each piece",
      "Single-watchmaker construction\nCertified ±2s/day accuracy\nHeritage archive documentation\n25-year movement warranty",
    ],
    targetAudiences: [
      "Collectors and connoisseurs of haute horology",
      "High-net-worth individuals who value heritage over trend",
      "Watch investors seeking limited-edition movements with provenance",
    ],
    ctas: ["View the Legacy Collection", "Request a Private Viewing", "Discover the Collection", "Enquire About Acquisition"],
    audiences: ["Luxury collectors, 40–65, global", "HNW watch collectors, 35–70, Europe & Asia"],
    typographyIntensity: "dramatic",
    visualEffects: ["parallax scroll", "subtle grain overlay"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "RacingStore": {
    taglines: [
      "Built for the track. Sold to obsessives.",
      "Every millisecond matters. So does every part.",
      "Performance without compromise.",
      "Race-spec parts. Street-legal attitude.",
    ],
    industries: ["Automotive Performance Retail", "Motorsport Parts", "High-Performance Automotive"],
    tones: ["Technical", "Aggressive", "Direct"],
    personalities: ["Obsessive about performance", "No-nonsense", "Track-proven"],
    descriptions: [
      "{brand} supplies serious drivers with the aftermarket components they need to extract every last tenth from their car. From turbo kits to suspension geometry, every product is tested at the track before it reaches the storefront.",
      "{brand} started in a garage and never really left. A team of actual racers curating and testing every part they sell — if it doesn't perform, it doesn't make the catalogue.",
      "{brand} is run by people who race. Every product listing comes with telemetry data from our own test sessions. We don't list anything we wouldn't bolt on ourselves.",
    ],
    usps: [
      "Every product is track-tested by our in-house racing team before listing.",
      "Same-day dispatch on in-stock parts — because race weekends don't wait.",
      "Our engineers answer the phone. No bots, no scripts, no 48-hour wait.",
    ],
    services: [
      "Aftermarket turbo kits\nSuspension geometry setup\nRacing harness & cage components\nPerformance data consultation",
      "Turbocharger installation\nDyno tuning & mapping\nData logging setup\nTrack prep packages",
    ],
    benefits: [
      "Track-tested by our own racing team\nFree tech support with every order\nSame-day dispatch on in-stock items\nCompatibility guarantee or full refund",
      "Telemetry-backed product data\nEngineer on the phone\nParts tested under race conditions\n30-day no-questions return",
    ],
    targetAudiences: [
      "Amateur and semi-pro track day drivers",
      "Motorsport enthusiasts building performance vehicles",
      "Club racers upgrading from stock to competitive specification",
    ],
    ctas: ["Browse Performance Parts", "Find Your Upgrade", "Shop by Category", "View Track-Tested Parts"],
    audiences: ["Motorsport enthusiasts, 22–45, performance-focused", "Track day drivers, 25–50, UK & Europe"],
    typographyIntensity: "dramatic",
    visualEffects: ["motion blur", "scanlines"],
    optimizationTarget: "desktop",
    spacingScale: "comfortable",
    borderRadius: "small",
  },

  "BrutalistPortfolio": {
    taglines: [
      "Design that doesn't apologise.",
      "Ugly is a system default. This is not default.",
      "Against polish. For honesty.",
      "Raw work. No filters.",
    ],
    industries: ["Graphic Design", "Visual Communication", "Art Direction"],
    tones: ["Confrontational", "Unapologetic", "Direct"],
    personalities: ["Anti-establishment", "Visually aggressive", "Conceptually precise"],
    descriptions: [
      "{brand} is the studio of a graphic designer who believes that most design is cowardly. The work breaks compositional rules on purpose — not carelessly, but with total intent.",
      "{brand} takes briefs from clients who are done with safe. The portfolio exists to show what happens when you remove every aesthetic comfort zone and start from the structure of the thing.",
      "No soft grids. No palatable color theory. {brand} is for brands that want to be remembered for the right reasons — or at least, the memorable ones.",
    ],
    usps: [
      "We have turned down more safe briefs than we've accepted. That's not a problem. That's the filter.",
      "Every deliverable ships with a 3-hour explanation call. You will understand why every decision was made.",
    ],
    services: [
      "Brand identity systems\nPrint & editorial design\nDigital typographic systems\nArt direction for campaigns",
      "Visual identity from scratch\nTypeface selection & pairing\nPoster & publication design\nCollateral system design",
    ],
    benefits: [
      "Work that gets remembered\nFull creative ownership per brief\nNo committees — one decision-maker\nSingle point of contact, always",
      "Portfolio-calibre output per brief\nProcess documentation included\nRevisions delivered with rationale\nSource files always provided",
    ],
    targetAudiences: [
      "Brands who want to stand out, not blend in",
      "Creative directors at companies who have outgrown generic design agencies",
      "Founders and artists who want work with a real point of view",
    ],
    ctas: ["View the Work", "See Selected Projects", "Start a Brief"],
    audiences: ["Creative directors, 28–45, design-literate", "Founders & startups with cultural ambition"],
    typographyIntensity: "experimental",
    visualEffects: ["raw texture", "high contrast flash"],
    optimizationTarget: "desktop",
    spacingScale: "compact",
    borderRadius: "none",
  },

  "MinimalStudio": {
    taglines: [
      "Less, but better.",
      "Design is the removal of doubt.",
      "Clarity by design.",
      "The quiet kind of excellence.",
    ],
    industries: ["UX Design", "Product Design", "Interface Design"],
    tones: ["Considered", "Precise", "Calm"],
    personalities: ["Detail-obsessed", "Systems thinker", "Anti-decoration"],
    descriptions: [
      "{brand} is a boutique UX design studio that believes the best interfaces are invisible. Every pixel has a reason. Every interaction is deliberate. The studio takes on 4 projects per quarter.",
      "{brand} works at the intersection of function and restraint. The studio specialises in onboarding flows, design systems, and product interfaces for SaaS companies who have outgrown their MVP design.",
      "The team at {brand} is small by design. Three designers. No project managers. Every client works directly with the people doing the work.",
    ],
    usps: [
      "We take on 4 projects per quarter. You will have our full attention.",
      "Every interface we design ships with a living design system — not a static Figma file.",
    ],
    services: [
      "UX strategy & research\nInterface design & prototyping\nDesign system creation\nProduct audit & redesign",
      "User journey mapping\nInteraction design\nComponent library documentation\nHandoff support for engineering teams",
    ],
    benefits: [
      "Direct access to your lead designer\nDesign system included in every project\nDocumented interaction patterns\nHandoff support with engineering",
      "Small team, full attention\nShip-ready deliverables\nAccessibility by default\nOngoing retainer available",
    ],
    targetAudiences: [
      "SaaS founders building post-MVP product",
      "Product teams who need a design system, not just a UI layer",
      "Companies with a good product and an interface that doesn't do it justice",
    ],
    ctas: ["See Our Work", "View Case Studies", "Start a Conversation"],
    audiences: ["SaaS product teams, 28–45, design-aware", "Tech founders, post-seed to Series B"],
    typographyIntensity: "subtle",
    visualEffects: ["subtle fade", "whitespace rhythm"],
    optimizationTarget: "adaptive",
    spacingScale: "spacious",
    borderRadius: "medium",
  },

  "CyberpunkSaaS": {
    taglines: [
      "Edge infrastructure for the next internet.",
      "Zero latency. No limits.",
      "The compute layer your product deserves.",
      "Fast by default. Scalable by design.",
    ],
    industries: ["Developer Infrastructure", "AI Platform", "Edge Computing"],
    tones: ["Technical", "Precise", "Forward-looking"],
    personalities: ["Builder-first", "Performance-obsessed", "No marketing speak"],
    descriptions: [
      "{brand} provides low-latency edge inference infrastructure for AI applications. Sub-10ms response at the 99th percentile, globally distributed, with a developer experience that doesn't require a sales call to get started.",
      "{brand} is an edge AI platform built by infrastructure engineers for infrastructure engineers. No dashboards you don't need. No pricing tiers designed to confuse. Just compute, fast.",
      "Teams at {brand} have collectively shipped hundreds of distributed systems. The platform exists because they were tired of the alternative.",
    ],
    usps: [
      "P99 latency under 10ms from any region — backed by SLA.",
      "One API key, global deployment. No region configuration required.",
    ],
    services: [
      "Edge inference API\nModel hosting & routing\nVector database integration\nUsage-based billing dashboard",
      "Serverless function deployment\nGlobal load balancing\nCustom model fine-tuning\nEnterprise SLA & support",
    ],
    benefits: [
      "Sub-10ms P99 globally\nSDKs for every major language\nPay only for what you use\n99.99% uptime SLA",
      "No cold starts\nZero-config global deployment\nDirect Slack support channel\nMonthly usage credits for open-source projects",
    ],
    targetAudiences: [
      "AI engineers building latency-sensitive applications",
      "Developer teams shipping production AI features",
      "Infrastructure leads at Series A–C startups",
    ],
    ctas: ["Start Building", "View the Docs", "Get API Access", "Read the Benchmark"],
    audiences: ["AI/ML engineers, 24–40, global", "Senior developers at funded startups"],
    typographyIntensity: "dramatic",
    visualEffects: ["grid glow", "terminal flicker", "scanlines"],
    optimizationTarget: "desktop",
    spacingScale: "comfortable",
    borderRadius: "small",
  },

  "PhotographyBook": {
    taglines: [
      "The city doesn't look back. The camera does.",
      "Photographs made to outlast their subjects.",
      "Stillness in a moving world.",
      "What remains when everything else moves.",
    ],
    industries: ["Fine Art Photography", "Gallery Representation", "Photo Publishing"],
    tones: ["Meditative", "Observational", "Uncompromising"],
    personalities: ["Solitary", "Exacting", "Quietly confrontational"],
    descriptions: [
      "{brand} is the portfolio of a fine-art photographer working in long-exposure urban documentary. The current series — shot over four years across twelve cities — captures the texture of isolation in dense populations.",
      "{brand} documents what most people walk past. Ten years of editorial photography have produced a visual vocabulary that is unmistakable: high contrast, long exposure, the precise moment before something changes.",
      "The work of {brand} exists in two places: on gallery walls and in photobooks. This site is the point of contact between the work and the people who are supposed to find it.",
    ],
    usps: [
      "Each print is hand-signed, edition-numbered, and sold through the studio only — never through a third-party gallery.",
      "Every image in the portfolio was shortlisted or placed in competition. None were included as filler.",
    ],
    services: [
      "Limited edition print sales\nPrivate collection commissions\nEditorial licensing\nExhibition & installation work",
      "Portfolio book production\nCommissioned documentary projects\nArchival print restoration\nGallery consultation",
    ],
    benefits: [
      "Signed, numbered editions only\nArchival pigment inks on museum-grade paper\nCertificate of authenticity with each print\nGlobal shipping with specialist framing",
      "Studio-direct purchasing\nNo third-party gallery margins\nDirect correspondence with the artist\nPayment plans available for large editions",
    ],
    targetAudiences: [
      "Art collectors acquiring photographic work",
      "Gallery curators building documentary photography collections",
      "Editorial publications seeking licensing for contemporary urban work",
    ],
    ctas: ["View the Series", "Browse Available Prints", "Enquire About Licensing"],
    audiences: ["Art collectors & curators, 35–65, global", "Editorial photo buyers, design-literate"],
    typographyIntensity: "dramatic",
    visualEffects: ["slow reveal", "grain overlay"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "CoffeeShop": {
    taglines: [
      "Single origin. No shortcuts.",
      "The farm is the beginning of the recipe.",
      "Roasted with intent. Brewed with care.",
      "Every bag has a name. And a story.",
    ],
    industries: ["Specialty Coffee", "Sustainable Roasting", "Direct Trade Coffee"],
    tones: ["Warm", "Knowledgeable", "Unpretentious"],
    personalities: ["Curious", "Producer-focused", "Accessible but expert"],
    descriptions: [
      "{brand} sources single-origin beans from a network of 14 farms across Ethiopia, Colombia, and Guatemala, each one visited annually by the team. The roasting is light to medium — preserving origin character, not masking it.",
      "{brand} was built around a simple question: what happens if you take the same care with coffee sourcing as fine wine? The answer is in the cup. Traceability from farm to bag, roasted on-site in small batches weekly.",
      "The team at {brand} visits every farm they source from. Not to take photographs for the bag. To understand what the producer is trying to grow, and to roast in a way that respects it.",
    ],
    usps: [
      "100% direct trade — every producer is listed by name on the bag.",
      "Weekly small-batch roasts. Beans are shipped within 3 days of roast date.",
    ],
    services: [
      "Single-origin retail bags (250g / 500g / 1kg)\nSubscription roast boxes\nCafe wholesale supply\nPrivate label roasting",
      "Monthly curated subscription\nCafe-grade wholesale bags\nFarm-to-cup tasting events\nCommercial espresso consultation",
    ],
    benefits: [
      "Roasted within 72 hours of dispatch\nFarm traceability on every bag\nSubscriptions ship bi-weekly\nFree UK delivery on orders over £30",
      "Light-to-medium roast only\nProducer name on every label\nNo blends — origin only\nCompostable packaging throughout",
    ],
    targetAudiences: [
      "Specialty coffee enthusiasts brewing at home",
      "Independent cafe owners looking for a traceable wholesale partner",
      "Consumers who want to know where their food comes from",
    ],
    ctas: ["Shop the Roasts", "Start a Subscription", "View Current Origins", "Browse This Month's Harvest"],
    audiences: ["Specialty coffee consumers, 25–45, urban", "Independent cafe owners, UK & Europe"],
    typographyIntensity: "subtle",
    visualEffects: ["warm grain", "soft parallax"],
    optimizationTarget: "adaptive",
    spacingScale: "comfortable",
    borderRadius: "medium",
  },

  "PunkLabel": {
    taglines: [
      "No algorithm. No rotation. No apology.",
      "We press, pack, and post it ourselves.",
      "From the floor. To the floor.",
      "Underground stays underground.",
    ],
    industries: ["Independent Music", "DIY Record Label", "Noise & Punk"],
    tones: ["Blunt", "Confrontational", "Loyal"],
    personalities: ["Fiercely independent", "Anti-commercial", "Community-first"],
    descriptions: [
      "{brand} is a DIY record label run out of a basement in East London. Seven bands. Two staff. Vinyl only. The label doesn't pitch to playlists or apply for sync licences. It releases music it believes in and leaves the rest alone.",
      "{brand} releases music that doesn't fit anywhere else. Experimental noise, post-punk, and whatever comes next. Distribution is direct. Promotion is word of mouth. That's the point.",
      "The roster at {brand} has never charted. It has also never compromised. The bands on this label choose it over larger offers because they know the work will be treated as work, not product.",
    ],
    usps: [
      "Physical releases only. No streaming exclusives. No algorithm-dependent revenue.",
      "Every band on the roster retains full ownership of their masters — always.",
    ],
    services: [
      "Vinyl & cassette pressing\nPhysical distribution & direct mail\nLive show production\nArtist management (select roster)",
      "Limited run pressings\nDIY zine & merchandise production\nGig booking & tour support\nRecording referral network",
    ],
    benefits: [
      "Artist retains 100% master ownership\nLimited press runs — no excess stock\nDirect-to-fan mail order only\nNo streaming, no algorithms",
      "No label fee — split-cost model\nArtist approval on all releases\nHand-numbered vinyl editions\nZine included with first pressing",
    ],
    targetAudiences: [
      "Underground music fans who buy physical releases",
      "Bands who want a label that treats their work like art, not inventory",
      "Record collectors seeking limited runs and hand-numbered editions",
    ],
    ctas: ["Browse Releases", "View the Roster", "Order Direct", "Get in Touch"],
    audiences: ["Underground music fans, 20–40, UK & EU", "Noise/punk record collectors, any age"],
    typographyIntensity: "experimental",
    visualEffects: ["xerox grain", "harsh contrast"],
    optimizationTarget: "mobile",
    spacingScale: "compact",
    borderRadius: "none",
  },

  "LawFirm": {
    taglines: [
      "Protecting what you've built.",
      "Intellectual property, actually defended.",
      "Law that keeps pace with technology.",
      "Your IP is the product. We protect it.",
    ],
    industries: ["Intellectual Property Law", "Technology Law", "Startup Legal"],
    tones: ["Assured", "Accessible", "Precise"],
    personalities: ["Strategically direct", "Tech-literate", "Partner-level from day one"],
    descriptions: [
      "{brand} is an intellectual property law firm specialising in technology and software companies. The team handles patents, trademarks, trade secrets, and licensing for clients from pre-seed to post-IPO.",
      "{brand} was founded by lawyers who worked in tech before law. They understand what you're building, what it's worth, and how to protect it. No six-week onboarding. No hourly mystery billing.",
      "The firm works with 60 clients at any one time. Not 600. Every client has a named partner on their account who answers their own email.",
    ],
    usps: [
      "Fixed-fee project billing — no billing surprises, ever.",
      "Our founding partners have software engineering backgrounds. We understand the technical details without you having to explain them.",
    ],
    services: [
      "Patent prosecution & filing\nTrademark registration & defence\nIP licensing & commercial agreements\nStartup IP strategy packages",
      "Trade secret protection\nSoftware copyright registration\nIP due diligence for investment rounds\nDispute resolution & litigation",
    ],
    benefits: [
      "Fixed-fee billing on all projects\nResponses within 1 business day\nNamed partner on every account\nTech-background founding team",
      "Plain English explanations always\nStartup-friendly payment terms\nIP portfolio management dashboard\nMonthly IP strategy review",
    ],
    targetAudiences: [
      "Technology startups building defensible IP",
      "Founders preparing for investment rounds who need IP in order",
      "Scale-up companies with international filing requirements",
    ],
    ctas: ["Get an IP Audit", "Book a Strategy Call", "Explore Our Services"],
    audiences: ["Tech founders, 27–45, UK & US", "CTOs and GCs at funded startups"],
    typographyIntensity: "subtle",
    visualEffects: ["clean transition", "structural reveal"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "small",
  },

  "WellnessClinic": {
    taglines: [
      "Whole-body medicine. No shortcuts.",
      "Treat the cause. Not just the symptom.",
      "Ancient practice. Evidence-based approach.",
      "Balance is the outcome. Not the concept.",
    ],
    industries: ["Integrative Medicine", "Holistic Health", "Functional Nutrition"],
    tones: ["Calm", "Knowledgeable", "Grounded"],
    personalities: ["Unhurried", "Science-backed", "Patient-centred"],
    descriptions: [
      "{brand} is an integrative health clinic offering acupuncture, functional nutrition, and herbal medicine protocols developed over 20 years of clinical practice. Every patient receives a 90-minute initial consultation.",
      "{brand} bridges traditional Chinese medicine with functional health testing. The clinic uses bloodwork, microbiome analysis, and symptom mapping alongside classical diagnostic methods to build protocols that address root causes.",
      "The practitioners at {brand} operate on a simple principle: the body is one system. Treating it in parts is why so many people are still unwell after years of specialist care.",
    ],
    usps: [
      "90-minute intake consultations. We take your history seriously before suggesting a single protocol.",
      "Integrated pathology: we work with your existing medical team, not around them.",
    ],
    services: [
      "Acupuncture & moxibustion\nFunctional nutrition consulting\nHerbal medicine protocols\nMindfulness & breathwork sessions",
      "Gut health & microbiome testing\nHormone & adrenal assessment\nSleep & stress protocol design\nOngoing wellness monitoring",
    ],
    benefits: [
      "90-minute initial consultation\nPersonalised treatment protocol\nMonthly progress reviews included\nCo-operative care with your GP",
      "Root-cause approach always\nNo supplement upselling\nEvidence-reviewed protocols\nQualified practitioners, 10+ years each",
    ],
    targetAudiences: [
      "Patients with chronic conditions who haven't found resolution through conventional care",
      "Health-conscious adults seeking preventative, whole-body approaches",
      "Professionals managing stress, fatigue, and burnout holistically",
    ],
    ctas: ["Book a Consultation", "View Our Approach", "Speak to a Practitioner"],
    audiences: ["Adults 30–65 with health-conscious outlook", "Chronic illness patients seeking integrative care"],
    typographyIntensity: "subtle",
    visualEffects: ["gentle fade", "warm light"],
    optimizationTarget: "adaptive",
    spacingScale: "spacious",
    borderRadius: "large",
  },

  "IndieGameStudio": {
    taglines: [
      "Built in the dark. Released into the neon.",
      "Play the world we couldn't stop imagining.",
      "A game made by people who couldn't find the one they wanted.",
      "Synthwave. Narrative. Zero hand-holding.",
    ],
    industries: ["Indie Game Development", "Interactive Entertainment", "Narrative Games"],
    tones: ["Atmospheric", "Enthusiastic", "Authentic"],
    personalities: ["Passionate", "Community-first", "Transparent about development"],
    descriptions: [
      "{brand} is a three-person studio building a synthwave-influenced narrative adventure set in a city that runs on memory and light. The game has been in development for 18 months and hits Early Access next quarter.",
      "{brand} makes the games they couldn't find in existing catalogues. The current title is part mystery, part rhythm puzzle, entirely hand-drawn. The soundtrack was composed before the first line of code was written.",
      "The team at {brand} streams every development session and publishes weekly devlogs. The community has been involved since prototype. The game reflects that.",
    ],
    usps: [
      "Community-voted story branches — players shape the world in every major update.",
      "Original hand-drawn art and a full synthwave soundtrack from a commissioned composer.",
    ],
    services: [
      "Game Early Access purchase\nSoundtrack & art book bundle\nDeveloper community membership\nPhysical collector's edition (limited)",
      "Wishlist & follow on Steam\nPatreon development access\nLive stream Q&A sessions\nExclusive beta build for supporters",
    ],
    benefits: [
      "Original hand-drawn art throughout\nFull synthwave OST included\nCommunity-influenced story branches\nNo lootboxes, no DLC grind",
      "Early Access with guaranteed completion\nWeekly devlog transparency\nLifetime updates post-launch\nDirect Discord with the dev team",
    ],
    targetAudiences: [
      "Fans of narrative indie games with strong visual identity",
      "Synthwave & retrowave culture enthusiasts",
      "Gamers who support small studios and early access development",
    ],
    ctas: ["Add to Wishlist", "Join the Community", "Play the Demo", "Follow Development"],
    audiences: ["Indie game enthusiasts, 18–35, global", "Narrative game players, Steam platform"],
    typographyIntensity: "dramatic",
    visualEffects: ["neon glow", "scanline flicker", "motion blur"],
    optimizationTarget: "desktop",
    spacingScale: "comfortable",
    borderRadius: "small",
  },

  "FashionBrand": {
    taglines: [
      "Clothing that has somewhere to be.",
      "Form before function. Always.",
      "Dressed for a world that doesn't exist yet.",
      "The collection is a question. Wear it.",
    ],
    industries: ["Avant-Garde Fashion", "Conceptual Apparel", "High Fashion"],
    tones: ["Cryptic", "Authoritative", "Aesthetic-first"],
    personalities: ["Concept-driven", "Deliberately obscure", "Unapologetically exclusive"],
    descriptions: [
      "{brand} is an avant-garde fashion house releasing two collections per year. Each collection begins as a conceptual text — a film, a philosophy, a system — and the garments are the answer to the questions it poses.",
      "{brand} makes clothing for people who read the credits. Every season is a document of where fashion and art intersect. The fit is architectural. The intention is absolute.",
      "The studio behind {brand} has no press office. The work speaks without amplification. Each piece is cut in-house, run in editions of 20, and sold through this site and one stockist per territory.",
    ],
    usps: [
      "Every garment is cut in-house in editions of 20. Once sold, it doesn't return.",
      "Each season is accompanied by a printed text — the concept behind the collection.",
    ],
    services: [
      "Ready-to-wear seasonal collection\nBespoke commission (by appointment)\nPrinted concept book per season\nStyling consultation for editorial",
      "Seasonal drops (2 per year)\nLimited re-editions of archive pieces\nDirector styling collaboration\nGlobal direct shipping only",
    ],
    benefits: [
      "Maximum edition of 20 per piece\nIn-house cutting & construction\nSeasonal concept text included\nNo wholesale — studio direct only",
      "Archive access for collectors\nPhotographic documentation per piece\nRepair & alteration service\nLifetime re-edition eligibility",
    ],
    targetAudiences: [
      "Fashion collectors with interest in concept-driven garment design",
      "Cultural figures in art, architecture, and media",
      "Buyers seeking garments with intellectual and aesthetic permanence",
    ],
    ctas: ["Enter the Collection", "View This Season", "Enquire About Commission"],
    audiences: ["High-fashion consumers, 28–50, global cultural centres", "Art-adjacent fashion collectors"],
    typographyIntensity: "dramatic",
    visualEffects: ["editorial slow scroll", "cinematic fade"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "ArchitectureFirm": {
    taglines: [
      "Buildings that earn their place.",
      "Light is the first material.",
      "Structure as civic responsibility.",
      "We design where people live their lives.",
    ],
    industries: ["Sustainable Architecture", "Urban Design", "Civic Architecture"],
    tones: ["Considered", "Civic-minded", "Precise"],
    personalities: ["Detail-obsessed", "Material-first", "Socially responsible"],
    descriptions: [
      "{brand} is an international architecture firm focused on sustainable landmarks for public and civic use. The practice has completed 34 projects across 11 countries, each documented for environmental impact over its first decade of use.",
      "{brand} works on the premise that every building displaces something: light, views, air, community. The design process begins by accounting for those displacements before a single structural decision is made.",
      "The practice at {brand} is known for its use of local materials and passive environmental systems. Every project is different. The method is always the same: understand the site before you impose on it.",
    ],
    usps: [
      "Every project ships with a 10-year environmental performance projection, updated annually.",
      "Local material sourcing is a contractual requirement on every build — not a marketing aspiration.",
    ],
    services: [
      "Civic & public building design\nMixed-use urban development\nSustainability certification consultation\nPost-occupancy evaluation",
      "Masterplan & urban planning\nPassive house residential design\nAdaptive reuse & restoration\nLandscape integration",
    ],
    benefits: [
      "BREEAM Outstanding on all new builds\nLocal material sourcing required per contract\n10-year environmental performance tracking\nPlanning approval rate: 94%",
      "Carbon-negative design methodology\nCommunity consultation built into process\nLife-cycle cost modelling\nPost-occupancy reports shared publicly",
    ],
    targetAudiences: [
      "Public sector bodies commissioning civic buildings",
      "Developers with sustainability targets requiring credible architectural partners",
      "Private clients building homes with environmental integrity",
    ],
    ctas: ["View Selected Work", "Read the Method", "Start a Conversation"],
    audiences: ["Public sector commissioners, urban developers, global", "Sustainability-focused private clients"],
    typographyIntensity: "subtle",
    visualEffects: ["structural reveal", "light shift"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "DeFiProtocol": {
    taglines: [
      "Liquidity without borders.",
      "Cross-chain by default. Custodial by no one.",
      "The protocol the market was missing.",
      "Open liquidity. Closed to no one.",
    ],
    industries: ["Decentralised Finance", "Cross-Chain Infrastructure", "Web3 Protocol"],
    tones: ["Technical", "Transparent", "Security-first"],
    personalities: ["Mathematically precise", "Open-source committed", "Trust through code"],
    descriptions: [
      "{brand} is a cross-chain liquidity protocol enabling seamless asset routing between EVM-compatible networks. The protocol has processed $2.4B in total volume since launch, with zero exploits and a full public audit trail.",
      "{brand} solves a simple problem: liquidity is fragmented across chains and the bridging infrastructure is either slow, expensive, or both. The protocol routes between 12 supported networks in under 60 seconds at sub-$1 fees.",
      "The {brand} protocol is governed entirely on-chain. The team holds no admin keys. There is no multisig backdoor. The code is the contract.",
    ],
    usps: [
      "Zero exploits since mainnet launch. Full audit history published and maintained.",
      "No admin keys. No team multisig. Governance is on-chain or it doesn't happen.",
    ],
    services: [
      "Cross-chain liquidity routing\nLiquidity provider vaults\nGovernance token & DAO\nDeveloper API & SDK access",
      "Institutional liquidity provision\nProtocol integration for dApps\nGranted ecosystem development\nAudit partnership program",
    ],
    benefits: [
      "12 supported EVM networks\nSub-60 second cross-chain settlement\nSub-$1 routing fees average\nFull public audit history",
      "Zero exploits on mainnet\nNo admin keys or team multisig\nOn-chain governance only\nOpen-source under MIT licence",
    ],
    targetAudiences: [
      "DeFi protocols needing cross-chain liquidity infrastructure",
      "Liquidity providers seeking yield across multiple chains",
      "Web3 developers building cross-chain dApps",
    ],
    ctas: ["Launch the App", "Read the Docs", "Provide Liquidity", "View the Audit"],
    audiences: ["DeFi participants & LPs, 22–45, global", "Web3 developers building on EVM chains"],
    typographyIntensity: "dramatic",
    visualEffects: ["grid scan", "data flow", "terminal readout"],
    optimizationTarget: "desktop",
    spacingScale: "comfortable",
    borderRadius: "small",
  },

  "StreetArtCo": {
    taglines: [
      "The wall is the canvas. The city is the gallery.",
      "Paint first. Permission later. Sometimes.",
      "Street art doesn't ask for permission to mean something.",
      "Made in public. For the public.",
    ],
    industries: ["Street Art", "Urban Muralism", "Public Art Installation"],
    tones: ["Irreverent", "Bold", "Community-rooted"],
    personalities: ["Subversive", "Prolific", "Anti-exclusive"],
    descriptions: [
      "{brand} is a collective of 8 muralists and street artists operating across European cities. The collective has completed over 200 public murals, 40 commissioned installations, and counting.",
      "{brand} exists at the junction of art, community, and space. The collective takes commissions from city authorities, festivals, and brands who understand that public art is not decoration — it is statement.",
      "Every piece by {brand} is site-specific. The team researches the neighbourhood before touching the wall. The work belongs to the city that houses it.",
    ],
    usps: [
      "Every commission begins with a community consultation. The neighbourhood signs off before we do.",
      "We have completed 200+ public murals without a single removal order.",
    ],
    services: [
      "Public mural commissions\nBrand & commercial installation\nFestival & event live art\nPrint & merchandise from archive",
      "City public art programming\nInterior mural & commercial space\nLive art performance & documentation\nWorkshop & community residency",
    ],
    benefits: [
      "Community consultation included\nSite-specific design per commission\nFull documentation & rights\nArchive available for licensing",
      "200+ completed murals\nZero removal orders in 10 years\nShort lead time (2–4 weeks)\nFlexible scale from 2m to building-height",
    ],
    targetAudiences: [
      "City councils and urban development bodies commissioning public art",
      "Brands seeking cultural authenticity through street art collaboration",
      "Festivals and events with large-scale visual art requirements",
    ],
    ctas: ["Commission a Mural", "View the Archive", "Explore the Work"],
    audiences: ["Urban arts commissioners, city authorities, brands", "Festival & event producers, EU & UK"],
    typographyIntensity: "experimental",
    visualEffects: ["spray texture", "vivid colour flash"],
    optimizationTarget: "mobile",
    spacingScale: "compact",
    borderRadius: "none",
  },

  "FitnessApp": {
    taglines: [
      "Your body has data. Use it.",
      "Every session measured. Every rep earned.",
      "Train with the same data elite athletes use.",
      "No guesswork. No plateaus.",
    ],
    industries: ["Fitness Technology", "Performance Coaching", "Biometric Training"],
    tones: ["Motivational", "Data-driven", "Direct"],
    personalities: ["Performance-obsessed", "Evidence-based", "No excuses"],
    descriptions: [
      "{brand} is a HIIT training platform that uses biometric data from wearables to auto-adjust workout intensity in real time. The algorithm learns from 12 physiological inputs and personalises every session to your current recovery state.",
      "{brand} tracks what other apps ignore: HRV, sleep quality, readiness score, and training load over time. The workouts adapt to where you are, not where you were three months ago when you set your goals.",
      "The team behind {brand} has coached elite athletes. The app is the same methodology, automated. No generic plans. No motivational nonsense. Just the next right workout.",
    ],
    usps: [
      "Real-time biometric adaptation: the workout adjusts mid-session based on your heart rate variability.",
      "Integrated recovery scoring — the app tells you when NOT to train. That's the feature most apps won't build.",
    ],
    services: [
      "Biometric-adaptive HIIT workouts\nHRV & recovery tracking\nNutrition & hydration integration\nCoach-reviewed performance reports",
      "Live & on-demand workout sessions\nWeekly readiness assessment\nPeak performance programming\n1:1 coach video consultation",
    ],
    benefits: [
      "Real-time workout adaptation\nHRV & recovery score daily\nWorks with Garmin, Whoop & Apple Watch\nBuilt-in progressive overload algorithm",
      "Personalised per session, not per month\nBuilt for HIIT, scaled for every level\nAuto-deload when overtraining detected\n14-day free trial, cancel anytime",
    ],
    targetAudiences: [
      "Performance-focused adults who train regularly and want data-backed optimisation",
      "Amateur athletes training for events who want elite-level programming",
      "High-performers who treat fitness as an optimisation problem",
    ],
    ctas: ["Start Free Trial", "See How It Works", "Connect Your Wearable", "View the Science"],
    audiences: ["Performance fitness users, 25–45, data-literate", "Amateur athletes & high-performers, global"],
    typographyIntensity: "dramatic",
    visualEffects: ["data pulse", "metric flash", "motion lines"],
    optimizationTarget: "mobile",
    spacingScale: "comfortable",
    borderRadius: "medium",
  },

  "FineRestaurant": {
    taglines: [
      "Dinner as a complete sentence.",
      "Eighteen courses. One story.",
      "The menu changes. The intention does not.",
      "Food at the edge of what's possible.",
    ],
    industries: ["Fine Dining", "Molecular Gastronomy", "Michelin-Starred Hospitality"],
    tones: ["Intimate", "Precise", "Unhurried"],
    personalities: ["Obsessive", "Quietly theatrical", "Host-first"],
    descriptions: [
      "{brand} is an 18-seat restaurant offering a single tasting menu of 12 to 18 courses. The menu changes weekly based on what is exceptional that day, not what was ordered last month. Reservations open 30 days in advance.",
      "{brand} is a molecular gastronomy tasting experience for 14 guests per service, twice nightly. The team of six works within 3 metres of the dining room. The cooking is not hidden.",
      "Dinner at {brand} begins 45 minutes before the first course. The kitchen team introduces themselves. The menu is explained not as a list, but as an argument for what food can be.",
    ],
    usps: [
      "14 seats. Two services per evening. Every plate is made for the guest in front of it.",
      "The kitchen is open — the team cooks in the dining room. No separation between preparation and experience.",
    ],
    services: [
      "Tasting menu (12–18 courses)\nWine pairing by the sommelier\nPrivate dining for groups up to 14\nKitchen table experience",
      "Chef's counter experience\nPrivate event buyout\nCurated beverage pairing\nCorporate dining for special occasions",
    ],
    benefits: [
      "Menu written 24 hours before service\nIngredients sourced daily from named suppliers\nFull allergen adaptation on request\nSommelier pairing optional",
      "14-seat maximum — full team attention\nOpen kitchen every service\n48-hour cancellation policy\nDietary needs accommodated completely",
    ],
    targetAudiences: [
      "Food-focused diners seeking a singular experience over a meal",
      "Couples and small groups marking significant occasions",
      "Gastronomic travellers planning dining as the reason for the trip",
    ],
    ctas: ["Reserve a Table", "View the Menu", "Experience the Kitchen", "Enquire About Private Dining"],
    audiences: ["Fine dining guests, 30–60, destination diners", "Gastronomic tourists & food-focused travellers"],
    typographyIntensity: "dramatic",
    visualEffects: ["cinematic fade", "plate reveal"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "BoutiqueRealty": {
    taglines: [
      "Properties that require no introduction.",
      "The address is the beginning of the story.",
      "Acquisition, handled.",
      "For clients who know what they want.",
    ],
    industries: ["Luxury Real Estate", "Boutique Property Agency", "Ultra-Prime Residential"],
    tones: ["Discreet", "Assured", "Client-focused"],
    personalities: ["Quietly powerful", "Detail-oriented", "Trust-first"],
    descriptions: [
      "{brand} is a boutique real estate agency representing ultra-modern penthouses and architectural homes in London, Paris, and New York. The firm works with a maximum of 20 active clients and does not publicly list the majority of its properties.",
      "{brand} operates on referral. The agency manages fewer than 100 transactions per year by design — every client receives the time and discretion the transaction deserves.",
      "The advisors at {brand} have each spent 15+ years in premium residential property. They do not rush. They do not oversell. They find what you are actually looking for, not what fits the current market.",
    ],
    usps: [
      "Maximum 20 active clients. Your search is never deprioritised.",
      "Off-market access: the majority of our listed properties are never publicly advertised.",
    ],
    services: [
      "Prime residential acquisition\nOff-market property access\nInternational portfolio management\nDiscreet sales representation",
      "Ultra-prime property search\nArchitectural home specialist\nLegal & financial advisor coordination\nProperty management post-acquisition",
    ],
    benefits: [
      "Maximum 20 active clients\n70% of stock never publicly listed\nDedicated advisor throughout\nNo-pressure acquisition process",
      "Off-market access globally\nCross-border transaction support\nArchitectural property specialist knowledge\nPost-sale property management available",
    ],
    targetAudiences: [
      "Ultra-high-net-worth individuals acquiring prime residential property",
      "International buyers seeking architectural homes in major European cities",
      "Private offices managing property acquisition for clients",
    ],
    ctas: ["Register Your Criteria", "Request a Discreet Introduction", "Speak to an Advisor"],
    audiences: ["UHNW individuals, 40–65, global", "Private family offices & wealth management clients"],
    typographyIntensity: "dramatic",
    visualEffects: ["slow cinematic reveal", "light sweep"],
    optimizationTarget: "desktop",
    spacingScale: "spacious",
    borderRadius: "none",
  },

  "MusicProducer": {
    taglines: [
      "No warmth. No compromise. No nostalgia.",
      "Industrial. Precise. Relentless.",
      "The machine speaks. You listen.",
      "Made in the dark. Meant to be played loud.",
    ],
    industries: ["Electronic Music", "Techno Production", "Underground Club Culture"],
    tones: ["Cold", "Uncompromising", "Mechanical"],
    personalities: ["Process-driven", "Anti-commercial", "Technically obsessive"],
    descriptions: [
      "{brand} is the production alias of a Berlin-based techno producer whose work spans 14 years of releases on imprints including Berghain's Ostgut Ton, Tresor, and a dozen smaller labels across Germany and the UK.",
      "{brand} makes music for a specific room at a specific time of night. The approach is compositional rather than performative — tracks are built as systems, not songs, and they behave differently at different stages of a set.",
      "The studio is analogue where it matters and digital where it must be. {brand} records every session and releases only what survives three months of revisiting. The output is slow. The intention is permanent.",
    ],
    usps: [
      "Every release is mastered on the same equipment it was composed on. No separate mastering chain.",
      "A track is not released until it has been tested in the booth. No exceptions.",
    ],
    services: [
      "Original production & releases\nRemix commissions (selective)\nDJ sets & live performance booking\nProduction mastering (limited bookings)",
      "Club & festival bookings\nAlbum-length collaboration\nResident slot consultation\nArchive release licensing",
    ],
    benefits: [
      "14 years of active releases\nBooking across EU festival circuit\nAnalogue mastering available\nAll tracks booth-tested before release",
      "Selective remix catalogue\nTransparent booking process\nFull technical rider included\nAvailable for extended sets (3h+)",
    ],
    targetAudiences: [
      "Club promoters booking for serious underground nights",
      "Record labels seeking remix commissions or collaborative releases",
      "Techno and industrial music listeners building a serious record collection",
    ],
    ctas: ["Book a Date", "Hear the Work", "Licensing & Press Enquiries"],
    audiences: ["Club promoters & festival bookers, EU", "Underground music listeners & collectors, global"],
    typographyIntensity: "experimental",
    visualEffects: ["oscilloscope waveform", "harsh strobe flash"],
    optimizationTarget: "desktop",
    spacingScale: "compact",
    borderRadius: "none",
  },

  "SustainableFashion": {
    taglines: [
      "Slow by design. Made to last.",
      "Fewer things. Better things.",
      "The most sustainable garment is the one you keep.",
      "Fashion that remembers where it came from.",
    ],
    industries: ["Sustainable Fashion", "Slow Luxury", "Ethical Apparel"],
    tones: ["Thoughtful", "Grounded", "Honest"],
    personalities: ["Process-transparent", "Nature-connected", "Quietly premium"],
    descriptions: [
      "{brand} makes clothing from 100% recycled and reclaimed materials. Every garment is traceable from fibre to finish — the full supply chain is published on the site alongside each product. No exceptions.",
      "{brand} produces two collections per year. The quantities are planned against projected demand. There is no overproduction. When a run sells out, it does not come back.",
      "The studio behind {brand} employs 12 people across design, production, and communications. Everyone is paid a published living wage. The financial statements are available publicly, and have been for six years.",
    ],
    usps: [
      "Full supply chain transparency: fibre source to retail is published for every product.",
      "Zero overproduction: every run is demand-projected and produced once. No sales, no outlet stock.",
    ],
    services: [
      "Ready-to-wear seasonal collection\nRepair & alteration service\nEnd-of-life garment return programme\nSubscription styling for slow wardrobes",
      "Seasonal garment drops (2/year)\nFabric sourcing consultation\nCorporate sustainable uniform design\nGarment repair & lifetime care",
    ],
    benefits: [
      "100% recycled or reclaimed materials\nFull supply chain published per garment\nRepair service for lifetime of garment\nZero overproduction model",
      "No chemical dyes — plant-based only\nGarment-return end-of-life programme\nFair wage published, annual\nCarbon-neutral shipping always",
    ],
    targetAudiences: [
      "Conscious consumers building a considered wardrobe",
      "Professionals seeking quality garments with ethical provenance",
      "Fashion enthusiasts transitioning from fast fashion to investment pieces",
    ],
    ctas: ["Shop the Collection", "Read the Supply Chain", "View the Philosophy"],
    audiences: ["Conscious consumers, 28–50, urban", "Slow fashion advocates, global English-speaking markets"],
    typographyIntensity: "subtle",
    visualEffects: ["warm natural light", "fabric texture"],
    optimizationTarget: "adaptive",
    spacingScale: "spacious",
    borderRadius: "medium",
  },
};

function generateCopy(archetype, brandName) {
  const pool = COPY_POOLS[archetype.name];
  if (!pool) {
    return {
      tagline: "Excellence by design.",
      industry: archetype.industryHints || "Creative Services",
      description: brandName + " is a forward-thinking studio delivering exceptional work.",
      usp: "Quality and intention in everything we produce.",
      services: "Consulting\nDesign\nDevelopment",
      keyBenefits: "Expert team\nProven results\nDedicated support",
      targetAudience: "Businesses seeking quality creative work",
      callToAction: "Get in Touch",
      tone: "Professional",
      personality: "Dedicated",
      audience: "Professionals, global",
      typographyIntensity: "subtle",
      visualEffects: ["fade"],
      optimizationTarget: "adaptive",
      spacingScale: "comfortable",
      borderRadius: "medium",
    };
  }
  const description = pick(pool.descriptions).replace(/{brand}/g, brandName);
  return {
    tagline:        pick(pool.taglines),
    industry:       pick(pool.industries),
    description,
    usp:            pick(pool.usps),
    services:       pick(pool.services),
    keyBenefits:    pick(pool.benefits),
    targetAudience: pick(pool.targetAudiences),
    callToAction:   pick(pool.ctas),
    tone:           pick(pool.tones),
    personality:    pick(pool.personalities),
    audience:       pick(pool.audiences),
    typographyIntensity: pool.typographyIntensity,
    visualEffects:       pool.visualEffects,
    optimizationTarget:  pool.optimizationTarget,
    spacingScale:        pool.spacingScale,
    borderRadius:        pool.borderRadius,
  };
}

// ─────────────────────────────────────────────────────────────
// Section G: Reasoning templates
// ─────────────────────────────────────────────────────────────

const REASONING_TEMPLATES = {
  clientPersona: {
    "Futuristic": [
      "{brand} is building for the early adopters — the people who already live in the future. Their clients don't need convincing; they need performance. The site is a statement of capability, not a sales pitch.",
      "A technical founder's aesthetic: everything must earn its place on screen. {brand} rejects skeuomorphism and decoration — only functional, high-signal design.",
    ],
    "Editorial": [
      "{brand} has a client who reads. Who notices the kerning. Who bought the book before the article came out. The site is designed for someone who equates visual quality with product quality.",
      "{brand} doesn't shout. It lets the craft speak — or rather, whisper. The audience arrives already interested; the site deepens that interest.",
    ],
    "Minimal": [
      "{brand} operates in an industry saturated with noise. Their choice of silence is intentional and strategic — it signals confidence, precision, and editorial restraint.",
      "A client who has stripped everything to its essence. {brand}'s visual language is their competitive differentiator: where everyone else adds, they subtract.",
    ],
    "Brutalist": [
      "{brand} is explicitly anti-polish. The roughness is the point — it says 'we don't care what you think of us, we care about the work.' Their audience respects this.",
      "This client has seen too many agencies dress up mediocre work in beautiful layouts. They chose the opposite: let the work be undeniable, let the design be raw.",
    ],
  },
  aestheticChoice: {
    "Futuristic": "The Futuristic aesthetic was chosen because this client's product IS the future — a generic or conventional site would undermine the brand promise before the user reads a word.",
    "Editorial": "Editorial was the right call: this client's value proposition is taste and discernment. The typography-first approach communicates exactly that before any content loads.",
    "Minimal": "Minimal was chosen deliberately — this client competes in a crowded space, and restraint is the differentiator. Every removed element is a signal of confidence.",
    "Brutalist": "Brutalist aesthetic fits this client's anti-establishment positioning. It would be dishonest to dress this brand in a polished, conventional layout.",
  },
  colorChoices: {
    "dark-bold-accent":  "Dark background with a bold accent: the accent becomes the entire visual focal point, directing attention precisely where it needs to go. High contrast aids readability at speed.",
    "light-subtle":      "Light, subtle palette: projects professionalism and restraint. The muted accent avoids aggression — important for clients whose audience values sophistication over excitement.",
    "high-contrast-bw":  "High-contrast black and white: the most direct, unambiguous colour language available. Every other colour choice would add noise this client doesn't want.",
    "monochromatic":     "Monochromatic: depth and variation within a single hue family creates visual interest without disrupting the tonal consistency the brand requires.",
    "colorful":          "Vivid, saturated palette: this client's energy and personality is the product. The colour communicates before the copy does.",
  },
  fontChoices: {
    "Inter":               "Inter: the benchmark for screen legibility at all sizes. Neutral enough to not interfere, refined enough to not embarrass.",
    "Orbitron":            "Orbitron: unmistakably technical and forward-looking. Signals precision engineering without saying a word.",
    "Cormorant Garamond":  "Cormorant Garamond: the editorial serif that communicates heritage and refinement without pretension.",
    "Archivo Black":       "Archivo Black: maximum weight, maximum presence. No decoration needed when the type itself makes the statement.",
    "Playfair Display":    "Playfair Display: the high-fashion editorial serif. It knows what it is and doesn't apologise for it.",
    "Bebas Neue":          "Bebas Neue: condensed impact. The type takes up less space while demanding more attention.",
    "Unbounded":           "Unbounded: technical geometry that reads as both futuristic and fashion-forward.",
    "DM Sans":             "DM Sans: readable at every size, comfortable in long-form and short. The body font equivalent of a reliable tool.",
    "Rajdhani":            "Rajdhani: angular and precise — the typeface equivalent of a technical schematic.",
    "Syne":                "Syne: contemporary geometric with enough personality to carry a futuristic brand without screaming.",
    "Oxanium":             "Oxanium: designed for digital interfaces — every letterform is optimised for screen rather than print.",
    "Anton":               "Anton: bold, condensed, and immediately legible at large scales. Exactly what a brutalist headline needs.",
    "Instrument Serif":    "Instrument Serif: editorial with a contemporary edge — old-world craft through a modern optical correction.",
    "DM Serif Display":    "DM Serif Display: display-weight serif with ink traps and old-style numerals. Visual authority on a large screen.",
    "Plus Jakarta Sans":   "Plus Jakarta Sans: geometric but warm — the neutral that doesn't disappear into the background.",
    "Work Sans":           "Work Sans: optimised for screen at smaller sizes, authoritative at display sizes. Versatile without being generic.",
    "Outfit":              "Outfit: modern geometric sans with a clean personality that doesn't compete with content.",
    "Share Tech Mono":     "Share Tech Mono: monospaced and technical — communicates code-level precision in a design context.",
    "IBM Plex Mono":       "IBM Plex Mono: enterprise-grade monospace with genuine typographic credibility.",
  },
};

function buildReasoning(archetype, brandName, fonts, componentIds) {
  const personaPool = REASONING_TEMPLATES.clientPersona[archetype.aesthetic] || [];
  const rawPersona  = pick(personaPool) || "A client with clear aesthetic vision.";
  const clientPersona  = rawPersona.replace(/{brand}/g, brandName);
  const aestheticChoice = REASONING_TEMPLATES.aestheticChoice[archetype.aesthetic] || "";
  const colorChoices    = REASONING_TEMPLATES.colorChoices[archetype.colorStrategy] || "";

  const headingFont = (fonts.find(f => f.role === "heading") || {}).value;
  const fontChoices = REASONING_TEMPLATES.fontChoices[headingFont]
    || (headingFont + ": selected for aesthetic alignment with the " + archetype.aesthetic.toLowerCase() + " brief.");

  const componentChoices = {};
  const categoryReasons = {
    TextAnimations: "Adds typographic personality consistent with the " + archetype.aesthetic.toLowerCase() + " aesthetic.",
    Animations:     "Enhances interactivity without distracting from the core message.",
    Backgrounds:    "Sets the ambient tone before a single word is read.",
    Components:     "Structural component that organises content in a way that fits this client's layout needs.",
  };
  componentIds.forEach(function(id) {
    const parts    = id.split('/');
    const category = parts[0];
    const name     = parts[1];
    componentChoices[name] = categoryReasons[category] || "Selected for brand alignment.";
  });

  return { clientPersona, aestheticChoice, colorChoices, fontChoices, componentChoices };
}

// ─────────────────────────────────────────────────────────────
// Section H: RandomUser.me contact fetcher (with fallback)
// ─────────────────────────────────────────────────────────────

const FALLBACK_CITIES = [
  "Amsterdam", "Berlin", "London", "Copenhagen", "Stockholm",
  "New York", "Los Angeles", "San Francisco", "Austin", "Chicago",
  "Tokyo", "Seoul", "Singapore", "Sydney", "Toronto", "Zurich",
  "Vienna", "Barcelona", "Lisbon", "Helsinki"
];

const FALLBACK_PHONES = [
  "+1 (415) 555-XXXX",
  "+1 (212) 555-XXXX",
  "+44 20 7946 XXXX",
  "+49 30 XXXXXXXX",
  "+33 1 XX XX XX XX",
  "+81 3-XXXX-XXXX",
  "+61 2 XXXX XXXX",
  "+46 8 XXXX XXXX",
  "+41 44 XXX XX XX",
  "+34 91 XXX XXXX",
];

function randomDigits(n) {
  var s = '';
  for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

async function fetchContactData() {
  try {
    var https = require('https');
    return await new Promise(function(resolve, reject) {
      var req = https.get(
        'https://randomuser.me/api/?results=1&inc=location,phone&nat=us,gb,de,fr,au',
        function(res) {
          var data = '';
          res.on('data', function(chunk) { data += chunk; });
          res.on('end', function() {
            try {
              var json = JSON.parse(data);
              var user = json.results[0];
              resolve({
                city:    user.location.city,
                state:   user.location.state,
                country: user.location.country,
                phone:   user.phone
              });
            } catch(e) { reject(e); }
          });
        }
      );
      req.setTimeout(3000, function() { req.destroy(); reject(new Error('timeout')); });
      req.on('error', reject);
    });
  } catch(_) {
    var template = pick(FALLBACK_PHONES).replace(/X/g, function() { return Math.floor(Math.random() * 10); });
    return {
      city:    pick(FALLBACK_CITIES),
      state:   '',
      country: '',
      phone:   template,
    };
  }
}

function generateContact(brandName, contactData) {
  var slug   = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  var tld    = pick(['com', 'co', 'io', 'studio', 'agency']);
  var domain = slug.slice(0, 15) + '.' + tld;
  var email  = 'hello@' + domain;
  var handle = '@' + slug.slice(0, 15);
  var loc    = [contactData.city, contactData.country].filter(Boolean).join(', ');
  return { email: email, phone: contactData.phone, location: loc, socialLinks: handle };
}

// ─────────────────────────────────────────────────────────────
// Section I: Pages + Project Prompt + Main assembler
// ─────────────────────────────────────────────────────────────

function buildPages(siteType) {
  var pageMap = {
    "Landing": [
      { id: "page-home", title: "Home", type: "home", componentIds: [] }
    ],
    "Portfolio": [
      { id: "page-home",  title: "Home",  type: "home",   componentIds: [] },
      { id: "page-work",  title: "Work",  type: "custom", componentIds: [] },
      { id: "page-about", title: "About", type: "about",  componentIds: [] }
    ],
    "SaaS": [
      { id: "page-home",     title: "Home",     type: "home",   componentIds: [] },
      { id: "page-features", title: "Features", type: "custom", componentIds: [] }
    ],
    "Agency": [
      { id: "page-home",     title: "Home",     type: "home",     componentIds: [] },
      { id: "page-services", title: "Services", type: "services", componentIds: [] },
      { id: "page-contact",  title: "Contact",  type: "contact",  componentIds: [] }
    ],
  };
  return pageMap[siteType] || pageMap["Landing"];
}

function buildProjectPrompt(brandName, copy, archetype) {
  var siteTypeMap = {
    Landing:   "landing page",
    Portfolio: "portfolio site",
    SaaS:      "SaaS landing page",
    Agency:    "agency website",
  };
  var siteDesc = siteTypeMap[archetype.siteType] || "website";
  var aesthetic = archetype.aesthetic.toLowerCase();
  var colorDesc = archetype.colorStrategy.replace(/-/g, ' ');
  return (
    "Build a " + aesthetic + " " + siteDesc + " for " + brandName + " — " + copy.tagline + " " +
    "The visual direction should be " + colorDesc + " with " + aesthetic + " typography and strong aesthetic identity. " +
    copy.usp
  );
}

// Nav components — must be injected for multi-page sites
var NAV_COMPONENTS = [
  "Components/CardNav", "Components/StaggeredMenu", "Components/GooeyNav",
  "Components/Dock", "Components/PillNav", "Components/FlowingMenu",
];
var NAV_BY_AESTHETIC = {
  Editorial:   "Components/CardNav",
  Minimal:     "Components/PillNav",
  Futuristic:  "Components/FlowingMenu",
  Brutalist:   "Components/StaggeredMenu",
  colorful:    "Components/GooeyNav",
};

async function generateClient(archetype) {
  var brandName   = generateBrandName(archetype);
  var projectName = generateProjectName(brandName);
  var colors      = pickColors(archetype.colorStrategy);
  var fonts       = pickFonts(archetype.aesthetic);
  var componentIds = pickComponents(archetype);
  var copy        = generateCopy(archetype, brandName);
  var contactData = await fetchContactData();
  var contact     = generateContact(brandName, contactData);
  var pages       = buildPages(archetype.siteType);
  var projectPrompt = buildProjectPrompt(brandName, copy, archetype);

  // ── Nav enforcement: multi-page sites MUST have a nav component ──────────
  var isMultiPage = pages.length > 1;
  if (isMultiPage) {
    var hasNav = componentIds.some(function(id) {
      return NAV_COMPONENTS.indexOf(id) !== -1;
    });
    if (!hasNav) {
      var navId = NAV_BY_AESTHETIC[archetype.aesthetic] || "Components/PillNav";
      componentIds.push(navId);
      console.log('[LocalGen] Multi-page site (' + archetype.siteType + ') had no nav — injected ' + navId);
    }
  }

  var reasoning   = buildReasoning(archetype, brandName, fonts, componentIds);

  return {
    clientBrief: {
      brandName:      brandName,
      tagline:        copy.tagline,
      industry:       copy.industry,
      description:    copy.description,
      usp:            copy.usp,
      services:       copy.services,
      targetAudience: copy.targetAudience,
      callToAction:   copy.callToAction,
      keyBenefits:    copy.keyBenefits,
      tone:           copy.tone,
      personality:    copy.personality,
      contactEmail:   contact.email,
      contactPhone:   contact.phone,
      location:       contact.location,
      socialLinks:    contact.socialLinks,
    },
    styleDirection: {
      aesthetics:          [archetype.aesthetic],
      siteType:            archetype.siteType,
      typographyIntensity: copy.typographyIntensity,
      visualEffects:       copy.visualEffects,
      colorStrategy:       archetype.colorStrategy,
      audience:            copy.audience,
    },
    designRules: {
      fonts:  fonts,
      colors: colors,
      sizes: {
        optimizationTarget: copy.optimizationTarget,
        spacingScale:       copy.spacingScale,
        borderRadius:       copy.borderRadius,
      },
      images: [],
    },
    selectedComponentIds: componentIds,
    pages:         pages,
    projectPrompt: projectPrompt,
    projectName:   projectName,
    reasoning:     reasoning,
  };
}

// ─────────────────────────────────────────────────────────────
// Section J: Exports
// ─────────────────────────────────────────────────────────────

module.exports = { generateClient };
