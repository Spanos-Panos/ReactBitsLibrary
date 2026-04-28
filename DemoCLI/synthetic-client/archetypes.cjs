/**
 * Archetype bank for the Synthetic Client System.
 * Each archetype provides the seed that primes the Claude prompt.
 */

const archetypes = [
  {
    name: "LuxuryWatch",
    description: "A multi-generation Swiss watchmaker launching a limited 'Legacy' collection. They value heritage, precision, and timeless elegance over fast trends.",
    aesthetic: "Editorial",
    siteType: "Landing",
    colorStrategy: "monochromatic",
    industryHints: "Luxury goods / horology"
  },
  {
    name: "RacingStore",
    description: "A high-performance automotive parts retailer specializing in aftermarket turbo kits and racing gear. The vibe is fast, technical, and aggressive.",
    aesthetic: "Futuristic",
    siteType: "Landing",
    colorStrategy: "dark-bold-accent",
    industryHints: "Automotive / motorsport retail"
  },
  {
    name: "BrutalistPortfolio",
    description: "A cutting-edge graphic designer who wants a portfolio that breaks all traditional UX rules. Raw, loud, and unapologetically digital.",
    aesthetic: "Brutalist",
    siteType: "Portfolio",
    colorStrategy: "high-contrast-bw",
    industryHints: "Visual art / graphic design"
  },
  {
    name: "MinimalStudio",
    description: "A boutique UX design agency that believes 'less is more'. Their work is clean, functional, and uses whitespace as a primary design element.",
    aesthetic: "Minimal",
    siteType: "Agency",
    colorStrategy: "light-subtle",
    industryHints: "Product design / UX"
  },
  {
    name: "CyberpunkSaaS",
    description: "A next-gen AI infrastructure company providing low-latency edge computing. They want to look like the future of the internet.",
    aesthetic: "Futuristic",
    siteType: "SaaS",
    colorStrategy: "dark-bold-accent",
    industryHints: "Developer tools / AI infra"
  },
  {
    name: "PhotographyBook",
    description: "A world-renowned fine-art photographer showcasing a new series on urban isolation. The site should feel like a high-end physical gallery.",
    aesthetic: "Editorial",
    siteType: "Portfolio",
    colorStrategy: "monochromatic",
    industryHints: "Fine-art photography"
  },
  {
    name: "CoffeeShop",
    description: "A specialty coffee roaster focusing on single-origin beans and sustainable direct-trade relationships. Warm, inviting, and organic.",
    aesthetic: "Minimal",
    siteType: "Landing",
    colorStrategy: "light-subtle",
    industryHints: "Specialty coffee / food"
  },
  {
    name: "PunkLabel",
    description: "An underground DIY record label representing experimental noise and punk bands. The design should feel chaotic and scanned-in.",
    aesthetic: "Brutalist",
    siteType: "Landing",
    colorStrategy: "high-contrast-bw",
    industryHints: "Independent music label"
  },
  {
    name: "LawFirm",
    description: "A modern law firm specializing in intellectual property for tech startups. They want to look professional but approachable and modern.",
    aesthetic: "Minimal",
    siteType: "Agency",
    colorStrategy: "light-subtle",
    industryHints: "Corporate / IP law"
  },
  {
    name: "WellnessClinic",
    description: "An integrative health clinic offering acupuncture and holistic nutrition. The focus is on calm, balance, and natural healing.",
    aesthetic: "Minimal",
    siteType: "Landing",
    colorStrategy: "monochromatic",
    industryHints: "Health / integrative medicine"
  },
  {
    name: "IndieGameStudio",
    description: "A small team of developers creating a neon-soaked synthwave adventure game. The site needs to capture the game's electric energy.",
    aesthetic: "Futuristic",
    siteType: "Landing",
    colorStrategy: "dark-bold-accent",
    industryHints: "Video games / interactive media"
  },
  {
    name: "FashionBrand",
    description: "An avant-garde fashion house creating conceptual clothing. The site should feel like a digital runway, moody and high-fashion.",
    aesthetic: "Editorial",
    siteType: "Landing",
    colorStrategy: "dark-bold-accent",
    industryHints: "Avant-garde fashion"
  },
  {
    name: "ArchitectureFirm",
    description: "An international architecture firm focused on sustainable urban landmarks. They value structural honesty and light.",
    aesthetic: "Minimal",
    siteType: "Portfolio",
    colorStrategy: "light-subtle",
    industryHints: "Architecture / spatial design"
  },
  {
    name: "DeFiProtocol",
    description: "A decentralized finance protocol for cross-chain liquidity. The design should feel secure, high-tech, and mathematically precise.",
    aesthetic: "Futuristic",
    siteType: "SaaS",
    colorStrategy: "dark-bold-accent",
    industryHints: "Blockchain / decentralized finance"
  },
  {
    name: "StreetArtCo",
    description: "A collective of street artists and muralists. Their portfolio should feel like a walk through a vibrant, ever-changing city alley.",
    aesthetic: "Brutalist",
    siteType: "Portfolio",
    colorStrategy: "colorful",
    industryHints: "Street art / urban collective"
  },
  {
    name: "FitnessApp",
    description: "A high-intensity interval training (HIIT) app that uses biometrics to optimize workouts. Fast-paced, energetic, and data-driven.",
    aesthetic: "Futuristic",
    siteType: "SaaS",
    colorStrategy: "dark-bold-accent",
    industryHints: "Fitness / performance coaching"
  },
  {
    name: "FineRestaurant",
    description: "A Michelin-starred restaurant offering a molecular gastronomy tasting menu. The experience is intimate, sophisticated, and rare.",
    aesthetic: "Editorial",
    siteType: "Landing",
    colorStrategy: "monochromatic",
    industryHints: "Upscale dining / hospitality"
  },
  {
    name: "BoutiqueRealty",
    description: "A luxury real estate agency selling ultra-modern penthouses and architectural homes. Sophisticated, exclusive, and high-end.",
    aesthetic: "Editorial",
    siteType: "Agency",
    colorStrategy: "light-subtle",
    industryHints: "Boutique real estate"
  },
  {
    name: "MusicProducer",
    description: "A techno producer known for dark, industrial soundscapes. The site should reflect the cold, mechanical nature of the music.",
    aesthetic: "Brutalist",
    siteType: "Portfolio",
    colorStrategy: "high-contrast-bw",
    industryHints: "Electronic / underground music"
  },
  {
    name: "SustainableFashion",
    description: "A slow-fashion brand using 100% recycled materials. The aesthetic is 'earthy luxury'—premium but deeply connected to nature.",
    aesthetic: "Minimal",
    siteType: "Landing",
    colorStrategy: "light-subtle",
    industryHints: "Ethical fashion / slow luxury"
  }
];

function getRandomArchetype() {
  return archetypes[Math.floor(Math.random() * archetypes.length)];
}

function getArchetypeByKeyword(keyword) {
  const n = parseInt(keyword, 10);
  if (!isNaN(n) && String(n) === String(keyword).trim()) {
    const byIndex = archetypes[n - 1];
    if (byIndex) return byIndex;
  }
  const kw = keyword.toLowerCase();
  const match = archetypes.find(a =>
    a.name.toLowerCase().includes(kw) ||
    a.aesthetic.toLowerCase().includes(kw) ||
    a.siteType.toLowerCase().includes(kw) ||
    a.industryHints.toLowerCase().includes(kw)
  );
  return match || getRandomArchetype();
}

module.exports = {
  archetypes,
  getRandomArchetype,
  getArchetypeByKeyword
};
