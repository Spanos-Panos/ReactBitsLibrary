/**
 * content-builder.cjs
 * Turns a clientBrief object into a structured content map consumed by page-builder.
 * All text must come from brief fields — never "Lorem ipsum" or generic AI slop.
 */

const INDUSTRY_FALLBACKS = {
  tech:       { brand: 'Studio',  services: ['Web Development', 'Cloud Architecture', 'Digital Transformation'],
                benefits: ['Ship faster with modern tooling', 'Battle-tested architecture patterns', 'Seamless cloud-native deployment', 'Dedicated technical support'] },
  design:     { brand: 'Studio',  services: ['Brand Identity', 'UI/UX Design', 'Creative Direction'],
                benefits: ['Design that converts, not just impresses', 'Research-driven visual strategy', 'Consistent identity across every touchpoint', 'Iterative process with clear milestones'] },
  marketing:  { brand: 'Agency',  services: ['Growth Strategy', 'Content Marketing', 'Paid Acquisition'],
                benefits: ['Data-backed growth playbooks', 'Full-funnel campaign management', 'Transparent reporting every step', 'Proven ROI across channels'] },
  finance:    { brand: 'Advisors',services: ['Wealth Management', 'Financial Planning', 'Investment Strategy'],
                benefits: ['Independent, conflict-free advice', 'Fiduciary standard on every decision', 'Long-term focus, not short-term trading', 'Clear fee structure with no surprises'] },
  health:     { brand: 'Clinic',  services: ['Primary Care', 'Preventive Health', 'Wellness Coaching'],
                benefits: ['Whole-person care philosophy', 'Same-day appointments available', 'Evidence-based treatment protocols', 'Continuous care between visits'] },
  legal:      { brand: 'Law',     services: ['Corporate Law', 'Intellectual Property', 'Contract Review'],
                benefits: ['Commercial-minded legal counsel', 'Fixed-fee engagements available', 'Senior attorney on every matter', 'Turnaround within agreed timelines'] },
  real_estate:{ brand: 'Group',   services: ['Residential Sales', 'Commercial Leasing', 'Property Management'],
                benefits: ['Deep local market knowledge', 'Negotiation expertise at every deal', 'Transparent, end-to-end process', 'Full portfolio reporting included'] },
  default:    { brand: 'Lab',     services: ['Strategy', 'Execution', 'Growth'],
                benefits: ['Outcome-focused from day one', 'Senior expertise, no hand-off to juniors', 'Clear timelines with weekly check-ins', 'Proven track record across industries'] },
};

function detectIndustry(brief) {
  const text = `${brief.industry} ${brief.description}`.toLowerCase();
  if (text.match(/tech|software|dev|code|saas|app|digital/)) return 'tech';
  if (text.match(/design|creative|brand|visual|studio/)) return 'design';
  if (text.match(/market|growth|agency|ads|seo|content/)) return 'marketing';
  if (text.match(/financ|invest|wealth|bank|account/)) return 'finance';
  if (text.match(/health|medical|clinic|wellness|care/)) return 'health';
  if (text.match(/legal|law|attorney|counsel/)) return 'legal';
  if (text.match(/real estate|property|realtor|housing/)) return 'real_estate';
  return 'default';
}

function parseBrandName(brief, siteType) {
  if (brief.brandName && brief.brandName.trim()) return brief.brandName.trim();
  const industry = detectIndustry(brief);
  const fb = INDUSTRY_FALLBACKS[industry] || INDUSTRY_FALLBACKS.default;
  const typeWord = siteType === 'Portfolio' ? 'Portfolio' : siteType === 'Agency' ? 'Agency' : siteType === 'SaaS' ? 'Platform' : 'Studio';
  return `${fb.brand} ${typeWord}`;
}

function parseServices(brief, siteType) {
  if (brief.services && brief.services.trim()) {
    const items = brief.services
      .split(/\n|,|;/)
      .map(s => s.trim())
      .filter(Boolean);
    if (items.length > 0) {
      return items.slice(0, 6).map((item, i) => {
        const parts = item.split(' - ');
        return {
          title: parts[0].trim(),
          body: parts[1]
            ? parts[1].trim()
            : buildServiceDescription(parts[0], brief, i),
        };
      });
    }
  }
  const industry = detectIndustry(brief);
  const fb = INDUSTRY_FALLBACKS[industry] || INDUSTRY_FALLBACKS.default;
  return fb.services.map((s, i) => ({
    title: s,
    body: buildServiceDescription(s, brief, i),
  }));
}

function buildServiceDescription(title, brief, index) {
  const audience = brief.targetAudience ? `for ${brief.targetAudience}` : '';
  const audienceOf = brief.targetAudience ? `of ${brief.targetAudience}` : '';
  const brand = brief.brandName || '';
  const tonePrefix = brief.tone && brief.tone.toLowerCase().includes('bold') ? 'Bold, no-compromise' : '';
  const descriptors = [
    `${brand ? `${brand} delivers` : 'We deliver'} ${title.toLowerCase()} ${audience} with measurable, lasting results.`,
    `Expert ${title.toLowerCase()} solutions designed to exceed expectations and scale with your goals.`,
    `${title} built for the demands ${audienceOf || 'of modern businesses'} — precise, reliable, and ready to perform.`,
    `${tonePrefix ? `${tonePrefix} ` : 'Purpose-built '}${title.toLowerCase()} that turns ambition into outcomes.`,
    `Our approach to ${title.toLowerCase()} combines deep expertise with a relentless focus on delivering value.`,
    `${title} reimagined${audience ? ` ${audience}` : ''}: faster delivery, cleaner execution, better results.`,
    `From strategy to execution, our ${title.toLowerCase()} offering is built around what actually moves the needle.`,
  ];
  return descriptors[index % descriptors.length];
}

function parseKeyBenefits(brief) {
  if (brief.keyBenefits && brief.keyBenefits.trim()) {
    return brief.keyBenefits
      .split(/\n|,|;/)
      .map(b => b.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  // Build benefits from available brief fields before falling back to generic text.
  const derived = [];

  // usp makes the strongest benefit bullet
  if (brief.usp && brief.usp.trim()) {
    derived.push(brief.usp.trim());
  }

  // Extract short punchy sentences from description (≤80 chars)
  if (brief.description && brief.description.trim()) {
    const sentences = brief.description
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 15 && s.length <= 80);
    for (const s of sentences) {
      if (derived.length >= 3) break;
      if (!derived.includes(s)) derived.push(s);
    }
  }

  if (derived.length >= 4) return derived.slice(0, 4);

  // Top up with industry-specific fallbacks when brief is thin
  const industry = detectIndustry(brief);
  const fb = INDUSTRY_FALLBACKS[industry] || INDUSTRY_FALLBACKS.default;
  const industryBenefits = fb.benefits || [];
  for (const b of industryBenefits) {
    if (derived.length >= 4) break;
    if (!derived.includes(b)) derived.push(b);
  }

  return derived.length > 0 ? derived.slice(0, 4) : [
    'Outcome-focused from day one',
    'Senior expertise, no hand-off to juniors',
    'Clear timelines with weekly check-ins',
    'Proven track record across industries',
  ];
}

function parseSocialLinks(brief) {
  const links = {};
  if (!brief.socialLinks) return links;
  const text = brief.socialLinks;
  const patterns = {
    twitter: /(?:twitter\.com\/|@)([a-zA-Z0-9_]+)/,
    instagram: /(?:instagram\.com\/|ig:\s*)([a-zA-Z0-9_.]+)/i,
    linkedin: /linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)/,
    github: /github\.com\/([a-zA-Z0-9-]+)/,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) links[key] = match[1];
  }
  return links;
}

function buildHeroContent(brief, brandName) {
  const tagline = brief.tagline ? brief.tagline.trim() : '';
  const description = brief.description ? brief.description.trim() : '';
  const cta = brief.callToAction ? brief.callToAction.trim() : 'Get Started';
  const audience = brief.targetAudience ? brief.targetAudience.trim() : '';
  const usp = brief.usp ? brief.usp.trim() : '';
  const industry = detectIndustry(brief);

  // Compose headline in priority order — never fall back to bare brand name
  let headline;
  if (tagline) {
    headline = tagline;
  } else if (usp) {
    // Turn USP into a headline: trim to ~60 chars, capitalise first letter
    const trimmed = usp.length > 60 ? usp.slice(0, 57) + '…' : usp;
    headline = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  } else {
    const INDUSTRY_HEADLINES = {
      tech:        `The Smarter Way to Build Digital Products`,
      design:      `Craft That Speaks Before Words Do`,
      marketing:   `Growth That Scales. Results That Last.`,
      finance:     `Financial Clarity. Confident Decisions.`,
      health:      `Your Health, Our Priority`,
      legal:       `Straightforward Counsel. Exceptional Outcomes.`,
      real_estate: `Find Your Place. We'll Handle the Rest.`,
      default:     `${brandName} — Built for What's Next`,
    };
    headline = INDUSTRY_HEADLINES[industry] || INDUSTRY_HEADLINES.default;
  }

  let subheadline;
  if (description) {
    subheadline = description.length > 120 ? description.slice(0, 117) + '...' : description;
  } else if (audience) {
    subheadline = `Built for ${audience}. Designed to deliver.`;
  } else {
    subheadline = `${brandName} — where craft meets purpose.`;
  }

  return { headline, subheadline, cta, ctaSecondary: 'Learn More' };
}

function buildAboutContent(brief, brandName) {
  const description = brief.description ? brief.description.trim() : '';
  const usp = brief.usp ? brief.usp.trim() : '';
  const tone = brief.tone ? brief.tone.trim() : '';

  const heading = `About ${brandName}`;
  const body = description || `${brandName} is dedicated to delivering exceptional results for every client. Our team combines deep expertise with a relentless focus on quality.`;
  const highlight = usp || tone || 'Excellence in every detail.';

  return { heading, body, highlight };
}

function buildFeaturesContent(brief, services) {
  const heading = brief.industry
    ? `What We Do in ${brief.industry}`
    : 'What We Do';
  return { heading, items: services };
}

function buildCtaContent(brief, brandName) {
  const cta = brief.callToAction ? brief.callToAction.trim() : 'Get in Touch';
  const audience = brief.targetAudience ? brief.targetAudience.trim() : '';
  const usp = brief.usp ? brief.usp.trim() : '';

  let heading;
  if (audience) {
    // Rotate between natural phrasings — avoid the "Ready to start, Startups?" comma construction
    const patterns = [
      `Made for ${audience}. Ready When You Are.`,
      `Helping ${audience} Achieve More`,
      `${audience} Choose ${brandName}`,
    ];
    heading = patterns[brandName.length % patterns.length];
  } else {
    heading = `Ready to Work with ${brandName}?`;
  }

  const subtext = usp || `Let's build something remarkable together.`;
  return { heading, subtext, button: cta };
}

function buildContactContent(brief, brandName) {
  return {
    heading: `Contact ${brandName}`,
    email: brief.contactEmail || '',
    phone: brief.contactPhone || '',
    location: brief.location || '',
  };
}

function buildFooterContent(brief, brandName, services) {
  const socialLinks = parseSocialLinks(brief);
  const navLinks = services.slice(0, 3).map(s => ({ label: s.title, href: `#${s.title.toLowerCase().replace(/\s+/g, '-')}` }));
  return {
    brand: brandName,
    links: navLinks,
    socialLinks,
    copy: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
  };
}

/**
 * Main export: buildContent(brief, siteType)
 * Returns a structured content object consumed by page-builder.
 */
function applyEnhancedOverrides(base, enhancedPrompt) {
  const overrides = enhancedPrompt?.contentOverrides;
  if (!overrides || typeof overrides !== 'object') return base;

  const merged = {
    ...base,
    hero: { ...base.hero },
    about: { ...base.about },
    features: { ...base.features, items: Array.isArray(base.features?.items) ? [...base.features.items] : [] },
    cta: { ...base.cta },
    contact: { ...base.contact },
    footer: { ...base.footer },
  };

  if (typeof overrides.brandName === 'string' && overrides.brandName.trim()) merged.brandName = overrides.brandName.trim();

  if (overrides.hero && typeof overrides.hero === 'object') {
    Object.assign(merged.hero, overrides.hero);
  }
  if (overrides.about && typeof overrides.about === 'object') {
    Object.assign(merged.about, overrides.about);
  }
  if (overrides.features && typeof overrides.features === 'object') {
    const nextFeatures = { ...overrides.features };
    if (Array.isArray(nextFeatures.items)) {
      merged.features.items = nextFeatures.items
        .map((item) => ({
          title: item?.title || item?.name || '',
          body: item?.body || item?.description || '',
        }))
        .filter((item) => item.title);
      delete nextFeatures.items;
    }
    Object.assign(merged.features, nextFeatures);
  }
  if (Array.isArray(overrides.benefits) && overrides.benefits.length > 0) {
    merged.benefits = overrides.benefits.filter(Boolean).slice(0, 8);
  }
  if (overrides.cta && typeof overrides.cta === 'object') {
    Object.assign(merged.cta, overrides.cta);
  }
  if (overrides.contact && typeof overrides.contact === 'object') {
    Object.assign(merged.contact, overrides.contact);
  }
  if (overrides.footer && typeof overrides.footer === 'object') {
    Object.assign(merged.footer, overrides.footer);
  }

  return merged;
}

function buildContent(brief, siteType = 'Landing', enhancedPrompt = null) {
  brief = brief || {};
  const brandName = parseBrandName(brief, siteType);
  const services = parseServices(brief, siteType);
  const keyBenefits = parseKeyBenefits(brief);

  const base = {
    brandName,
    hero: buildHeroContent(brief, brandName),
    about: buildAboutContent(brief, brandName),
    features: buildFeaturesContent(brief, services),
    benefits: keyBenefits,
    cta: buildCtaContent(brief, brandName),
    contact: buildContactContent(brief, brandName),
    footer: buildFooterContent(brief, brandName, services),
  };
  return applyEnhancedOverrides(base, enhancedPrompt);
}

/**
 * Merges page-specific content (from synthetic-client's page.content field)
 * over the base content object. Falls back gracefully to base if fields are absent.
 * Call this in writePageFiles for each page before passing content to buildPageFile.
 */
function buildPageContent(baseContent, pageData) {
  if (!pageData || !pageData.content) return baseContent;
  const pc = pageData.content;
  const pageType = pageData.type || 'custom';

  const result = {
    brandName: baseContent.brandName,
    hero:     { ...baseContent.hero },
    about:    { ...baseContent.about },
    features: { ...baseContent.features },
    benefits: [...(baseContent.benefits || [])],
    cta:      { ...baseContent.cta },
    contact:  { ...baseContent.contact },
    footer:   { ...baseContent.footer },
  };

  // Page-specific headline / tagline override
  if (pc.pageTitle) result.hero.headline = pc.pageTitle;
  if (pc.tagline)   result.hero.subheadline = pc.tagline;
  if (pc.description) result.about.body = pc.description;
  if (pc.callToAction) {
    result.cta.button = pc.callToAction;
    result.hero.cta = pc.callToAction;
  }

  // Services overrides are only valid for service-like pages.
  if ((pageType === 'services' || pageType === 'custom' || pageType === 'home') && Array.isArray(pc.services) && pc.services.length > 0) {
    result.features = {
      heading: 'Our Services',
      items: pc.services.map(s => ({
        title: s.name  || s.title || '?',
        body:  s.description || s.body || '',
      })),
    };
  }

  // Projects are valid on work/custom pages; prefer explicit projects over derived work cards.
  if ((pageType === 'custom' || pageType === 'home') && Array.isArray(pc.projects) && pc.projects.length > 0) {
    result.projects = pc.projects.map(p => ({
      title: p?.title || p?.name || '',
      summary: p?.summary || p?.description || '',
      tag: p?.tag || '',
    })).filter(p => p.title);
  }

  // Value props are safe on non-contact pages.
  if (pageType !== 'contact' && Array.isArray(pc.valueProps) && pc.valueProps.length > 0) {
    result.benefits = pc.valueProps;
  }

  // Optional extras — constrain by page type to avoid cross-page leakage.
  if ((pageType === 'about' || pageType === 'custom') && Array.isArray(pc.teamMembers) && pc.teamMembers.length > 0) {
    result.teamMembers = pc.teamMembers;
  }
  if ((pageType === 'about' || pageType === 'custom') && pc.founder && typeof pc.founder === 'object') {
    result.founder = {
      name: pc.founder.name || '',
      role: pc.founder.role || '',
      bio: pc.founder.bio || '',
    };
  }
  if ((pageType === 'about' || pageType === 'custom') && Array.isArray(pc.leadership) && pc.leadership.length > 0) {
    result.leadership = pc.leadership.map(m => ({
      name: m?.name || '',
      role: m?.role || '',
      bio: m?.bio || '',
    })).filter(m => m.name);
  }
  if ((pageType === 'contact' || pageType === 'custom') && Array.isArray(pc.faqs) && pc.faqs.length > 0) {
    result.faqs = pc.faqs;
  }

  // Contact pages should always show structured contact lines.
  // If the brief omitted contact info, provide non-empty placeholders so the UI
  // communicates what belongs here (rather than collapsing to generic copy).
  if (pageType === 'contact') {
    const brandSlug = String(result.brandName || 'brand')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18) || 'brand';

    const hasAny = Boolean(result.contact.email || result.contact.phone || result.contact.location);
    if (!hasAny) {
      result.contact.email = `hello@${brandSlug}.com`;
      result.contact.phone = '+1 (555) 010-1234';
      result.contact.location = 'By appointment • Remote';
    } else {
      if (!result.contact.email) result.contact.email = `hello@${brandSlug}.com`;
      if (!result.contact.phone) result.contact.phone = '+1 (555) 010-1234';
      if (!result.contact.location) result.contact.location = 'By appointment • Remote';
    }
  }

  return result;
}

module.exports = { buildContent, buildPageContent, applyEnhancedOverrides };
