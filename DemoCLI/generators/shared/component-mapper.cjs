/**
 * component-mapper.cjs
 * Maps every ReactBits component to its import line + working JSX snippet.
 * Uses the manifest usageMarkdown as the source of truth — those demos are proven.
 *
 * Categories:
 *   Backgrounds → fixed, zIndex: 0, pointerEvents: none
 *   Animations  → inline wrappers (scroll triggers, cursors, etc.)
 *   Components  → section content (menus, cards, lists, etc.)
 *   TextAnimations → inline inside headings/paragraphs
 *
 * Cursor names (fixed, zIndex: 9999):
 *   BlobCursor, Crosshair, ImageTrail, PixelTrail, SplashCursor, TargetCursor
 */

const path = require('path');
const MANIFEST_PATH = path.join(__dirname, '../../../src/reactbits-manifest.json');

const CURSOR_NAMES = new Set([
  'BlobCursor', 'Crosshair', 'ImageTrail', 'PixelTrail', 'SplashCursor', 'TargetCursor',
]);

const DEFAULT_LOGO_DATA_URI = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 48%22%3E%3Crect width=%22160%22 height=%2248%22 rx=%2210%22 fill=%22%2311151a%22/%3E%3Ctext x=%2280%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%23f8fafc%22 font-family=%22Inter,Arial,sans-serif%22 font-size=%2216%22 font-weight=%22700%22%3EBITFORGE%3C/text%3E%3C/svg%3E';

/**
 * Hand-crafted JSX overrides for components whose usageMarkdown can't be cleanly extracted.
 * Use these when the example requires variable declarations, external libraries, or complex setup.
 */
// Nav component names — rendered as fixed overlays in App.tsx, never as in-flow sections
const NAV_COMPONENT_NAMES = new Set([
  'StaggeredMenu', 'GooeyNav', 'CardNav', 'Dock', 'PillNav', 'FlowingMenu',
]);

function isNavComponent(name) {
  return NAV_COMPONENT_NAMES.has(name);
}

const COMPONENT_JSX_OVERRIDES = {
  LogoutButton: `<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
  <LogoutButton />
</div>`,

  CoockiesCard: `<div style={{ position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
  <CoockiesCard />
</div>`,

  ModernRevealCard: `<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
  <ModernRevealCard />
</div>`,

  NeumorphismCard: `<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
  <NeumorphismCard />
</div>`,

  LogoLoop: `<LogoLoop
  logos={[
    { title: 'Studio', node: (
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--color-surface) 88%, var(--color-text) 12%)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-text-on-surface)' }}>
          <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { title: 'Brand', node: (
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--color-surface) 88%, var(--color-text) 12%)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-accent)' }}>
          <path d="M12 2l2.6 6.4L21 9l-5 4.2L17.4 21 12 17.7 6.6 21 8 13.2 3 9l6.4-.6L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      </div>
    )},
    { title: 'Product', node: (
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--color-surface) 88%, var(--color-text) 12%)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-text-on-surface)' }}>
          <path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9.5 9.5h5v5h-5z" fill="currentColor" opacity="0.12"/>
        </svg>
      </div>
    )},
    { title: 'Platform', node: (
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--color-surface) 88%, var(--color-text) 12%)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-primary)' }}>
          <path d="M12 2v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M12 15v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M2 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M15 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M8.2 8.2l-2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M17.9 17.9l-2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M15.8 8.2l2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M6.1 17.9l2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { title: 'Labs', node: (
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--color-surface) 88%, var(--color-text) 12%)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-accent)' }}>
          <path d="M10 2v6l-5.6 9.7A2.5 2.5 0 0 0 6.6 21h10.8a2.5 2.5 0 0 0 2.2-3.3L14 8V2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8.2 14.3h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.65"/>
        </svg>
      </div>
    )},
  ]}
  speed={60}
  direction="left"
  logoHeight={60}
  gap={80}
  scaleOnHover={true}
  fadeOut={true}
  fadeOutColor="var(--color-bg)"
  verticalPosition="center"
/>`,

  GradientText: `<GradientText
  colors={[
    'color-mix(in srgb, var(--color-primary) 92%, white 8%)',
    'color-mix(in srgb, var(--color-accent) 92%, white 8%)',
    'color-mix(in srgb, var(--color-primary) 92%, white 8%)',
  ]}
  animationSpeed={10}
>
  Gradient Text
</GradientText>`,

  // Mansory: manifest demo uses <Masonry> tag + requires items array.
  // Generated pages should never render an undefined <Masonry /> symbol.
  Mansory: `<div style={{ width: '100%', height: 'min(520px, 70vh)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
  <Mansory
    items={[
      { id: "1", img: "/joker-landscape.jpg", height: 520, url: "#" },
      { id: "2", img: "/joker-portrait.jpg", height: 340, url: "#" },
      { id: "3", img: "/joker-square.jpg", height: 420, url: "#" },
      { id: "4", img: "/joker-landscape.jpg", height: 360, url: "#" },
      { id: "5", img: "/joker-portrait.jpg", height: 500, url: "#" },
      { id: "6", img: "/joker-square.jpg", height: 320, url: "#" },
      { id: "7", img: "/joker-landscape.jpg", height: 460, url: "#" },
      { id: "8", img: "/joker-portrait.jpg", height: 380, url: "#" },
    ]}
    containerWidth="100%"
    containerHeight="min(520px, 70vh)"
    gap={12}
    ease="power3.out"
    duration={0.7}
    stagger={0.03}
    animateFrom="bottom"
    scaleOnHover={true}
    hoverScale={1.03}
    blurToFocus={true}
    colorShiftOnHover={false}
  />
</div>`,

  // ColorBends: avoid demo pink/blue for monochrome/editorial briefs; use theme tokens.
  ColorBends: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <ColorBends
    colors={[
      'color-mix(in srgb, var(--color-text) 18%, var(--color-bg) 82%)',
      'color-mix(in srgb, var(--color-primary) 22%, var(--color-bg) 78%)',
      'color-mix(in srgb, var(--color-accent) 18%, var(--color-bg) 82%)',
    ]}
    rotation={90}
    speed={0.18}
    scale={1.35}
    frequency={1}
    warpStrength={0.9}
    mouseInfluence={0}
    noise={0.14}
    parallax={0.45}
    iterations={1}
    intensity={1.25}
    bandWidth={6}
    transparent
    autoRotate={0}
    color="var(--color-accent)"
    style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
  />
</div>`,

  TiltedCard: `<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
  <TiltedCard
    imageSrc="/joker-square.jpg"
    altText="Featured visual"
    captionText="Featured highlight"
    containerHeight="300px"
    containerWidth="300px"
    imageHeight="300px"
    imageWidth="300px"
    rotateAmplitude={12}
    scaleOnHover={1.2}
    showMobileWarning={false}
    showTooltip={true}
    displayOverlayContent={true}
    overlayContent={
      <p className="tilted-card-demo-text" style={{ margin: 0 }}>
        Preview
      </p>
    }
  />
</div>`,

  StickerPeel: `<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
  <StickerPeel
    imageSrc="/ReactIcon.svg"
    width={200}
    rotate={12}
    peelBackHoverPct={30}
    peelBackActivePct={40}
    shadowIntensity={0.15}
    lightingIntensity={0.35}
    initialPosition="center"
    peelDirection={0}
  />
  </div>`,

  GlareHover: `<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
  <GlareHover
    width="min(100%, 520px)"
    height="240px"
    background="color-mix(in srgb, var(--color-surface) 86%, var(--color-text) 14%)"
    borderRadius="12px"
    borderColor="var(--color-border)"
    glareColor="var(--color-accent)"
    glareOpacity={0.55}
    glareAngle={-38}
    glareSize={185}
    transitionDuration={720}
    playOnce={false}
    style={{ position: 'relative', zIndex: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
  >
    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700, color: 'var(--color-text-on-surface)', margin: 0, textAlign: 'center', padding: '0 1.25rem' }}>
      Hover this surface
    </h2>
  </GlareHover>
</div>`,

  StaggeredMenu: `<div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 999, pointerEvents: 'none' }}>
  <StaggeredMenu
    position="right"
    items={[
      { label: 'Home', ariaLabel: 'Go to home', link: '/' },
      { label: 'About', ariaLabel: 'About us', link: '/about' },
      { label: 'Services', ariaLabel: 'Our services', link: '/services' },
      { label: 'Contact', ariaLabel: 'Contact us', link: '/contact' },
    ]}
    socialItems={[
      { label: 'Twitter', link: 'https://twitter.com' },
      { label: 'GitHub', link: 'https://github.com' },
      { label: 'LinkedIn', link: 'https://linkedin.com' },
    ]}
    displaySocials={true}
    displayItemNumbering={true}
  />
</div>`,

  Dock: `<div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <Dock
    items={[
      { icon: <span style={{ fontSize: '1.1rem' }}>⌂</span>, label: 'Home', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>☰</span>, label: 'Menu', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>★</span>, label: 'Saved', onClick: () => {} },
      { icon: <span style={{ fontSize: '1.1rem' }}>⚙</span>, label: 'Settings', onClick: () => {} },
    ]}
    panelHeight={68}
    baseItemSize={50}
    magnification={70}
  />
</div>`,

  GooeyNav: `<nav style={{ position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <GooeyNav
    items={[
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Work', href: '/work' },
      { label: 'Contact', href: '/contact' },
    ]}
    particleCount={15}
    particleDistances={[90, 10]}
    particleR={100}
    initialActiveIndex={0}
    animationTime={600}
    colors={[1, 2, 3, 1, 2]}
  />
</nav>`,

  PillNav: `<nav style={{ position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, pointerEvents: 'auto' }}>
  <PillNav
    logo="${DEFAULT_LOGO_DATA_URI}"
    logoAlt="Site logo"
    items={[
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact' },
    ]}
    activeHref="/"
    baseColor="var(--color-text)"
    pillColor="var(--color-surface)"
    pillTextColor="var(--color-text-on-surface)"
    hoveredPillTextColor="var(--color-accent)"
  />
</nav>`,

  GlassIcons: `<GlassIcons
  items={[
    { icon: <span style={{ fontSize: '1.4rem' }}>◈</span>, color: 'blue', label: 'Design' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◉</span>, color: 'purple', label: 'Build' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◎</span>, color: 'red', label: 'Launch' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◆</span>, color: 'indigo', label: 'Scale' },
    { icon: <span style={{ fontSize: '1.4rem' }}>◇</span>, color: 'orange', label: 'Grow' },
  ]}
/>`,

  ImageTrail: `<div style={{ height: '320px', width: '100%', maxWidth: '960px', margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
  <ImageTrail
    items={['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg', '/joker-square.jpg', '/joker-portrait.jpg']}
    variant={1}
  />
</div>`,

  FlyingPosters: `<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <FlyingPosters
    items={['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg']}
  />
</div>`,

  GridMotion: `<div style={{ height: '600px', position: 'relative', overflow: 'hidden' }}>
  <GridMotion
    items={[
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
      '/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg',
    ]}
  />
</div>`,

  CardNav: `<div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, pointerEvents: 'auto' }}>
  <CardNav
    logo="${DEFAULT_LOGO_DATA_URI}"
    logoAlt="Logo"
    items={[
      { label: 'Home', bgColor: '#0D0716', textColor: '#fff', links: [{ label: 'Overview', href: '/', ariaLabel: 'Go to Home' }, { label: 'Highlights', href: '/', ariaLabel: 'View home highlights' }] },
      { label: 'Work', bgColor: '#170D27', textColor: '#fff', links: [{ label: 'Projects', href: '/work', ariaLabel: 'Go to Work' }, { label: 'Case Studies', href: '/work', ariaLabel: 'View case studies' }] },
      { label: 'About', bgColor: '#0D1A27', textColor: '#fff', links: [{ label: 'Studio', href: '/about', ariaLabel: 'Go to About' }, { label: 'Contact', href: '/contact', ariaLabel: 'Go to Contact' }] },
    ]}
    baseColor="var(--color-text)"
    menuColor="var(--color-bg)"
    buttonBgColor="var(--color-accent)"
    buttonTextColor="var(--color-bg)"
  />
</div>`,

  SpotlightCard: `<div style={{ maxWidth: '860px', margin: '0 auto', padding: '1rem' }}>
  <style>{\`.generated-spotlight-card.card-spotlight{position:relative!important;top:auto!important;left:auto!important;transform:none!important;width:100%!important;height:auto!important;min-height:220px!important;background-color:var(--color-surface)!important;border-color:var(--color-border)!important;color:var(--color-text-on-surface)!important;}\`}</style>
  <SpotlightCard className="generated-spotlight-card" spotlightColor="color-mix(in srgb, var(--color-accent) 45%, transparent)">
    <div style={{ color: 'var(--color-text-on-surface)', textAlign: 'left' }}>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.35rem', color: 'var(--color-text-on-surface)' }}>Focused Value</h3>
      <p style={{ margin: 0, opacity: 0.88, lineHeight: 1.7, color: 'var(--color-text-on-surface)' }}>Use this spotlight area for one key message, offer, or product highlight.</p>
    </div>
  </SpotlightCard>
</div>`,

  PlasmaWave: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <PlasmaWave
    colors={['var(--color-primary, #7C3AED)', 'var(--color-accent, #22D3EE)']}
    speed1={0.018}
    speed2={0.026}
    focalLength={1.05}
    bend1={0.55}
    bend2={0.35}
    dir2={1}
    rotationDeg={-8}
  />
</div>`,

  Ballpit: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <Ballpit
    count={200}
    gravity={0.7}
    friction={0.8}
    wallBounce={0.95}
    followCursor={true}
  />
</div>`,

  HyperSpeed: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <HyperSpeed effectOptions={{ onSpeedUp: () => {}, onSlowDown: () => {} }} />
</div>`,

  RippleGrid: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
  <RippleGrid enableRainbow={true} rippleColor={[0.3, 0.6, 1]} />
</div>`,

  DotGrid: `<div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, overflow: 'hidden' }}>
  <DotGrid
    dotSize={8}
    gap={22}
    baseColor="#7f83a8"
    activeColor="#635bff"
    proximity={95}
    shockRadius={160}
    shockStrength={2}
    resistance={900}
    returnDuration={1.2}
    style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', minHeight: '100dvh', pointerEvents: 'none' }}
  />
</div>`,

  Folder: `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
  <Folder
    items={[
      <div style={{ width: 40, height: 40, background: 'var(--color-accent)', borderRadius: 4 }} />,
      <div style={{ width: 40, height: 40, background: 'var(--color-primary)', borderRadius: 4 }} />,
      <div style={{ width: 40, height: 40, background: 'var(--color-secondary)', borderRadius: 4 }} />,
    ]}
  />
</div>`,

  ScrollVelocity: `<div style={{ overflowX: 'hidden' }}>
  <div style={{ height: '16vh' }} />
  <ScrollVelocity
    texts={['React Bits', 'Open Source', 'Beautiful UI', 'Ship Faster']}
    velocity={100}
    className="custom-scroll-text"
  />
  <div style={{ height: '16vh' }} />
</div>`,

  // ClickSpark: usageMarkdown has `{/* Your content here */}` as children — an invisible wrapper.
  // Override wraps a real CTA button so the spark effect is visible and interactive.
  ClickSpark: `<ClickSpark
  sparkColor="var(--color-accent)"
  sparkSize={10}
  sparkRadius={15}
  sparkCount={8}
  duration={400}
>
  <button style={{ padding: '1em 3em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>Get Started</button>
</ClickSpark>`,

  Counter: `<Counter
  value={2500}
  places={[1000, 100, 10, 1]}
  fontSize={80}
  padding={5}
  gap={10}
  textColor="var(--color-text)"
  fontWeight={900}
  gradientFrom="var(--color-bg)"
  gradientTo="var(--color-bg)"
/>`,

  Crosshair: `<div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden', background: 'var(--color-surface)', borderRadius: 8 }}>
  <Crosshair color="var(--color-accent)" />
  <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--color-text)', opacity: 0.4, fontSize: '0.9rem', pointerEvents: 'none' }}>Move cursor here</p>
</div>`,

  // ScrollReveal: usageMarkdown wraps content in `background:'#000'` which creates a black box on
  // light-mode pages. Override uses CSS vars and reduced spacer height so it fits any palette.
  ScrollReveal: `<div style={{ overflowX: 'hidden' }}>
  <div style={{ height: '16vh' }} />
  <ScrollReveal
    baseOpacity={0}
    enableBlur={true}
    baseRotation={5}
    blurStrength={10}
  >
    Every great journey begins with a single step. The vision you carry today shapes the world you build tomorrow — every decision, every detail, every moment of effort compounding into something worth remembering.
  </ScrollReveal>
  <div style={{ height: '16vh' }} />
</div>`,

  // FlowingMenu: usageMarkdown has `const demoItems = [...]` which gets stripped,
  // leaving items={demoItems} removed and the menu rendering nothing.
  FlowingMenu: `<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <FlowingMenu
    items={[
      { link: '#', text: 'Discover', image: '/joker-square.jpg' },
      { link: '#', text: 'Design', image: '/joker-portrait.jpg' },
      { link: '#', text: 'Deliver', image: '/joker-landscape.jpg' },
      { link: '#', text: 'Deploy', image: '/joker-square.jpg' },
    ]}
  />
</div>`,

  // AnimatedList: usageMarkdown has `const items = [...]` which gets stripped,
  // leaving the list empty. Override provides real content items.
  AnimatedList: `<div style={{ maxWidth: '840px', margin: '0 auto', border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', boxShadow: '0 20px 40px rgba(0,0,0,0.22)', padding: '0.25rem' }}>
  <AnimatedList
  items={['Discovery session', 'Concept direction', 'Design pass', 'Prototype review', 'Build iteration', 'Launch support']}
  onItemSelect={(item, index) => console.log(item, index)}
  showGradients={true}
  enableArrowNavigation={true}
  displayScrollbar={true}
  />
</div>`,

  // BounceCards: usageMarkdown has `const images = [...]` and `const transformStyles = [...]`
  // which both get stripped, leaving the component with no images to show.
  BounceCards: `<BounceCards
  images={['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg', '/joker-square.jpg', '/joker-portrait.jpg']}
  containerWidth={500}
  containerHeight={250}
  animationDelay={0.5}
  animationStagger={0.08}
  easeType="elastic.out(1, 0.5)"
  transformStyles={[
    'rotate(5deg) translate(-150px)',
    'rotate(0deg) translate(-70px)',
    'rotate(-5deg)',
    'rotate(5deg) translate(70px)',
    'rotate(-5deg) translate(150px)',
  ]}
  enableHover={false}
/>`,

  // ScrollStack: requires a fixed-height overflow:hidden container to work with Lenis.
  // Without it the rAF loop runs endlessly and freezes the page. Uses plain divs with
  // className="scroll-stack-card" instead of <ScrollStackItem> to avoid named imports.
  ScrollStack: `<div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
  <ScrollStack
    itemDistance={100}
    itemScale={0.03}
    itemStackDistance={30}
    stackPosition="20%"
    scaleEndPosition="10%"
    baseScale={0.85}
  >
    <div className="scroll-stack-card" style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '3rem', color: 'var(--color-text)' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>Discover</h2>
      <p style={{ opacity: 0.7, lineHeight: 1.7, color: 'var(--color-text)' }}>We start by understanding your vision — your goals, your audience, and the story you want to tell.</p>
    </div>
    <div className="scroll-stack-card" style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '3rem', color: 'var(--color-text)' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>Design</h2>
      <p style={{ opacity: 0.7, lineHeight: 1.7, color: 'var(--color-text)' }}>Every pixel is purposeful. We craft interfaces that feel as good as they look — intuitive, elegant, and built to last.</p>
    </div>
    <div className="scroll-stack-card" style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '3rem', color: 'var(--color-text)' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>Deliver</h2>
      <p style={{ opacity: 0.7, lineHeight: 1.7, color: 'var(--color-text)' }}>From concept to launch, we move fast without cutting corners — shipping products that make a real impact.</p>
    </div>
  </ScrollStack>
</div>`,

  // CircularGallery: usageMarkdown hardcodes textColor="#ffffff" which is invisible on light
  // background pages. Override sets a neutral dark value that works on both light/dark backgrounds.
  CircularGallery: `<div style={{ height: '600px', position: 'relative', overflow: 'hidden' }}>
  <CircularGallery
    bend={3}
    textColor="#111111"
    borderRadius={0.05}
    scrollEase={0.02}
  />
</div>`,

  // ScrambleText: usageMarkdown has `scrambleChars={.:}` which is invalid JSX (unquoted non-identifier).
  // Override uses correct string prop syntax.
  ScrambleText: `<ScrambleText
  className="scrambled-text-demo"
  radius={100}
  duration={1.2}
  speed={0.5}
  scrambleChars=".:!">
  Lorem ipsum dolor sit amet consectetur adipisicing elit.
</ScrambleText>`,

  // Cursor components: their usageMarkdown files are the full component source, not usage examples.
  // Use bare self-closing tags — each component handles its own position:fixed internally.
  SplashCursor: '<SplashCursor />',
  BlobCursor: '<BlobCursor />',
  PixelTrail: '<PixelTrail />',
  TargetCursor: '<TargetCursor />',

  // Stepper: usageMarkdown uses const [name, setName] = useState('') — array destructuring
  // not captured by strippedImportNames regex, leaving dangling state refs in JSX.
  // Also needs { Step } named import which the auto-detection would otherwise handle,
  // but pairing with the clean override avoids the state ref issue entirely.
  Stepper: {
    importLine: "import Stepper, { Step } from './components/Components/Stepper/Stepper';",
    jsx: `<Stepper
  initialStep={1}
  onStepChange={(step) => console.log('step', step)}
  onFinalStepCompleted={() => console.log('complete')}
  backButtonText="Back"
  nextButtonText="Next"
>
  <Step>
    <h2 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Getting Started</h2>
    <p style={{ color: 'var(--color-text)', opacity: 0.75, margin: 0 }}>Welcome. Follow the steps below to continue.</p>
  </Step>
  <Step>
    <h2 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Configure</h2>
    <p style={{ color: 'var(--color-text)', opacity: 0.75, margin: 0 }}>Adjust your preferences and settings here.</p>
  </Step>
  <Step>
    <h2 style={{ color: 'var(--color-text)', margin: '0 0 0.5rem' }}>Complete</h2>
    <p style={{ color: 'var(--color-text)', opacity: 0.75, margin: 0 }}>You are all set. Everything is ready to go.</p>
  </Step>
</Stepper>`,
  },

  ScrollFloat: `<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px', textAlign: 'center' }}>
  <ScrollFloat animationDuration={1} ease='power2.out' scrollStart='top bottom-=10%' scrollEnd='bottom center' stagger={0.025}>
    Crafted with clarity and intention.
  </ScrollFloat>
</div>`,

  GradualBlur: `<div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, background: 'var(--color-surface)' }}>
  <div style={{ padding: '2.5rem 1.5rem', color: 'var(--color-text)', opacity: 0.78 }}>
    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Smooth Focus Transition</h3>
    <p style={{ margin: '0.65rem 0 0', lineHeight: 1.7 }}>Use gradual blur to gently fade long content blocks and create depth without hard edges.</p>
  </div>
  <GradualBlur target="parent" position="bottom" height="22vh" strength={2} divCount={6} curve="bezier" exponential={true} opacity={0.85} />
</div>`,

  // FadeContent: usageMarkdown wraps content in backgroundColor:'#111' which gets stripped,
  // but inner color:'white' and color:'#888' survive — invisible on light-background sites.
  FadeContent: {
    importLine: "import FadeContent from './components/Animations/FadeContent/FadeContent';",
    jsx: `<FadeContent blur={true} duration={1000} delay={200} initialOpacity={0} yOffset={30}>
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <h2 style={{ color: 'var(--color-text)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: '0 0 1rem', fontWeight: 700 }}>
      Crafted with Purpose
    </h2>
    <p style={{ color: 'var(--color-text)', opacity: 0.65, fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
      Every detail considered. Every decision intentional.
    </p>
  </div>
</FadeContent>`,
  },
};

// Image replacements: swap picsum/external URLs with local joker assets
const IMAGE_REPLACEMENTS = [
  [/["']https:\/\/picsum\.photos\/\d+\/\d+[^"']*["']/g, '"/joker-square.jpg"'],
  [/["']https:\/\/picsum\.photos\/\d+[^"']*["']/g, '"/joker-square.jpg"'],
  [/"\/joker-portrait\.jpg"/g, '"/joker-portrait.jpg"'],
  [/"\/joker-landscape\.jpg"/g, '"/joker-landscape.jpg"'],
  [/"\/joker-square\.jpg"/g, '"/joker-square.jpg"'],
];

// Rotate through joker images for multi-image components
const JOKER_IMAGES = ['/joker-square.jpg', '/joker-portrait.jpg', '/joker-landscape.jpg'];
function jokerImg(index) { return JOKER_IMAGES[index % JOKER_IMAGES.length]; }

/**
 * Fix all external image URLs in a JSX string to use local joker assets.
 */
function fixImageUrls(jsx) {
  // Replace picsum URLs with cycling joker images
  let imageIndex = 0;
  jsx = jsx.replace(/["']https:\/\/picsum\.photos[^"']*["']/g, () => `"${jokerImg(imageIndex++)}"`);
  // Replace any remaining http/https image references
  jsx = jsx.replace(/["'](https?:\/\/[^"']*\.(jpg|jpeg|png|webp|gif|svg))[^"']*["']/gi, () => `"${jokerImg(imageIndex++)}"`);
  return jsx;
}

/**
 * Extracts and transforms usageMarkdown into a clean JSX snippet.
 * Adjusts import path for use in generated project's src/ directory.
 */
function extractComponentData(entry) {
  const { name, category, usageMarkdown } = entry;
  const isCursor = CURSOR_NAMES.has(name);
  const isBackground = category === 'Backgrounds';
  const isFixed = isBackground || isCursor;
  const zIndex = isBackground ? 0 : isCursor ? 9999 : category === 'Components' ? 10 : 5;

  const baseImportLine = `import ${name} from './components/${category}/${name}/${name}';`;

  // Use hand-crafted override if available
  if (COMPONENT_JSX_OVERRIDES[name]) {
    const override = COMPONENT_JSX_OVERRIDES[name];
    const isObj = override !== null && typeof override === 'object' && typeof override.jsx === 'string';
    return {
      name, category,
      importLine: isObj ? override.importLine : baseImportLine,
      jsx: isObj ? override.jsx : override,
      isFixed, zIndex,
    };
  }

  if (!usageMarkdown || !usageMarkdown.trim()) {
    return {
      name, category, importLine: baseImportLine,
      jsx: buildPlaceholder(name, isFixed, zIndex),
      isFixed, zIndex,
    };
  }

  // Parse named imports from usageMarkdown before JSX extraction.
  // These get stripped from the import lines but may survive as JSX tags (e.g. <ScrollStackItem>).
  // The regex looks for `{...}` anywhere on an import line to handle both
  // `import { X }` and `import Default, { X }` forms.
  const namedImports = new Set();
  for (const line of usageMarkdown.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('import ') || t.startsWith('import type')) continue;
    const namedMatch = t.match(/\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach(n => {
        const clean = n.trim().split(/\s+as\s+/).pop().trim();
        if (/^[a-zA-Z_$]\w*$/.test(clean)) namedImports.add(clean);
      });
    }
  }

  const raw = usageMarkdown.replace(/\r\n/g, '\n').trim();
  const jsx = buildCleanJsx(name, category, raw, isFixed, zIndex, isCursor);

  // Detect which named sub-components appear as JSX tags in the extracted output.
  // They were stripped from the import line but must be re-included.
  const neededSubs = [...namedImports].filter(n =>
    n !== name && new RegExp(`<${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s/>]`).test(jsx)
  );

  const importLine = neededSubs.length > 0
    ? `import ${name}, { ${neededSubs.join(', ')} } from './components/${category}/${name}/${name}';`
    : baseImportLine;

  return { name, category, importLine, jsx, isFixed, zIndex };
}

/**
 * Builds working JSX from raw usageMarkdown.
 */
function buildCleanJsx(name, category, raw, isFixed, zIndex, isCursor) {
  const lines = raw.split('\n');

  // Track names imported from stripped import lines — their references must also be removed
  const strippedImportNames = new Set();
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('import ') || t.startsWith('import type')) continue;
    // Default import: import Name from '...'
    const defMatch = t.match(/^import\s+(\w+)\s+from/);
    if (defMatch) strippedImportNames.add(defMatch[1]);
    // Named imports: import { Foo, Bar as Baz } from '...'
    const namedMatch = t.match(/import\s*\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach(n => {
        const clean = n.trim().split(/\s+as\s+/).pop().trim();
        if (/^[a-zA-Z_$]\w*$/.test(clean)) strippedImportNames.add(clean);
      });
    }
    // Namespace: import * as Ns from '...'
    const nsMatch = t.match(/import\s*\*\s+as\s+(\w+)/);
    if (nsMatch) strippedImportNames.add(nsMatch[1]);
  }

  // Strip import lines
  const nonImport = lines.filter(l => !l.trim().startsWith('import '));

  let content = nonImport.join('\n').trim();

  // Collect variable declarations from inside the function body BEFORE stripping the wrapper.
  // stripAppWrapper extracts only the return() content, so any `const foo = ...` declared
  // in the function body above the return would be lost — but JSX props like foo={foo}
  // would remain, causing ReferenceError at runtime.
  const funcBodyMatch = content.match(/\{([\s\S]*?)return\s*\(/);
  if (funcBodyMatch) {
    for (const line of funcBodyMatch[1].split('\n')) {
      const m = line.trim().match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)/);
      if (m) strippedImportNames.add(m[1]);
    }
  }

  // Remove export default function App() wrapper if present
  content = stripAppWrapper(content);

  // Remove outer wrapping divs that are purely for demo sizing (100vw/100vh containers)
  content = stripDemoWrappers(content);

  // If content mixes JS declarations with JSX, extract only the JSX portion
  // Pass stripped import names so their references are removed too
  content = extractJsxOnly(content, strippedImportNames);

  // Strip trailing // single-line comments from JSX prop lines
  content = stripJsxLineComments(content);

  // Fix image URLs
  content = fixImageUrls(content);

  // Trim whitespace-only lines at edges
  content = content.trim();

  // If empty or just whitespace, use placeholder
  if (!content || content.length < 10) {
    return buildPlaceholder(name, isFixed, zIndex);
  }

  // For fixed/background components, ensure they have correct positioning style
  if (isFixed) {
    return buildFixedWrapper(name, content, zIndex, isCursor);
  }

  return content;
}

/**
 * Removes export default function App() {} wrapper from usage code.
 */
function stripAppWrapper(content) {
  // Match: export default function App() { ... return ( ... ); }
  // Greedy [\s\S]* so nested ); inside callbacks don't stop the match early.
  const appMatch = content.match(/export\s+default\s+function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s*\(([\s\S]*)\);\s*\}/);
  if (appMatch) return appMatch[1].trim();

  // Match: const App = () => { return ( ... ); }
  const constMatch = content.match(/(?:const|function)\s+\w+\s*(?:=\s*\(\)\s*=>)?\s*\{[\s\S]*?return\s*\(([\s\S]*)\);\s*\}/);
  if (constMatch) return constMatch[1].trim();

  // Match bare return (...)
  const returnMatch = content.match(/^return\s*\(([\s\S]*)\);?\s*$/);
  if (returnMatch) return returnMatch[1].trim();

  return content;
}

/**
 * When usageMarkdown contains JS declarations (const/let/var) followed by JSX,
 * extract only the JSX portion and strip any references to dropped variable/import names.
 * @param {string} content - The code content (imports already stripped)
 * @param {Set<string>} extraStrippedNames - Names from stripped import statements
 */
function extractJsxOnly(content, extraStrippedNames = new Set()) {
  const trimmed = content.trim();
  const hasDeclarations = /^(const|let|var|function)\s/m.test(trimmed);

  const allStrippedNames = new Set(extraStrippedNames);
  let jsxPart = trimmed;

  if (hasDeclarations) {
    const lines = trimmed.split('\n');
    const jsxStartIndex = lines.findIndex(l => l.trim().startsWith('<'));
    if (jsxStartIndex !== -1) {
      // Collect inline-declared variable names too
      for (const line of lines.slice(0, jsxStartIndex)) {
        const m = line.match(/^(?:const|let|var)\s+([a-zA-Z_$]\w*)/);
        if (m) allStrippedNames.add(m[1]);
      }
      jsxPart = lines.slice(jsxStartIndex).join('\n').trim();
    }
  }

  // Remove all references to names that were stripped (import or inline declarations)
  for (const vname of allStrippedNames) {
    const safe = vname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove prop assignment: someProp={varName}
    jsxPart = jsxPart.replace(new RegExp(`\\s+\\w+={${safe}}`, 'g'), '');
    // Remove direct JSX expression: {varName}
    jsxPart = jsxPart.replace(new RegExp(`\\{${safe}\\}`, 'g'), '');
  }

  return jsxPart;
}

/**
 * Strip trailing // single-line comments from JSX prop lines.
 * Avoids stripping inside URLs (e.g. http://).
 */
function stripJsxLineComments(content) {
  // Remove "  // comment" that follows a prop value — negative lookbehind for ":"
  // so http:// and similar are preserved
  return content.replace(/(?<!:)\s*\/\/(?!\/)[^\n]*/g, '');
}

/**
 * Removes 100vw/100vh demo wrapper divs.
 */
function stripDemoWrappers(content) {
  // Strip outermost <div style={{width:'100vw', height:'100vh'...}}> wrappers
  content = content.replace(
    /<div\s+style=\{\{[^}]*(?:100vw|100vh|width:\s*['"]100%['"])[^}]*\}\}>\s*([\s\S]*?)\s*<\/div>\s*$/,
    '$1'
  );
  return content.trim();
}

/**
 * Wraps fixed/background components with the correct position style.
 */
function buildFixedWrapper(name, content, zIndex, isCursor) {
  // Check if the component already has positioning props
  if (content.includes('position:') || content.includes("position: 'fixed'")) {
    return content;
  }

  // Self-closing or full component — add style prop if it's a simple tag
  const selfClosing = content.match(/^<(\w+)([^>]*?)\/>\s*$/s);
  if (selfClosing) {
    const attrs = selfClosing[2].trim();
    return `<${name} ${attrs} style={{ position: 'fixed', inset: 0, zIndex: ${zIndex}, pointerEvents: 'none' }} />`;
  }

  return content;
}

function buildPlaceholder(name, isFixed, zIndex) {
  if (isFixed) {
    return `<${name} style={{ position: 'fixed', inset: 0, zIndex: ${zIndex}, pointerEvents: 'none' }} />`;
  }
  return `<div style={{ padding: '2rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, textAlign: 'center', color: 'var(--color-text)' }}><p style={{ margin: 0, opacity: 0.5 }}>${name}</p></div>`;
}

// ── Load and build the component map ─────────────────────────────────────────

let _manifest = null;
function getManifest() {
  if (!_manifest) {
    try { _manifest = require(MANIFEST_PATH); }
    catch (e) { console.warn('[component-mapper] Could not load manifest:', e.message); _manifest = []; }
  }
  return _manifest;
}

let _componentMap = null;
function getComponentMap() {
  if (_componentMap) return _componentMap;
  const manifest = getManifest();
  _componentMap = {};
  for (const entry of manifest) {
    _componentMap[entry.name] = extractComponentData(entry);
  }
  return _componentMap;
}

/**
 * getComponent(name)
 * Returns { importLine, jsx, isFixed, zIndex, category } for the given component name.
 * Falls back to a placeholder if not found.
 */
function getComponent(name) {
  const map = getComponentMap();
  if (map[name]) return map[name];

  // Unknown component — build a placeholder
  return {
    name,
    category: 'Components',
    importLine: `// import ${name} from './components/Components/${name}/${name}'; // Not found in manifest`,
    jsx: buildPlaceholder(name, false, 10),
    isFixed: false,
    zIndex: 10,
  };
}

/**
 * getMappedNames()
 * Returns array of all component names that have real (non-placeholder) JSX.
 */
function getMappedNames() {
  const map = getComponentMap();
  return Object.values(map)
    .filter(c => !c.jsx.includes('dashed'))
    .map(c => c.name);
}

/**
 * isComponentMapped(name)
 * Returns true if the component has real mapped JSX (not a placeholder).
 */
function isComponentMapped(name) {
  const c = getComponent(name);
  return !c.jsx.includes('dashed');
}

module.exports = { getComponent, getMappedNames, isComponentMapped, isNavComponent };
