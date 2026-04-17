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

export interface ComponentRole {
  name: string;
  roles: RoleType[];
  footprint: FootprintType;
  behavior: BehaviorType[];
}

export const COMPONENT_ROLES: ComponentRole[] = [
  // ── Backgrounds ──────────────────────────────────────────────────────────
  { name: 'Aurora',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Balatro',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Ballpit',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['physics'] },
  { name: 'Beams',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'DarkVeil',       roles: ['ambient'], footprint: 'full-bleed', behavior: ['static'] },
  { name: 'Dither',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['static'] },
  { name: 'DotGrid',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'FaultyTerminal', roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Galaxy',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'GridDistortion', roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'] },
  { name: 'GridMotion',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'HyperSpeed',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Iridescence',    roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'] },
  { name: 'LatterGlitch',   roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Lightning',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'LightRays',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'LiquidChrome',   roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'] },
  { name: 'Orb',            roles: ['ambient'], footprint: 'contained',  behavior: ['mouse-reactive'] },
  { name: 'Particles',      roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Plasma',         roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Prism',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'RippleGrid',     roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'] },
  { name: 'Silk',           roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Squares',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },
  { name: 'Threads',        roles: ['ambient'], footprint: 'full-bleed', behavior: ['mouse-reactive'] },
  { name: 'Waves',          roles: ['ambient'], footprint: 'full-bleed', behavior: ['auto-animated'] },

  // ── Components ───────────────────────────────────────────────────────────
  { name: 'AnimatedList',    roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'BounceCards',     roles: ['gallery', 'card'],          footprint: 'contained',     behavior: ['auto-animated'] },
  { name: 'CardNav',         roles: ['navigation'],               footprint: 'full-width',    behavior: ['user-driven'] },
  { name: 'CardSwaps',       roles: ['hero', 'gallery', 'card'],  footprint: 'contained',     behavior: ['auto-animated'] },
  { name: 'Carousel',        roles: ['gallery', 'ui'],            footprint: 'contained',     behavior: ['auto-animated', 'user-driven'] },
  { name: 'ChromeGrid',      roles: ['gallery'],                  footprint: 'full-viewport', behavior: ['mouse-reactive'] },
  { name: 'CircularGallery', roles: ['gallery', 'scroll-driver'], footprint: 'full-width',    behavior: ['scroll-driven'] },
  { name: 'Counter',         roles: ['ui', 'text-display'],       footprint: 'inline',        behavior: ['auto-animated', 'user-driven'] },
  { name: 'DecayCard',       roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'Dock',            roles: ['navigation'],               footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'ElasticSlider',   roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'FlowingMenu',     roles: ['navigation', 'hero'],       footprint: 'full-viewport', behavior: ['mouse-reactive'] },
  { name: 'FluidGlass',      roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'FlyingPosters',   roles: ['hero', 'gallery'],          footprint: 'full-viewport', behavior: ['scroll-driven'] },
  { name: 'Folder',          roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'GlassIcons',      roles: ['ui', 'navigation'],         footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'GlassSurface',    roles: ['decoration'],               footprint: 'contained',     behavior: ['static'] },
  { name: 'GooeyNav',        roles: ['navigation'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'InfiniteMenu',    roles: ['gallery'],                  footprint: 'full-viewport', behavior: ['mouse-reactive'] },
  { name: 'InfiniteScroll',  roles: ['scroll-driver'],            footprint: 'full-width',    behavior: ['auto-animated'] },
  { name: 'Lanyard',         roles: ['hero-3d'],                  footprint: 'full-viewport', behavior: ['physics'] },
  { name: 'MagicBento',      roles: ['gallery', 'card'],          footprint: 'section',       behavior: ['mouse-reactive'] },
  { name: 'Mansory',         roles: ['gallery'],                  footprint: 'section',       behavior: ['static'] },
  { name: 'ModelViewer',     roles: ['hero-3d'],                  footprint: 'section',       behavior: ['user-driven'] },
  { name: 'PillNav',         roles: ['navigation'],               footprint: 'overlay',       behavior: ['user-driven'] },
  { name: 'PixelCard',       roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'ProfileCard',     roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'RollingGallery',  roles: ['gallery'],                  footprint: 'full-width',    behavior: ['auto-animated'] },
  { name: 'ScrollStack',     roles: ['scroll-driver', 'gallery'], footprint: 'section',       behavior: ['scroll-driven'] },
  { name: 'SpotlightCard',   roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'Stack',           roles: ['card', 'gallery'],          footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'StaggeredMenu',   roles: ['navigation'],               footprint: 'full-viewport', behavior: ['user-driven'] },
  { name: 'Stepper',         roles: ['ui'],                       footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'TiltedCard',      roles: ['card'],                     footprint: 'contained',     behavior: ['mouse-reactive'] },

  // ── Animations ───────────────────────────────────────────────────────────
  { name: 'AnimatedContent', roles: ['transition'],               footprint: 'contained',     behavior: ['auto-animated'] },
  { name: 'BlobCursor',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'ClickSpark',      roles: ['overlay-fx'],               footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'Crosshair',       roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'Cubes',           roles: ['decoration', 'hero'],       footprint: 'section',       behavior: ['auto-animated'] },
  { name: 'FadeContent',     roles: ['transition'],               footprint: 'contained',     behavior: ['auto-animated'] },
  { name: 'GlareHover',      roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'GradualBlur',     roles: ['transition'],               footprint: 'contained',     behavior: ['scroll-driven'] },
  { name: 'ImageTrail',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'LogoLoop',        roles: ['decoration', 'ui'],         footprint: 'full-width',    behavior: ['auto-animated'] },
  { name: 'Magnet',          roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'MagnetLines',     roles: ['decoration'],               footprint: 'full-bleed',    behavior: ['mouse-reactive'] },
  { name: 'MetaBalls',       roles: ['decoration', 'hero'],       footprint: 'section',       behavior: ['mouse-reactive'] },
  { name: 'MetalicPaint',    roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'Noise',           roles: ['decoration'],               footprint: 'overlay',       behavior: ['static'] },
  { name: 'PixelTrail',      roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'PixelTransition', roles: ['transition'],               footprint: 'full-viewport', behavior: ['user-driven'] },
  { name: 'Ribbons',         roles: ['decoration'],               footprint: 'full-bleed',    behavior: ['auto-animated'] },
  { name: 'ShapeBlur',       roles: ['decoration'],               footprint: 'contained',     behavior: ['mouse-reactive'] },
  { name: 'SplashCursor',    roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },
  { name: 'StarBorder',      roles: ['decoration', 'ui'],         footprint: 'contained',     behavior: ['auto-animated'] },
  { name: 'StickerPeel',     roles: ['decoration', 'ui'],         footprint: 'contained',     behavior: ['user-driven'] },
  { name: 'TargetCursor',    roles: ['cursor'],                   footprint: 'overlay',       behavior: ['mouse-reactive'] },

  // ── TextAnimations ────────────────────────────────────────────────────────
  { name: 'ASCIIText',         roles: ['text-display', 'hero'],          footprint: 'section',   behavior: ['auto-animated'] },
  { name: 'BlurText',          roles: ['text-reveal'],                   footprint: 'inline',    behavior: ['scroll-driven'] },
  { name: 'CircularText',      roles: ['text-display', 'decoration'],    footprint: 'contained', behavior: ['auto-animated'] },
  { name: 'CountUp',           roles: ['ui', 'text-display'],            footprint: 'inline',    behavior: ['auto-animated', 'user-driven'] },
  { name: 'CurvedLoop',        roles: ['text-display', 'decoration'],    footprint: 'contained', behavior: ['auto-animated'] },
  { name: 'DecryptedText',     roles: ['text-reveal'],                   footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'FallingText',       roles: ['text-reveal'],                   footprint: 'section',   behavior: ['scroll-driven'] },
  { name: 'FuzzyText',         roles: ['text-display'],                  footprint: 'inline',    behavior: ['mouse-reactive'] },
  { name: 'GlitchText',        roles: ['text-display'],                  footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'GradientText',      roles: ['text-display'],                  footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'RotatingText',      roles: ['text-display', 'ui'],            footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'ScrambleText',      roles: ['text-reveal'],                   footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'ScrollFloat',       roles: ['text-reveal'],                   footprint: 'inline',    behavior: ['scroll-driven'] },
  { name: 'ScrollReveal',      roles: ['text-reveal'],                   footprint: 'section',   behavior: ['scroll-driven'] },
  { name: 'ScrollVelocity',    roles: ['scroll-driver', 'decoration'],   footprint: 'full-width', behavior: ['scroll-driven'] },
  { name: 'ShinyText',         roles: ['text-display'],                  footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'SplitText',         roles: ['text-reveal'],                   footprint: 'inline',    behavior: ['scroll-driven'] },
  { name: 'TextCursor',        roles: ['text-display', 'ui'],            footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'TextPressure',      roles: ['text-display'],                  footprint: 'inline',    behavior: ['mouse-reactive'] },
  { name: 'TextType',          roles: ['text-display'],                  footprint: 'inline',    behavior: ['auto-animated'] },
  { name: 'TrueFocus',         roles: ['text-display'],                  footprint: 'inline',    behavior: ['mouse-reactive'] },
  { name: 'VariableProximity', roles: ['text-display'],                  footprint: 'inline',    behavior: ['mouse-reactive'] },
];

export function getRoleData(componentName: string): ComponentRole | undefined {
  return COMPONENT_ROLES.find(r => r.name === componentName);
}
