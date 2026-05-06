'use strict';

/**
 * Component performance tags — duplicates the TypeScript definitions in
 * src/shared/data/componentRoles.ts so the CommonJS pipeline (synthetic-client,
 * generators) can reason about weight without importing TypeScript.
 *
 * IMPORTANT: Keep this file in sync with src/shared/data/componentRoles.ts.
 * If you add a new component, add its weight here as well.
 */

const COMPONENT_WEIGHTS = {
  // Backgrounds
  Aurora:         { weight: 'medium', gpuTier: 'gpu-low'  },
  Balatro:        { weight: 'heavy',  gpuTier: 'gpu-high' },
  Ballpit:        { weight: 'heavy',  gpuTier: 'gpu-high' },
  Beams:          { weight: 'medium', gpuTier: 'gpu-low'  },
  DarkVeil:       { weight: 'light',  gpuTier: 'cpu'      },
  Dither:         { weight: 'medium', gpuTier: 'gpu-low'  },
  DotGrid:        { weight: 'medium', gpuTier: 'gpu-low'  },
  FaultyTerminal: { weight: 'heavy',  gpuTier: 'gpu-high' },
  Galaxy:         { weight: 'heavy',  gpuTier: 'gpu-high' },
  GridDistortion: { weight: 'heavy',  gpuTier: 'gpu-high' },
  GridMotion:     { weight: 'medium', gpuTier: 'gpu-low'  },
  HyperSpeed:     { weight: 'heavy',  gpuTier: 'gpu-high' },
  Iridescence:    { weight: 'heavy',  gpuTier: 'gpu-high' },
  LatterGlitch:   { weight: 'medium', gpuTier: 'gpu-low'  },
  Lightning:      { weight: 'medium', gpuTier: 'gpu-low'  },
  LightRays:      { weight: 'medium', gpuTier: 'gpu-low'  },
  LiquidChrome:   { weight: 'heavy',  gpuTier: 'gpu-high' },
  Orb:            { weight: 'medium', gpuTier: 'gpu-low'  },
  Particles:      { weight: 'medium', gpuTier: 'gpu-low'  },
  Plasma:         { weight: 'heavy',  gpuTier: 'gpu-high' },
  PlasmaWave:     { weight: 'heavy',  gpuTier: 'gpu-high' },
  Prism:          { weight: 'heavy',  gpuTier: 'gpu-high' },
  RippleGrid:     { weight: 'medium', gpuTier: 'gpu-low'  },
  Silk:           { weight: 'medium', gpuTier: 'gpu-low'  },
  Squares:        { weight: 'medium', gpuTier: 'gpu-low'  },
  Threads:        { weight: 'heavy',  gpuTier: 'gpu-high' },
  Waves:          { weight: 'medium', gpuTier: 'gpu-low'  },

  // Components
  AnimatedList:    { weight: 'light',  gpuTier: 'cpu'      },
  BounceCards:     { weight: 'light',  gpuTier: 'cpu'      },
  CardNav:         { weight: 'light',  gpuTier: 'cpu'      },
  CardSwaps:       { weight: 'medium', gpuTier: 'cpu'      },
  Carousel:        { weight: 'light',  gpuTier: 'cpu'      },
  ChromeGrid:      { weight: 'heavy',  gpuTier: 'gpu-high' },
  CircularGallery: { weight: 'medium', gpuTier: 'gpu-low'  },
  Counter:         { weight: 'light',  gpuTier: 'cpu'      },
  DecayCard:       { weight: 'medium', gpuTier: 'gpu-low'  },
  Dock:            { weight: 'light',  gpuTier: 'cpu'      },
  ElasticSlider:   { weight: 'light',  gpuTier: 'cpu'      },
  FlowingMenu:     { weight: 'medium', gpuTier: 'cpu'      },
  FluidGlass:      { weight: 'heavy',  gpuTier: 'gpu-high' },
  FlyingPosters:   { weight: 'medium', gpuTier: 'gpu-low'  },
  Folder:          { weight: 'light',  gpuTier: 'cpu'      },
  GlassIcons:      { weight: 'light',  gpuTier: 'cpu'      },
  GlassSurface:    { weight: 'light',  gpuTier: 'cpu'      },
  GooeyNav:        { weight: 'light',  gpuTier: 'cpu'      },
  InfiniteMenu:    { weight: 'heavy',  gpuTier: 'gpu-high' },
  InfiniteScroll:  { weight: 'medium', gpuTier: 'cpu'      },
  Lanyard:         { weight: 'heavy',  gpuTier: 'gpu-high' },
  MagicBento:      { weight: 'medium', gpuTier: 'gpu-low'  },
  Mansory:         { weight: 'light',  gpuTier: 'cpu'      },
  ModelViewer:     { weight: 'heavy',  gpuTier: 'gpu-high' },
  PillNav:         { weight: 'light',  gpuTier: 'cpu'      },
  PixelCard:       { weight: 'light',  gpuTier: 'cpu'      },
  ProfileCard:     { weight: 'light',  gpuTier: 'cpu'      },
  RollingGallery:  { weight: 'medium', gpuTier: 'cpu'      },
  ScrollStack:     { weight: 'medium', gpuTier: 'cpu'      },
  SpotlightCard:   { weight: 'light',  gpuTier: 'cpu'      },
  Stack:           { weight: 'light',  gpuTier: 'cpu'      },
  StaggeredMenu:   { weight: 'light',  gpuTier: 'cpu'      },
  Stepper:         { weight: 'light',  gpuTier: 'cpu'      },
  TiltedCard:      { weight: 'light',  gpuTier: 'cpu'      },

  // Animations
  AnimatedContent: { weight: 'light',  gpuTier: 'cpu'      },
  BlobCursor:      { weight: 'medium', gpuTier: 'gpu-low'  },
  ClickSpark:      { weight: 'light',  gpuTier: 'cpu'      },
  Crosshair:       { weight: 'light',  gpuTier: 'cpu'      },
  Cubes:           { weight: 'medium', gpuTier: 'gpu-low'  },
  FadeContent:     { weight: 'light',  gpuTier: 'cpu'      },
  GlareHover:      { weight: 'light',  gpuTier: 'cpu'      },
  GradualBlur:     { weight: 'light',  gpuTier: 'cpu'      },
  ImageTrail:      { weight: 'medium', gpuTier: 'cpu'      },
  LogoLoop:        { weight: 'light',  gpuTier: 'cpu'      },
  Magnet:          { weight: 'light',  gpuTier: 'cpu'      },
  MagnetLines:     { weight: 'medium', gpuTier: 'cpu'      },
  MetaBalls:       { weight: 'heavy',  gpuTier: 'gpu-high' },
  MetalicPaint:    { weight: 'medium', gpuTier: 'gpu-low'  },
  Noise:           { weight: 'light',  gpuTier: 'cpu'      },
  PixelTrail:      { weight: 'medium', gpuTier: 'cpu'      },
  PixelTransition: { weight: 'medium', gpuTier: 'cpu'      },
  Ribbons:         { weight: 'medium', gpuTier: 'gpu-low'  },
  ShapeBlur:       { weight: 'medium', gpuTier: 'gpu-low'  },
  SplashCursor:    { weight: 'medium', gpuTier: 'gpu-low'  },
  StarBorder:      { weight: 'light',  gpuTier: 'cpu'      },
  StickerPeel:     { weight: 'light',  gpuTier: 'cpu'      },
  TargetCursor:    { weight: 'light',  gpuTier: 'cpu'      },

  // TextAnimations
  ASCIIText:         { weight: 'light',  gpuTier: 'cpu' },
  BlurText:          { weight: 'light',  gpuTier: 'cpu' },
  CircularText:      { weight: 'light',  gpuTier: 'cpu' },
  CountUp:           { weight: 'light',  gpuTier: 'cpu' },
  CurvedLoop:        { weight: 'light',  gpuTier: 'cpu' },
  DecryptedText:     { weight: 'light',  gpuTier: 'cpu' },
  FallingText:       { weight: 'medium', gpuTier: 'cpu' },
  FuzzyText:         { weight: 'light',  gpuTier: 'cpu' },
  GlitchText:        { weight: 'light',  gpuTier: 'cpu' },
  GradientText:      { weight: 'light',  gpuTier: 'cpu' },
  RotatingText:      { weight: 'light',  gpuTier: 'cpu' },
  ScrambleText:      { weight: 'light',  gpuTier: 'cpu' },
  ScrollFloat:       { weight: 'light',  gpuTier: 'cpu' },
  ScrollReveal:      { weight: 'light',  gpuTier: 'cpu' },
  ScrollVelocity:    { weight: 'light',  gpuTier: 'cpu' },
  ShinyText:         { weight: 'light',  gpuTier: 'cpu' },
  SplitText:         { weight: 'light',  gpuTier: 'cpu' },
  TextCursor:        { weight: 'light',  gpuTier: 'cpu' },
  TextPressure:      { weight: 'light',  gpuTier: 'cpu' },
  TextType:          { weight: 'light',  gpuTier: 'cpu' },
  TrueFocus:         { weight: 'light',  gpuTier: 'cpu' },
  VariableProximity: { weight: 'light',  gpuTier: 'cpu' },
};

/**
 * Performance profile budgets (mirrors WEIGHT_BUDGETS in componentRoles.ts).
 * heavyMax / mediumMax are advisory caps used by synthetic-client selection.
 */
const WEIGHT_BUDGETS = {
  'low-end': {
    id: 'low-end',
    label: 'Low-end PC',
    heavyMax: 0,
    mediumMax: 1,
    description: 'Optimized for integrated GPUs and older laptops.',
  },
  'balanced': {
    id: 'balanced',
    label: 'Balanced',
    heavyMax: 1,
    mediumMax: 3,
    description: 'One statement effect, several medium animations.',
  },
  'showcase': {
    id: 'showcase',
    label: 'Showcase',
    heavyMax: 3,
    mediumMax: 99,
    description: 'No restrictions — premium showcase.',
  },
};

const DEFAULT_PROFILE_ID = 'balanced';

function nameFromId(idOrName) {
  if (!idOrName) return '';
  const s = String(idOrName);
  const slash = s.lastIndexOf('/');
  return slash >= 0 ? s.slice(slash + 1) : s;
}

function getWeight(idOrName) {
  const name = nameFromId(idOrName);
  return (COMPONENT_WEIGHTS[name] && COMPONENT_WEIGHTS[name].weight) || 'light';
}

function getGpuTier(idOrName) {
  const name = nameFromId(idOrName);
  return (COMPONENT_WEIGHTS[name] && COMPONENT_WEIGHTS[name].gpuTier) || 'cpu';
}

function tallyWeights(idsOrNames) {
  const t = { light: 0, medium: 0, heavy: 0, total: 0, gpuHighCount: 0 };
  if (!Array.isArray(idsOrNames)) return t;
  for (const item of idsOrNames) {
    const w = getWeight(item);
    if (t[w] != null) t[w] += 1;
    t.total += 1;
    if (getGpuTier(item) === 'gpu-high') t.gpuHighCount += 1;
  }
  return t;
}

function getProfile(profileId) {
  return WEIGHT_BUDGETS[profileId] || WEIGHT_BUDGETS[DEFAULT_PROFILE_ID];
}

function isWithinBudget(tally, profile) {
  if (!profile) return true;
  return tally.heavy <= profile.heavyMax && tally.medium <= profile.mediumMax;
}

// Lightweight fallbacks that work for any aesthetic / archetype.
const LIGHT_FALLBACK_COMPONENTS = [
  'TextAnimations/SplitText',
  'TextAnimations/BlurText',
  'Animations/FadeContent',
  'Animations/AnimatedContent',
  'Animations/StarBorder',
  'Components/Counter',
  'Components/Stepper',
  'TextAnimations/ShinyText',
  'TextAnimations/GradientText',
];

/**
 * Filter a candidate component combo so it stays within the profile's
 * heavy/medium budget. Drops over-budget items but ensures the result has
 * at least `minComponents` items by topping up with light fallbacks.
 *
 * @param {string[]} combo - Candidate component ids ("Category/Name").
 * @param {string} profileId - Performance profile id.
 * @param {{ minComponents?: number }} [opts]
 */
function filterToBudget(combo, profileId, opts) {
  const profile = getProfile(profileId);
  const minComponents = (opts && opts.minComponents) || 4;
  const out = [];
  let heavy = 0;
  let medium = 0;

  for (const id of (combo || [])) {
    const w = getWeight(id);
    if (w === 'heavy') {
      if (heavy < profile.heavyMax) {
        out.push(id);
        heavy += 1;
      }
    } else if (w === 'medium') {
      if (medium < profile.mediumMax) {
        out.push(id);
        medium += 1;
      }
    } else {
      out.push(id);
    }
  }

  // Backfill with light fallbacks when budget filter trims us below the minimum.
  if (out.length < minComponents) {
    for (const fallback of LIGHT_FALLBACK_COMPONENTS) {
      if (out.length >= minComponents) break;
      if (!out.includes(fallback)) out.push(fallback);
    }
  }

  return out;
}

module.exports = {
  COMPONENT_WEIGHTS,
  WEIGHT_BUDGETS,
  DEFAULT_PROFILE_ID,
  getWeight,
  getGpuTier,
  tallyWeights,
  getProfile,
  isWithinBudget,
  filterToBudget,
};
