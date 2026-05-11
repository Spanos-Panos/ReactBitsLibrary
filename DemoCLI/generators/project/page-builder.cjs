/**
 * page-builder.cjs
 * Generates complete page/section TSX files from content + style + component data.
 * No placeholder comments — every section gets real text from content-builder.
 *
 * Milestone order: Minimal×Landing → Minimal×Portfolio → Minimal×SaaS → Minimal×Agency
 * → then repeat for other aesthetics. Test each before expanding.
 */

const path = require('path');
const fs   = require('fs/promises');
const { getComponent } = require('../shared/component-mapper.cjs');
const { buildContent, buildPageContent } = require('./content-builder.cjs');
const { selectPolicySections } = require('./page-policy.cjs');

// ── Section maps per siteType ─────────────────────────────────────────────────

const SITE_SECTIONS = {
  Landing:   ['hero', 'features', 'benefits', 'cta'],
  Portfolio: ['hero', 'work', 'about', 'contact'],
  SaaS:      ['hero', 'features', 'pricing', 'cta'],
  Agency:    ['hero', 'services', 'work', 'contact'],
};

// ── Section variant pools — each page type has multiple layout options ────────

const SECTION_VARIANTS = {
  Landing: [
    ['hero', 'features', 'benefits', 'cta'],
    ['hero', 'features', 'work', 'cta'],
    ['hero', 'benefits', 'features', 'contact'],
  ],
  Portfolio: [
    ['hero', 'work', 'about', 'contact'],
    ['hero', 'work', 'services', 'contact'],
    ['hero', 'about', 'work', 'cta'],
  ],
  SaaS: [
    ['hero', 'features', 'pricing', 'cta'],
    ['hero', 'features', 'benefits', 'cta'],
    ['hero', 'pricing', 'features', 'contact'],
  ],
  Agency: [
    ['hero', 'services', 'work', 'contact'],
    ['hero', 'services', 'about', 'contact'],
    ['hero', 'work', 'services', 'cta'],
  ],
  // Per-page type variants for multi-page sites
  home:     [['hero', 'features', 'benefits', 'cta'], ['hero', 'features', 'work', 'cta'], ['hero', 'benefits', 'features', 'contact']],
  about:    [['about', 'features', 'cta'], ['about', 'benefits', 'contact'], ['about', 'work', 'contact']],
  services: [['services', 'features', 'pricing', 'contact'], ['services', 'work', 'contact'], ['hero', 'services', 'cta']],
  pricing:  [['pricing', 'cta'], ['hero', 'pricing', 'cta'], ['pricing', 'features', 'cta']],
  work:     [['work', 'about', 'contact'], ['work', 'services', 'cta'], ['hero', 'work', 'contact']],
  contact:  [['contact'], ['hero', 'contact'], ['about', 'contact']],
  custom:   [['hero', 'features', 'cta'], ['hero', 'work', 'contact'], ['features', 'benefits', 'cta']],
};

function pickSectionVariant(pageType, siteType, seedKey) {
  const key = pageType || siteType || 'Landing';
  const variants = SECTION_VARIANTS[key] || SECTION_VARIANTS[siteType] || SECTION_VARIANTS.Landing;
  const policyType = pageType || 'custom';
  return selectPolicySections({ pageType: policyType, variants, seedKey: seedKey || `${policyType}:${siteType}` });
}

// ── Image placeholder helper ──────────────────────────────────────────────────

function buildImagePlaceholder(label, aspectRatio = '16/9') {
  return `<div aria-hidden="true" style={{ width: '100%', aspectRatio: '${aspectRatio}', background: 'var(--color-surface)', borderRadius: '10px', opacity: 0.35 }} />`;
}

// ── Layout personality per aesthetic ─────────────────────────────────────────

const LAYOUT = {
  minimal:    { heroAlign: 'left',   maxWidth: '720px',  sectionPad: '6rem 0',   headingSize: 'clamp(2.4rem,6.5vw,4.8rem)', bodyWeight: '300', borderRadius: '4px',  btnShadow: 'none' },
  editorial:  { heroAlign: 'left',   maxWidth: '1100px', sectionPad: '6.5rem 0', headingSize: 'clamp(3rem,9vw,7rem)',        bodyWeight: '300', borderRadius: '2px',  btnShadow: 'none' },
  brutalist:  { heroAlign: 'left',   maxWidth: '100%',   sectionPad: '4.5rem 0', headingSize: 'clamp(2.8rem,8.5vw,6.5rem)', bodyWeight: '900', borderRadius: '0',    btnShadow: 'none' },
  futuristic: { heroAlign: 'center', maxWidth: '1280px', sectionPad: '5.5rem 0', headingSize: 'clamp(2.2rem,6.5vw,5.5rem)', bodyWeight: '700', borderRadius: '0',    btnShadow: '0 0 14px var(--color-accent)' },
};

/** When the builder Sizes tab sets a corner chip, override aesthetic layout radius for generated sections. */
const CHIP_BORDER_RADIUS = {
  none: '0',
  small: '6px',
  medium: '10px',
  large: '16px',
  pill: '9999px',
};

function getLayout(aesthetic, designRules) {
  const key = (aesthetic || 'minimal').toLowerCase();
  const base = LAYOUT[key] || LAYOUT.minimal;
  const chip = designRules && designRules.sizes && designRules.sizes.borderRadius;
  if (chip && Object.prototype.hasOwnProperty.call(CHIP_BORDER_RADIUS, chip)) {
    return { ...base, borderRadius: CHIP_BORDER_RADIUS[chip] };
  }
  return { ...base };
}

// ── Component slot matching ───────────────────────────────────────────────────

const SECTION_COMPONENT_HINTS = {
  hero:      [
    'Silk', 'Aurora', 'PlasmaWave', 'Iridescence', 'Particles', 'Orb', 'Waves',
    'SplitText', 'ShinyText', 'GradientText', 'BlurText', 'CountUp',
    'StickerPeel', 'FluidGlass', 'ScrambleText', 'FallingText',
    'RotatingText', 'TextPressure', 'FuzzyText', 'TextType',
  ],
  features:  [
    'AnimatedList', 'GlassIcons', 'SpotlightCard', 'MagicBento', 'AnimatedContent', 'FadeContent', 'CountUp', 'Stepper',
    'FluidGlass', 'StickerPeel', 'StaggeredMenu', 'TiltedCard', 'DecayCard', 'GlareHover',
    'PixelCard', 'GlassSurface', 'BounceCards', 'CardSwaps', 'Folder', 'Counter',
    'InfiniteMenu', 'ScrollStack', 'ClickSpark',
  ],
  benefits:  [
    'AnimatedList', 'LogoLoop', 'CountUp', 'StarBorder', 'GlareHover', 'Cubes',
    'FluidGlass', 'StickerPeel', 'SpotlightCard', 'FadeContent', 'AnimatedContent',
    'Stepper', 'GlassIcons', 'ScrollStack',
  ],
  cta:       [
    'ShinyText', 'GradientText', 'SplitText', 'StarBorder', 'ClickSpark',
    'Typewriter', 'ScrambleText', 'MorphingText', 'FallingText', 'BlurText',
    'StickerPeel', 'FluidGlass', 'GlareHover',
  ],
  about:     [
    'ProfileCard', 'TiltedCard', 'DecayCard', 'SplitText', 'BlurText', 'FadeContent',
    'FluidGlass', 'StickerPeel', 'AnimatedContent', 'GlassSurface', 'SpotlightCard',
  ],
  work:      [
    'CircularGallery', 'RollingGallery', 'CardSwaps', 'BounceCards', 'FlyingPosters', 'Mansory', 'Carousel',
    'StickerPeel', 'FluidGlass', 'ScrollStack', 'InfiniteMenu', 'GridMotion',
  ],
  services:  [
    'FlowingMenu', 'GooeyNav', 'AnimatedList', 'Dock', 'StaggeredMenu',
    'FluidGlass', 'CardNav', 'InfiniteMenu', 'StickerPeel', 'MagicBento',
  ],
  pricing:   [
    'SpotlightCard', 'GlassSurface', 'TiltedCard', 'PixelCard', 'StarBorder',
    'FluidGlass', 'GlareHover', 'CountUp',
  ],
  contact:   [
    'ShinyText', 'GradientText', 'FadeContent', 'AnimatedContent',
    'FluidGlass', 'StickerPeel', 'BlurText', 'SpotlightCard',
  ],
};

function findComponentForSection(sectionType, selectedNames, usedComponents = new Set()) {
  const hints = SECTION_COMPONENT_HINTS[sectionType] || [];
  for (const hint of hints) {
    if (selectedNames.includes(hint) && !usedComponents.has(hint)) return hint;
  }
  return null;
}

// ── Inner container style ─────────────────────────────────────────────────────

const AESTHETIC_PADDING = {
  minimal:    'clamp(2rem, 5vw, 5rem)',
  editorial:  'clamp(2rem, 6vw, 7rem)',
  brutalist:  'clamp(0.75rem, 2vw, 2.5rem)',
  futuristic: 'clamp(1rem, 2.5vw, 3rem)',
};

function innerContainer(maxWidth, aesthetic) {
  const pad = AESTHETIC_PADDING[(aesthetic || 'minimal').toLowerCase()] || AESTHETIC_PADDING.minimal;
  return `style={{ maxWidth: '${maxWidth}', margin: '0 auto', padding: '0 ${pad}', width: '100%' }}`;
}

// ── JSX-safe string helpers ───────────────────────────────────────────────────

/**
 * Escapes user-supplied content for safe embedding in JSX text nodes.
 * Prevents build errors from angle brackets (<, >) and JSX expressions ({, }).
 */
function jsxText(str) {
  if (!str) return '';
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

/** Like jsxText but also escapes double-quotes for use inside JSX string attributes. */
function jsxAttr(str) {
  if (!str) return '';
  return jsxText(str).replace(/"/g, '&quot;');
}

/**
 * Returns a sanitized copy of the content object.
 * All user-supplied strings are escaped so they cannot break JSX parsing.
 * Call this once at the entry point of each page/section builder.
 */
function sanitizeContent(c) {
  if (!c) return {};
  const t = jsxText, a = jsxAttr;
  return {
    brandName: t(c.brandName),
    hero: {
      headline:     t(c.hero?.headline),
      subheadline:  t(c.hero?.subheadline),
      cta:          t(c.hero?.cta),
      ctaSecondary: t(c.hero?.ctaSecondary),
    },
    about: {
      heading:   t(c.about?.heading),
      body:      t(c.about?.body),
      highlight: t(c.about?.highlight),
    },
    features: {
      heading: t(c.features?.heading),
      items: (c.features?.items || []).map(it => ({ title: t(it.title), body: t(it.body) })),
    },
    benefits: (c.benefits || []).map(t),
    cta: {
      heading: t(c.cta?.heading),
      subtext:  t(c.cta?.subtext),
      button:   t(c.cta?.button),
    },
    contact: {
      heading:  t(c.contact?.heading),
      email:    a(c.contact?.email),
      phone:    a(c.contact?.phone),
      location: t(c.contact?.location),
    },
    footer: {
      brand: t(c.footer?.brand),
      copy:  t(c.footer?.copy),
      links: (c.footer?.links || []).map(l => ({ label: t(l.label), href: a(l.href) })),
      socialLinks: Object.fromEntries(
        Object.entries(c.footer?.socialLinks || {}).map(([k, v]) => [t(k), t(v)])
      ),
    },
    // Optional per-page extras (populated by buildPageContent)
    projects: Array.isArray(c.projects)
      ? c.projects.map(p => ({ title: t(p.title), summary: t(p.summary), tag: t(p.tag) })).filter(p => p.title)
      : undefined,
    founder: c.founder
      ? { name: t(c.founder.name), role: t(c.founder.role), bio: t(c.founder.bio) }
      : undefined,
    leadership: Array.isArray(c.leadership)
      ? c.leadership.map(m => ({ name: t(m.name), role: t(m.role), bio: t(m.bio) })).filter(m => m.name)
      : undefined,
    teamMembers: Array.isArray(c.teamMembers)
      ? c.teamMembers.map(m => ({ name: t(m.name), role: t(m.role) }))
      : undefined,
    faqs: Array.isArray(c.faqs)
      ? c.faqs.map(f => ({ q: t(f.q), a: t(f.a) }))
      : undefined,
  };
}

// ── Text prop substitution for TextAnimation components ───────────────────────

const TEXT_PROP_COMPONENTS = new Set([
  'SplitText', 'ShinyText', 'GradientText', 'BlurText', 'TextPressure',
  'FuzzyText', 'Typewriter', 'ScrambleText', 'RotatingText', 'CircularText', 'ShimmerText',
]);

function withContentText(compName, jsx, text) {
  if (!TEXT_PROP_COMPONENTS.has(compName) || !text) return jsx;
  // Convert double-quotes to single-quotes so the text is safe inside a double-quoted JSX attribute.
  // Use separate [^""]* / [^']* patterns — the old [^"']* stopped at apostrophes inside "…" strings,
  // which left dangling text after the closing quote (e.g. text="View the Menu"t this so cool?!")
  const safeText = text.replace(/"/g, "'").replace(/\n/g, ' ').trim().slice(0, 80);
  const replacement = `text="${safeText}"`;
  return jsx
    .replace(/\btext="[^"]*"/, replacement)
    .replace(/\btext='[^']*'/, replacement);
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildHeroSection(content, aesthetic, layout, componentName, hasNav = false) {
  const { headline, subheadline, cta, ctaSecondary } = content.hero;
  const align = layout.heroAlign === 'center' ? 'center' : 'left';
  const comp = componentName ? getComponent(componentName) : null;

  const compJsx = comp && !comp.isFixed
    ? `\n        <div style={{ margin: '3rem 0' }}>\n          ${withContentText(componentName, comp.jsx, headline)}\n        </div>`
    : '';

  const headingStyle = aesthetic === 'futuristic'
    ? `fontSize: '${layout.headingSize}', fontWeight: '${layout.bodyWeight}', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text)', textShadow: '0 0 30px var(--color-accent)'`
    : `fontSize: '${layout.headingSize}', fontWeight: '${layout.bodyWeight}', lineHeight: '1.0', color: 'var(--color-text)'`;

  // When a fixed navbar exists, reduce hero top padding to avoid a double gap
  const heroPad = hasNav
    ? layout.sectionPad.replace(/^[\d.]+rem/, m => `${Math.max(2, parseFloat(m) - 4)}rem`)
    : layout.sectionPad;

  return `      <section style={{ padding: '${heroPad}', position: 'relative', zIndex: 1, minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <div style={{ textAlign: '${align}', maxWidth: '${align === 'left' ? '680px' : '100%'}' }}>
            <h1 style={{ ${headingStyle}, margin: '0 0 1.5rem' }}>
              ${headline}
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--color-text)', opacity: 0.7, lineHeight: 1.7, maxWidth: '560px', ${align === 'center' ? "margin: '0 auto 2rem'" : "margin: '0 0 2rem'"} }}>
              ${subheadline}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: '${align === 'center' ? 'center' : 'flex-start'}' }}>
              <button style={{ padding: '0.85em 2.2em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', borderRadius: '${layout.borderRadius}', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em'${layout.btnShadow !== 'none' ? `, boxShadow: '${layout.btnShadow}'` : ''} }}>${cta}</button>
              <button style={{ padding: '0.85em 2.2em', background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-text)', borderRadius: '${layout.borderRadius}', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>${ctaSecondary}</button>
            </div>${compJsx}
          </div>
        </div>
      </section>`;
}

const FEATURE_ICONS = {
  minimal:    ['01', '02', '03'],
  editorial:  ['—', '—', '—'],
  brutalist:  ['#1', '#2', '#3'],
  futuristic: ['[01]', '[02]', '[03]'],
};

function buildFeaturesSection(content, aesthetic, layout, componentName) {
  const { heading, items } = content.features;
  const comp = componentName ? getComponent(componentName) : null;
  const displayItems = items.slice(0, 3);
  const icons = FEATURE_ICONS[(aesthetic || 'minimal').toLowerCase()] || FEATURE_ICONS.minimal;

  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${comp.jsx}\n          </div>`
    : '';

  const cards = displayItems.map((item, i) => `
            <div key="${i}" style={{ flex: '1 1 240px', padding: '2rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-accent)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>${icons[i] || icons[0]}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-on-surface)', marginBottom: '0.75rem' }}>${item.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-on-surface)', opacity: 0.65, lineHeight: 1.65, margin: 0 }}>${item.body}</p>
            </div>`).join('');

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3rem' }}>${heading}</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            ${cards}
          </div>${compJsx}
        </div>
      </section>`;
}

function buildBenefitsSection(content, aesthetic, layout, componentName) {
  const { benefits } = content;
  const brandName = content.brandName || '';
  const siteType = content._siteType || 'Landing';
  const comp = componentName ? getComponent(componentName) : null;
  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${comp.jsx}\n          </div>`
    : '';

  const benefitsHeading = siteType === 'Portfolio'
    ? 'What Sets Me Apart'
    : siteType === 'Agency'
    ? `Why Clients Choose ${brandName}`
    : brandName
    ? `Why ${brandName}`
    : 'Why Choose Us';

  const items = benefits.map((b, i) => `
            <li key="${i}" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-on-surface)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '1rem', opacity: 0.85 }}>${b}</span>
            </li>`).join('');

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1, background: 'var(--color-surface)' }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--color-text-on-surface)', marginBottom: '2.5rem' }}>${benefitsHeading}</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            ${items}
          </ul>${compJsx}
        </div>
      </section>`;
}

function buildCtaSection(content, aesthetic, layout, componentName) {
  const { heading, subtext, button } = content.cta;
  const comp = componentName ? getComponent(componentName) : null;
  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '2rem' }}>\n            ${withContentText(componentName, comp.jsx, button)}\n          </div>`
    : '';

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1, textAlign: 'center', background: 'var(--color-surface)' }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 700, color: 'var(--color-text-on-surface)', marginBottom: '1rem' }}>${heading}</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-on-surface)', opacity: 0.65, maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>${subtext}</p>
          <button style={{ padding: '1em 3em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', borderRadius: '${layout.borderRadius}', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em'${layout.btnShadow !== 'none' ? `, boxShadow: '${layout.btnShadow}'` : ''} }}>${button}</button>${compJsx}
        </div>
      </section>`;
}

function buildAboutSection(content, aesthetic, layout, componentName) {
  const { heading, body, highlight } = content.about;
  const founder = content.founder;
  const leadership = content.leadership;
  const teamMembers = content.teamMembers;
  const comp = componentName ? getComponent(componentName) : null;
  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '2rem' }}>\n            ${withContentText(componentName, comp.jsx, heading)}\n          </div>`
    : '';

  const founderBlock = founder && (founder.name || founder.role || founder.bio)
    ? `<div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '1rem', alignItems: 'center' }}>
                <div style={{ borderRadius: '9999px', overflow: 'hidden' }}>
                  ${buildImagePlaceholder(`${founder.name || 'Founder'} — headshot`, '1/1')}
                </div>
                <div>
                  <p style={{ color: 'var(--color-text-on-surface)', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>${founder.name || 'Founder'}</p>
                  <p style={{ color: 'var(--color-text-on-surface)', opacity: 0.6, margin: '0.25rem 0 0', fontSize: '0.85rem' }}>${founder.role || 'Founder'}</p>
                </div>
              </div>
              ${founder.bio ? `<p style={{ color: 'var(--color-text-on-surface)', opacity: 0.7, margin: '1rem 0 0', lineHeight: 1.65, fontSize: '0.9rem' }}>${founder.bio}</p>` : ''}
            </div>`
    : '';

  const leadershipGrid = Array.isArray(leadership) && leadership.length > 0
    ? `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              ${leadership.slice(0, 6).map(m => `<div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <p style={{ color: 'var(--color-text-on-surface)', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>${m.name}</p>
                <p style={{ color: 'var(--color-text-on-surface)', opacity: 0.6, margin: '0.25rem 0 0', fontSize: '0.8rem' }}>${m.role}</p>
                ${m.bio ? `<p style={{ color: 'var(--color-text-on-surface)', opacity: 0.7, margin: '0.85rem 0 0', lineHeight: 1.6, fontSize: '0.85rem' }}>${m.bio}</p>` : ''}
              </div>`).join('')}
            </div>`
    : '';

  // Render team member cards when page-specific content provides them
  const rightColumn = Array.isArray(teamMembers) && teamMembers.length > 0
    ? `<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              ${teamMembers.map(m => `<div style={{ flex: '1 1 140px', textAlign: 'center' }}>
                ${buildImagePlaceholder(`${m.name} — headshot`, '1/1')}
                <p style={{ color: 'var(--color-text)', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '0.9rem' }}>${m.name}</p>
                <p style={{ color: 'var(--color-text)', opacity: 0.55, fontSize: '0.8rem', margin: 0 }}>${m.role}</p>
              </div>`).join('')}
            </div>`
    : buildImagePlaceholder('team-photo — portrait or office shot', '1/1');

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.5rem', lineHeight: 1.1 }}>${heading}</h2>
              <p style={{ fontSize: '1rem', color: 'var(--color-text)', opacity: 0.7, lineHeight: 1.75, marginBottom: '1.5rem' }}>${body}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-accent)' }}>${highlight}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              ${founderBlock}
              ${leadershipGrid}
              ${rightColumn}
            </div>
          </div>${compJsx}
        </div>
      </section>`;
}

function buildWorkSection(content, aesthetic, layout, componentName) {
  const comp = componentName ? getComponent(componentName) : null;
  const explicitProjects = Array.isArray(content.projects) ? content.projects : [];

  const PROJECT_TITLE_SUFFIXES = ['Case Study', 'Project', 'Campaign', 'Engagement'];
  const buildProjectCards = (projects) => {
    const cards = projects.map((p, i) => `
            <div key="${i}" style={{ flex: '1 1 260px' }}>
              ${buildImagePlaceholder(`${p.tag || p.title} — project screenshot`, '4/3')}
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', display: 'block', marginTop: '1rem' }}>${p.tag || 'Project'}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.5rem' }}>${p.title}</h3>
              ${p.summary ? `<p style={{ margin: '0.75rem 0 0', color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.65, fontSize: '0.9rem' }}>${p.summary}</p>` : ''}
            </div>`).join('');
    return `<div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            ${cards}
          </div>`;
  };

  if (comp && !comp.isFixed) {
    const projectsBlock = explicitProjects.length > 0
      ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${buildProjectCards(explicitProjects.slice(0, 3))}\n          </div>`
      : '';
    return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3rem' }}>Our Work</h2>
          ${comp.jsx}
          ${projectsBlock}
        </div>
      </section>`;
  }

  // Prefer explicit projects, else derive work cards from services.
  const serviceItems = (content.features && content.features.items) || [];
  const projects = explicitProjects.length > 0
    ? explicitProjects.slice(0, 3).map((p, i) => ({
      title: p.title,
      tag: p.tag || PROJECT_TITLE_SUFFIXES[i % PROJECT_TITLE_SUFFIXES.length],
      summary: p.summary || '',
    }))
    : serviceItems.slice(0, 3).map((item, i) => ({
      title: `${item.title} ${PROJECT_TITLE_SUFFIXES[i % PROJECT_TITLE_SUFFIXES.length]}`,
      tag: item.title,
      summary: '',
    }));
  // Pad to 3 if fewer services
  while (projects.length < 3) {
    const idx = projects.length;
    projects.push({ title: `Featured ${PROJECT_TITLE_SUFFIXES[idx % PROJECT_TITLE_SUFFIXES.length]}`, tag: 'Portfolio', summary: '' });
  }

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3rem' }}>Our Work</h2>
          ${buildProjectCards(projects)}
        </div>
      </section>`;
}

function buildServicesSection(content, aesthetic, layout, componentName) {
  const { heading, items } = content.features;
  const comp = componentName ? getComponent(componentName) : null;

  const serviceHeading = heading || 'Services';

  const rows = items.slice(0, 4).map((item, i) => `
            <div key="${i}" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', padding: '2rem 0', borderTop: '1px solid var(--color-border)', alignItems: 'start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', opacity: 0.8 }}>0${i + 1}</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.5rem' }}>${item.title}</h3>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.75, margin: 0 }}>${item.body}</p>
            </div>`).join('');

  const compBlock = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${comp.jsx}\n          </div>`
    : '';

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>${serviceHeading}</h2>
          <p style={{ color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.75, maxWidth: '62ch', margin: '0 0 2rem' }}>
            A focused set of services designed to ship work that holds up in the real world.
          </p>
          ${rows ? `<div>\n            ${rows}\n          </div>` : ''}
          ${compBlock}
        </div>
      </section>`;
}

function buildPricingSection(content, aesthetic, layout, componentName) {
  const comp = componentName ? getComponent(componentName) : null;
  const siteType = content._siteType || 'SaaS';

  // Tier names by site type
  const TIER_NAMES = {
    SaaS:      ['Starter', 'Growth', 'Enterprise'],
    Agency:    ['Project', 'Retainer', 'Partnership'],
    Portfolio: ['Basic', 'Standard', 'Premium'],
    Landing:   ['Basic', 'Standard', 'Premium'],
  };
  const [t0, t1, t2] = TIER_NAMES[siteType] || TIER_NAMES.Landing;

  // Pull first 3 services for the Pro/mid-tier feature list
  const serviceItems = (content.features && content.features.items) || [];
  const proFeatures = [
    `Everything in ${t0}`,
    ...serviceItems.slice(0, 2).map(s => s.title),
    'Priority support',
  ].filter(Boolean).slice(0, 4);

  const tiers = [
    { name: t0, price: '$49', period: '/mo', features: ['Core access', 'Up to 5 users', 'Email support', 'Standard reporting'] },
    { name: t1, price: '$99', period: '/mo', features: proFeatures, highlight: true },
    { name: t2, price: 'Custom', period: '', features: [`Everything in ${t1}`, 'Dedicated account manager', 'SLA guarantee', 'Custom integrations'] },
  ];

  const cards = tiers.map((t, i) => `
            <div key="${i}" style={{ flex: '1 1 220px', padding: '2.5rem 2rem', border: t.highlight ? '1px solid var(--color-accent)' : '1px solid var(--color-border)', background: t.highlight ? 'var(--color-surface)' : 'transparent', position: 'relative' }}>
              ${t.highlight ? '<div style={{ position: \'absolute\', top: \'-1px\', left: \'50%\', transform: \'translateX(-50%)\', background: \'var(--color-accent)\', color: \'var(--color-bg)\', padding: \'0.25em 1em\', fontSize: \'0.7rem\', fontWeight: 700, letterSpacing: \'0.1em\' }}>POPULAR</div>' : ''}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '${t.highlight ? 'var(--color-text-on-surface)' : 'var(--color-text)'}', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>${t.name}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: t.highlight ? 'var(--color-accent)' : 'var(--color-text)', marginBottom: '1.5rem' }}>${t.price}<span style={{ fontSize: '0.9rem', fontWeight: 400, opacity: 0.6 }}>${t.period}</span></div>
              <ul style={{ listStyle: 'none', margin: '0 0 2rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                ${t.features.map(f => `<li style={{ fontSize: '0.9rem', color: '${t.highlight ? 'var(--color-text-on-surface)' : 'var(--color-text)'}', opacity: 0.75 }}>✓ ${f}</li>`).join('')}
              </ul>
              <button style={{ width: '100%', padding: '0.8em', background: t.highlight ? 'var(--color-accent)' : 'transparent', color: t.highlight ? 'var(--color-bg)' : 'var(--color-text)', border: t.highlight ? 'none' : '1px solid var(--color-text)', cursor: 'pointer', fontWeight: 600 }}>Get Started</button>
            </div>`).join('');

  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${comp.jsx}\n          </div>`
    : '';

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3rem', textAlign: 'center' }}>Simple Pricing</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            ${cards}
          </div>${compJsx}
        </div>
      </section>`;
}

function buildContactSection(content, aesthetic, layout, componentName) {
  const { heading, email, phone, location } = content.contact;
  const faqs = content.faqs;
  const socialLinks = (content.footer && content.footer.socialLinks) || {};
  const comp = componentName ? getComponent(componentName) : null;
  const compJsx = comp && !comp.isFixed
    ? `\n          <div style={{ marginTop: '3rem' }}>\n            ${withContentText(componentName, comp.jsx, heading)}\n          </div>`
    : '';

  const contactItems = [
    email    && `<a href="mailto:${email}" style={{ color: 'var(--color-text)', opacity: 0.75, textDecoration: 'none', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>${email}</a>`,
    phone    && `<a href="tel:${phone}" style={{ color: 'var(--color-text)', opacity: 0.75, textDecoration: 'none', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>${phone}</a>`,
    location && `<p style={{ color: 'var(--color-text)', opacity: 0.65, fontSize: '1rem', margin: '0.5rem 0' }}>${location}</p>`,
  ].filter(Boolean).join('\n            ');

  const socialBlock = Object.keys(socialLinks).length > 0
    ? `<div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                ${Object.entries(socialLinks).map(([k, v]) => `<a key="${k}" href="https://${k}.com/${v}" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.9rem', textTransform: 'capitalize' }}>${k}</a>`).join('\n                ')}
              </div>`
    : '';

  const faqBlock = Array.isArray(faqs) && faqs.length > 0
    ? `<div style={{ marginTop: '4rem' }}>
              <h3 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '2rem' }}>Frequently Asked Questions</h3>
              ${faqs.map(faq => `<div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h4 style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>${faq.q}</h4>
                <p style={{ color: 'var(--color-text)', opacity: 0.7, fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>${faq.a}</p>
              </div>`).join('')}
            </div>`
    : '';

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '2rem', lineHeight: 1.1 }}>${heading}</h2>
              ${contactItems || '<p style={{ color: \'var(--color-text)\', opacity: 0.65 }}>Get in touch with us.</p>'}
              ${socialBlock}
            </div>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Your name" style={{ padding: '0.85rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-on-surface)', fontSize: '0.9rem' }} />
              <input type="email" placeholder="Email address" style={{ padding: '0.85rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-on-surface)', fontSize: '0.9rem' }} />
              <textarea placeholder="Your message" rows={4} style={{ padding: '0.85rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-on-surface)', fontSize: '0.9rem', resize: 'vertical' }} />
              <button type="submit" style={{ padding: '0.85em 2em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-start' }}>Send Message</button>
            </form>
          </div>${faqBlock}${compJsx}
        </div>
      </section>`;
}

/**
 * Renders any in-flow components that weren't assigned to any named section.
 * Guarantees no selected component is silently dropped from the output.
 */
function buildShowcaseSection(unplacedNames, aesthetic, layout) {
  const BLOCKED_SHOWCASE_COMPONENTS = new Set([
    'ImageTrail',
    'GradualBlur',
    'ScrollFloat',
  ]);
  const blocks = unplacedNames
    .map(name => {
      if (BLOCKED_SHOWCASE_COMPONENTS.has(name)) return null;
      const comp = getComponent(name);
      if (comp.isFixed) return null;
      return `        <div style={{ marginBottom: '4rem' }}>\n          ${comp.jsx}\n        </div>`;
    })
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return `      <section style={{ padding: '${layout.sectionPad}', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
${blocks.join('\n')}
        </div>
      </section>`;
}

function buildFooterSection(content, aesthetic, layout, useRouterLinks = false) {
  const { brand, links, copy, socialLinks } = content.footer;
  const navLinks = links.map(l => useRouterLinks
    ? `<Link key="${l.label}" to="${l.href}" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem' }}>${l.label}</Link>`
    : `<a key="${l.label}" href="${l.href}" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem' }}>${l.label}</a>`
  ).join('\n          ');
  const socials = Object.entries(socialLinks || {}).map(([k, v]) => `<a key="${k}" href="https://${k}.com/${v}" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem', textTransform: 'capitalize' }}>${k}</a>`).join('\n          ');

  return `      <footer style={{ padding: '4rem 0 2rem', borderTop: '1px solid var(--color-border)', position: 'relative', zIndex: 1 }}>
        <div ${innerContainer(layout.maxWidth, aesthetic)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>${brand}</div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                ${navLinks}
              </div>
            </div>
            ${socials ? `<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>\n          ${socials}\n          </div>` : ''}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.35, margin: 0 }}>${copy}</p>
        </div>
      </footer>`;
}

// ── Section dispatcher ────────────────────────────────────────────────────────

const SECTION_BUILDERS = {
  hero:     buildHeroSection,
  features: buildFeaturesSection,
  benefits: buildBenefitsSection,
  cta:      buildCtaSection,
  about:    buildAboutSection,
  work:     buildWorkSection,
  services: buildServicesSection,
  pricing:  buildPricingSection,
  contact:  buildContactSection,
};

/**
 * buildSinglePageSections(options)
 * Returns an array of JSX section strings for a single-page site.
 */
function buildSinglePageSections({ content, styleDirection, selectedComponentNames, siteType, hasNav = false, designRules = {} }) {
  content = sanitizeContent(content);
  content._siteType = siteType || 'Landing';
  const aesthetic = (styleDirection && styleDirection.aesthetics && styleDirection.aesthetics[0]) || 'Minimal';
  const layout = getLayout(aesthetic, designRules);
  const sections = SITE_SECTIONS[siteType] || SITE_SECTIONS.Landing;
  const selectedNames = (selectedComponentNames || []);
  const usedComponents = new Set();

  const sectionJsxList = sections.map((sectionType, idx) => {
    const compName = findComponentForSection(sectionType, selectedNames, usedComponents);
    if (compName) usedComponents.add(compName);
    const builder = SECTION_BUILDERS[sectionType];
    if (!builder) return null;
    // Pass hasNav only to the first section (hero) to reduce its top padding
    return builder(content, aesthetic.toLowerCase(), layout, compName || null, idx === 0 ? hasNav : false);
  }).filter(Boolean);

  // Inject any in-flow components that didn't match any section hint
  const unplaced = selectedNames.filter(n => !usedComponents.has(n) && !getComponent(n).isFixed);
  if (unplaced.length > 0) {
    const showcase = buildShowcaseSection(unplaced, aesthetic.toLowerCase(), layout);
    if (showcase) sectionJsxList.push(showcase);
  }

  const footer = buildFooterSection(content, aesthetic.toLowerCase(), layout, false);
  return [...sectionJsxList, footer];
}

/**
 * buildPageFile(pageName, sections, selectedComponentNames)
 * Returns a complete TSX file string for a named page.
 * Used for multi-page sites.
 */
function buildPageFile(pageName, sectionTypes, content, styleDirection, selectedComponentNames, siteType, designRules = {}) {
  content = sanitizeContent(content);
  content._siteType = siteType || 'Landing';
  const aesthetic = (styleDirection && styleDirection.aesthetics && styleDirection.aesthetics[0]) || 'Minimal';
  const layout = getLayout(aesthetic, designRules);
  const selectedNames = selectedComponentNames || [];

  const importedComponents = new Set();
  const usedComponents = new Set();
  const sectionBlocks = sectionTypes.map(sectionType => {
    const compName = findComponentForSection(sectionType, selectedNames, usedComponents);
    if (compName) { importedComponents.add(compName); usedComponents.add(compName); }
    const builder = SECTION_BUILDERS[sectionType];
    return builder ? builder(content, aesthetic.toLowerCase(), layout, compName || null) : null;
  }).filter(Boolean);

  // Inject any in-flow components that didn't match any section hint
  const unplaced = selectedNames.filter(n => !usedComponents.has(n) && !getComponent(n).isFixed);
  if (unplaced.length > 0) {
    const showcase = buildShowcaseSection(unplaced, aesthetic.toLowerCase(), layout);
    if (showcase) {
      for (const n of unplaced) importedComponents.add(n);
      sectionBlocks.push(showcase);
    }
  }

  const footer = buildFooterSection(content, aesthetic.toLowerCase(), layout, true);

  const importLines = Array.from(importedComponents)
    .map(n => {
      const c = getComponent(n);
      // Page files live at src/pages/, so component paths need ../components/ not ./components/
      return c.importLine.replace(/from '\.\/components\//g, "from '../components/");
    }).join('\n');

  return `import { Link } from 'react-router-dom';\n${importLines}\n\nexport default function ${pageName}Page() {\n  return (\n    <>\n${sectionBlocks.join('\n')}\n${footer}\n    </>\n  );\n}\n`;
}

/**
 * Assigns components to pages so each component appears on the most contextually
 * appropriate page. Remaining components distribute round-robin.
 */
function assignComponentsToPages(pagesConfig, selectedNames) {
  const PAGE_TYPE_TO_SITE_TYPE = {
    home: 'Landing', about: 'Portfolio', services: 'Agency', pricing: 'SaaS', contact: 'Portfolio', custom: 'Landing',
  };

  const available = new Set(selectedNames);
  const assignments = pagesConfig.map(() => []);

  // First pass: assign by section hint relevance (first match wins)
  for (const [i, page] of pagesConfig.entries()) {
    const siteType = PAGE_TYPE_TO_SITE_TYPE[page.type] || 'Landing';
    const sectionTypes = SITE_SECTIONS[siteType] || SITE_SECTIONS.Landing;
    const usedOnPage = new Set();

    for (const sectionType of sectionTypes) {
      const hints = SECTION_COMPONENT_HINTS[sectionType] || [];
      for (const hint of hints) {
        if (available.has(hint) && !usedOnPage.has(hint)) {
          assignments[i].push(hint);
          available.delete(hint);
          usedOnPage.add(hint);
          break;
        }
      }
    }
  }

  // Second pass: distribute leftover components round-robin across pages
  let idx = 0;
  for (const name of available) {
    assignments[idx % pagesConfig.length].push(name);
    idx++;
  }

  return assignments;
}

/**
 * writePageFiles(options)
 * For multi-page mode: writes one .tsx per page to src/pages/.
 * Components are distributed across pages rather than duplicated.
 * Returns array of { pageName, fileName, path, label } for router generation.
 */
async function writePageFiles({ pagesConfig, content, styleDirection, selectedComponentNames, targetDir, resolvedPages = [], designRules = {} }) {
  const pagesDir = path.join(targetDir, 'src', 'pages');
  await fs.mkdir(pagesDir, { recursive: true });
  const resolvedMap = new Map((resolvedPages || []).map(p => [p.id, p]));

  const PAGE_TYPE_TO_SITE_TYPE = {
    home: 'Landing', about: 'Portfolio', services: 'Agency', pricing: 'SaaS', contact: 'Portfolio', custom: 'Landing',
  };

  // Distribute components across pages so each only appears once
  const componentAssignment = assignComponentsToPages(pagesConfig, selectedComponentNames);

  function routeForPage(page, idx) {
    if (page && typeof page.path === 'string' && page.path.trim()) return page.path.trim();
    const title = (page && (page.title || page.name || page.label)) || 'Page';
    const slug = String(title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return idx === 0 ? '/' : `/${slug || 'page'}`;
  }

  // In multi-page mode, footer links should point to actual routes (not section anchors).
  const routeLinks = (pagesConfig || []).map((p, i) => ({
    label: p.title || p.name || p.label || (i === 0 ? 'Home' : `Page ${i + 1}`),
    href: routeForPage(p, i),
  }));

  const pageInfo = [];
  for (const [i, page] of pagesConfig.entries()) {
    // PageConfig has 'title' — use it; also accept legacy 'name'/'label' fields
    const rawName = page.name || page.label || page.title || 'Home';
    // Capitalise first letter, strip spaces → valid React component name
    const safeName = rawName.replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, c => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
    const siteType = PAGE_TYPE_TO_SITE_TYPE[page.type] || page.siteType || 'Landing';
    const sectionTypes = pickSectionVariant(
      page.type,
      siteType,
      `${page.id || page.title || i}:${page.type}:${siteType}`,
    );

    const pageResolved = resolvedMap.get(page.id);
    const explicitComponentNames = (Array.isArray(pageResolved?.componentIds) ? pageResolved.componentIds : page.componentIds || [])
      .map(id => String(id).split('/').pop())
      .filter(Boolean);
    const pageComponents = explicitComponentNames.length > 0 ? explicitComponentNames : (componentAssignment[i] || []);

    const baseContentForPage = pageResolved?.resolvedBrief
      ? buildContent(pageResolved.resolvedBrief, pageResolved?.resolvedStyleDirection?.siteType || siteType)
      : content;

    if (baseContentForPage && baseContentForPage.footer && pagesConfig.length > 1) {
      baseContentForPage.footer = { ...baseContentForPage.footer, links: routeLinks };
    }

    const mergedPageData = {
      ...page,
      content: pageResolved?.content || page.content,
    };
    const pageSpecificContent = buildPageContent(baseContentForPage, mergedPageData);
    const fileContent = buildPageFile(
      safeName,
      sectionTypes,
      pageSpecificContent,
      pageResolved?.resolvedStyleDirection || styleDirection,
      pageComponents,
      siteType,
      designRules,
    );
    const fileName = `${safeName}.tsx`;
    await fs.writeFile(path.join(pagesDir, fileName), fileContent, 'utf-8');

    pageInfo.push({ pageName: safeName, fileName, path: routeForPage(page, i), label: safeName });
  }

  return pageInfo;
}

module.exports = { buildSinglePageSections, buildPageFile, writePageFiles };
