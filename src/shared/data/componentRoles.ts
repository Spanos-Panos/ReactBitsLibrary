export type RoleType =
  | 'ambient' | 'hero' | 'hero-3d' | 'gallery' | 'scroll-driver'
  | 'navigation' | 'card' | 'ui' | 'decoration' | 'cursor'
  | 'overlay-fx' | 'transition' | 'text-reveal' | 'text-display';

export type FootprintType =
  | 'full-viewport' | 'full-bleed' | 'full-width' | 'section'
  | 'contained' | 'overlay' | 'inline';

export type BehaviorType =
  | 'auto-animated' | 'physics' | 'scroll-driven'
  | 'mouse-reactive' | 'user-driven' | 'static';

/**
 * Performance weight — coarse runtime cost classification.
 *  - 'light'   : negligible runtime cost (most text animations, transitions, simple decorations).
 *  - 'medium'  : moderate runtime cost (canvas/SVG/2D animation, scroll-driven gallery effects).
 *  - 'heavy'   : significant runtime cost (full-screen WebGL/3D, physics, high-density particle/grid effects).
 */
export type WeightTier = 'light' | 'medium' | 'heavy';

/**
 * GPU tier — indicates the GPU pressure profile.
 *  - 'cpu'      : no GPU shader work; CPU/DOM/Canvas2D only.
 *  - 'gpu-low'  : light WebGL/Canvas2D; safe on integrated GPUs.
 *  - 'gpu-high' : intensive WebGL/3D shaders; struggles on low-end integrated GPUs.
 */
export type GpuTier = 'cpu' | 'gpu-low' | 'gpu-high';

export interface ComponentRole {
  name: string;
  roles: RoleType[];
  footprint: FootprintType;
  behavior: BehaviorType[];
  weight: WeightTier;
  gpuTier: GpuTier;
}

export const COMPONENT_ROLES: ComponentRole[] = [
  // ── Backgrounds ──────────────────────────────────────────────────────────
  { name: 'Aurora',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Balatro',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Ballpit',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['physics'],        weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Beams',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'DarkVeil',       roles: ['ambient'], footprint: 'full-bleed', behavior: ['static'],         weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Dither',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['static'],         weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'DotGrid',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'FaultyTerminal', roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Galaxy',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'GridDistortion', roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'], weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'GridMotion',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'HyperSpeed',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Iridescence',    roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'], weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'LatterGlitch',   roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Lightning',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'LightRays',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'LiquidChrome',   roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'], weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Orb',            roles: ['ambient'], footprint: 'contained',  behavior: ['mouse-reactive'], weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Particles',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Plasma',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'PlasmaWave',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Prism',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'RippleGrid',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'], weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Silk',           roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Squares',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Threads',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'], weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'Waves',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'],  weight: 'medium', gpuTier: 'gpu-low'  },

  // ── Components ───────────────────────────────────────────────────────────
  { name: 'AnimatedList',    roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'BounceCards',     roles: ['gallery', 'card'],          footprint: 'contained',     behavior: ['auto-animated'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'CardNav',         roles: ['navigation'],               footprint: 'full-width',    behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'CardSwaps',       roles: ['hero', 'gallery', 'card'],  footprint: 'contained',     behavior: ['auto-animated'],                  weight: 'medium', gpuTier: 'cpu'      },
  { name: 'Carousel',        roles: ['gallery', 'ui'],            footprint: 'contained',     behavior: ['auto-animated', 'user-driven'],   weight: 'light',  gpuTier: 'cpu'      },
  { name: 'ChromeGrid',      roles: ['gallery'],                  footprint: 'full-viewport', behavior: ['mouse-reactive'],                 weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'CircularGallery', roles: ['gallery', 'scroll-driver'], footprint: 'full-width',    behavior: ['scroll-driven'],                  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Counter',         roles: ['ui', 'text-display'],       footprint: 'inline',        behavior: ['auto-animated', 'user-driven'],   weight: 'light',  gpuTier: 'cpu'      },
  { name: 'DecayCard',       roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Dock',            roles: ['navigation'],               footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'ElasticSlider',   roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'FlowingMenu',     roles: ['navigation', 'hero'],       footprint: 'full-viewport', behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'cpu'      },
  { name: 'FluidGlass',      roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'FlyingPosters',   roles: ['hero', 'gallery'],          footprint: 'full-viewport', behavior: ['scroll-driven'],                  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Folder',          roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'GlassIcons',      roles: ['ui', 'navigation'],         footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'GlassSurface',    roles: ['decoration'],               footprint: 'contained',     behavior: ['static'],                         weight: 'light',  gpuTier: 'cpu'      },
  { name: 'GooeyNav',        roles: ['navigation'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'InfiniteMenu',    roles: ['gallery'],                  footprint: 'full-viewport', behavior: ['mouse-reactive'],                 weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'InfiniteScroll',  roles: ['scroll-driver'],            footprint: 'full-width',    behavior: ['auto-animated'],                  weight: 'medium', gpuTier: 'cpu'      },
  { name: 'Lanyard',         roles: ['hero-3d'],                  footprint: 'full-viewport', behavior: ['physics'],                        weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'MagicBento',      roles: ['gallery', 'card'],          footprint: 'section',       behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Mansory',         roles: ['gallery'],                  footprint: 'section',       behavior: ['static'],                         weight: 'light',  gpuTier: 'cpu'      },
  { name: 'ModelViewer',     roles: ['hero-3d'],                  footprint: 'section',       behavior: ['user-driven'],                    weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'PillNav',         roles: ['navigation'],               footprint: 'overlay',       behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'PixelCard',       roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'ProfileCard',     roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'RollingGallery',  roles: ['gallery'],                  footprint: 'full-width',    behavior: ['auto-animated'],                  weight: 'medium', gpuTier: 'cpu'      },
  { name: 'ScrollStack',     roles: ['scroll-driver', 'gallery'], footprint: 'section',       behavior: ['scroll-driven'],                  weight: 'medium', gpuTier: 'cpu'      },
  { name: 'SpotlightCard',   roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Stack',           roles: ['card', 'gallery'],          footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'StaggeredMenu',   roles: ['navigation'],               footprint: 'full-viewport', behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Stepper',         roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'TiltedCard',      roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },

  // ── Animations ───────────────────────────────────────────────────────────
  { name: 'AnimatedContent', roles: ['transition'],               footprint: 'contained',     behavior: ['auto-animated'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'BlobCursor',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'ClickSpark',      roles: ['overlay-fx'],               footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Crosshair',       roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Cubes',           roles: ['decoration', 'hero'],       footprint: 'section',       behavior: ['auto-animated'],                  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'FadeContent',     roles: ['transition'],               footprint: 'contained',     behavior: ['auto-animated'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'GlareHover',      roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'GradualBlur',     roles: ['transition'],               footprint: 'contained',     behavior: ['scroll-driven'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'ImageTrail',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'cpu'      },
  { name: 'LogoLoop',        roles: ['decoration', 'ui'],         footprint: 'full-width',    behavior: ['auto-animated'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'Magnet',          roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },
  { name: 'MagnetLines',     roles: ['decoration'],               footprint: 'full-bleed',    behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'cpu'      },
  { name: 'MetaBalls',       roles: ['decoration', 'hero'],       footprint: 'section',       behavior: ['mouse-reactive'],                 weight: 'heavy',  gpuTier: 'gpu-high' },
  { name: 'MetalicPaint',    roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'Noise',           roles: ['decoration'],               footprint: 'overlay',       behavior: ['static'],                         weight: 'light',  gpuTier: 'cpu'      },
  { name: 'PixelTrail',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'cpu'      },
  { name: 'PixelTransition', roles: ['transition'],               footprint: 'full-viewport', behavior: ['user-driven'],                    weight: 'medium', gpuTier: 'cpu'      },
  { name: 'Ribbons',         roles: ['decoration'],               footprint: 'full-bleed',    behavior: ['auto-animated'],                  weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'ShapeBlur',       roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'SplashCursor',    roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'medium', gpuTier: 'gpu-low'  },
  { name: 'StarBorder',      roles: ['decoration', 'ui'],         footprint: 'contained',     behavior: ['auto-animated'],                  weight: 'light',  gpuTier: 'cpu'      },
  { name: 'StickerPeel',     roles: ['decoration', 'ui'],         footprint: 'contained',     behavior: ['user-driven'],                    weight: 'light',  gpuTier: 'cpu'      },
  { name: 'TargetCursor',    roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'],                 weight: 'light',  gpuTier: 'cpu'      },

  // ── TextAnimations ────────────────────────────────────────────────────────
  { name: 'ASCIIText',         roles: ['text-display', 'hero'],          footprint: 'section',    behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'BlurText',          roles: ['text-reveal'],                   footprint: 'inline',     behavior: ['scroll-driven'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'CircularText',      roles: ['text-display', 'decoration'],    footprint: 'contained',  behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'CountUp',           roles: ['ui', 'text-display'],            footprint: 'inline',     behavior: ['auto-animated', 'user-driven'], weight: 'light',  gpuTier: 'cpu' },
  { name: 'CurvedLoop',        roles: ['text-display', 'decoration'],    footprint: 'contained',  behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'DecryptedText',     roles: ['text-reveal'],                   footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'FallingText',       roles: ['text-reveal'],                   footprint: 'section',    behavior: ['scroll-driven'],                weight: 'medium', gpuTier: 'cpu' },
  { name: 'FuzzyText',         roles: ['text-display'],                  footprint: 'inline',     behavior: ['mouse-reactive'],               weight: 'light',  gpuTier: 'cpu' },
  { name: 'GlitchText',        roles: ['text-display'],                  footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'GradientText',      roles: ['text-display'],                  footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'RotatingText',      roles: ['text-display', 'ui'],            footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'ScrambleText',      roles: ['text-reveal'],                   footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'ScrollFloat',       roles: ['text-reveal'],                   footprint: 'inline',     behavior: ['scroll-driven'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'ScrollReveal',      roles: ['text-reveal'],                   footprint: 'section',    behavior: ['scroll-driven'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'ScrollVelocity',    roles: ['scroll-driver', 'decoration'],   footprint: 'full-width', behavior: ['scroll-driven'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'ShinyText',         roles: ['text-display'],                  footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'SplitText',         roles: ['text-reveal'],                   footprint: 'inline',     behavior: ['scroll-driven'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'TextCursor',        roles: ['text-display', 'ui'],            footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'TextPressure',      roles: ['text-display'],                  footprint: 'inline',     behavior: ['mouse-reactive'],               weight: 'light',  gpuTier: 'cpu' },
  { name: 'TextType',          roles: ['text-display'],                  footprint: 'inline',     behavior: ['auto-animated'],                weight: 'light',  gpuTier: 'cpu' },
  { name: 'TrueFocus',         roles: ['text-display'],                  footprint: 'inline',     behavior: ['mouse-reactive'],               weight: 'light',  gpuTier: 'cpu' },
  { name: 'VariableProximity', roles: ['text-display'],                  footprint: 'inline',     behavior: ['mouse-reactive'],               weight: 'light',  gpuTier: 'cpu' },
];

export function getRoleData(componentName: string): ComponentRole | undefined {
  return COMPONENT_ROLES.find(r => r.name === componentName);
}

export function isNavigationComponentName(componentName: string | undefined): boolean {
  if (!componentName) return false;
  const roleData = getRoleData(componentName);
  if (roleData) return roleData.roles.includes('navigation');
  const lowered = componentName.toLowerCase();
  return lowered.includes('nav') || lowered.includes('menu') || lowered.includes('header');
}

// ── Performance helpers ─────────────────────────────────────────────────────

export function getWeight(componentName: string | undefined): WeightTier {
  if (!componentName) return 'light';
  return getRoleData(componentName)?.weight || 'light';
}

export function getGpuTier(componentName: string | undefined): GpuTier {
  if (!componentName) return 'cpu';
  return getRoleData(componentName)?.gpuTier || 'cpu';
}

export interface WeightTally {
  light: number;
  medium: number;
  heavy: number;
  total: number;
  gpuHighCount: number;
}

export function tallyWeights(componentNames: ReadonlyArray<string | undefined>): WeightTally {
  const tally: WeightTally = { light: 0, medium: 0, heavy: 0, total: 0, gpuHighCount: 0 };
  for (const name of componentNames) {
    if (!name) continue;
    const role = getRoleData(name);
    const weight = role?.weight || 'light';
    tally[weight] += 1;
    tally.total += 1;
    if (role?.gpuTier === 'gpu-high') tally.gpuHighCount += 1;
  }
  return tally;
}

export interface PerformanceProfile {
  id: 'low-end' | 'balanced' | 'showcase';
  label: string;
  /** Maximum number of `heavy`-weight components allowed. */
  heavyMax: number;
  /** Maximum number of `medium`-weight components allowed. */
  mediumMax: number;
  /** Short user-facing description. */
  description: string;
}

/** Performance profile budgets, used as advisory selection guidance. */
export const WEIGHT_BUDGETS: Record<PerformanceProfile['id'], PerformanceProfile> = {
  'low-end': {
    id: 'low-end',
    label: 'Low-end PC',
    heavyMax: 0,
    mediumMax: 1,
    description: 'Optimized for integrated GPUs and older laptops. Avoid full-screen WebGL effects.',
  },
  'balanced': {
    id: 'balanced',
    label: 'Balanced',
    heavyMax: 1,
    mediumMax: 3,
    description: 'Default: one statement effect, several medium animations. Runs well on modern hardware.',
  },
  'showcase': {
    id: 'showcase',
    label: 'Showcase',
    heavyMax: 3,
    mediumMax: 99,
    description: 'No restrictions. Best for portfolios and demos meant to push the visuals.',
  },
};

export const DEFAULT_PERFORMANCE_PROFILE_ID: PerformanceProfile['id'] = 'balanced';

/** Returns true if the selection respects the profile's heavy/medium budgets. */
export function isWithinBudget(tally: WeightTally, profile: PerformanceProfile): boolean {
  return tally.heavy <= profile.heavyMax && tally.medium <= profile.mediumMax;
}

/** Returns a list of advisory messages explaining how the selection violates the profile (empty if compliant). */
export function describeBudgetViolations(tally: WeightTally, profile: PerformanceProfile): string[] {
  const out: string[] = [];
  if (tally.heavy > profile.heavyMax) {
    out.push(`${tally.heavy} heavy component${tally.heavy === 1 ? '' : 's'} selected (profile allows ${profile.heavyMax}).`);
  }
  if (tally.medium > profile.mediumMax) {
    out.push(`${tally.medium} medium component${tally.medium === 1 ? '' : 's'} selected (profile allows ${profile.mediumMax}).`);
  }
  return out;
}
