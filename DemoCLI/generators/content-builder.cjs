/**
 * content-builder.cjs
 * Turns a clientBrief object into a structured content map consumed by page-builder.
 * All text must come from brief fields — never "Lorem ipsum" or generic AI slop.
 */

const INDUSTRY_FALLBACKS = {
  tech:       { brand: 'Studio',  services: ['Web Development', 'Cloud Architecture', 'Digital Transformation'] },
  design:     { brand: 'Studio',  services: ['Brand Identity', 'UI/UX Design', 'Creative Direction'] },
  marketing:  { brand: 'Agency',  services: ['Growth Strategy', 'Content Marketing', 'Paid Acquisition'] },
  finance:    { brand: 'Advisors',services: ['Wealth Management', 'Financial Planning', 'Investment Strategy'] },
  health:     { brand: 'Clinic',  services: ['Primary Care', 'Preventive Health', 'Wellness Coaching'] },
  legal:      { brand: 'Law',     services: ['Corporate Law', 'Intellectual Property', 'Contract Review'] },
  real_estate:{ brand: 'Group',   services: ['Residential Sales', 'Commercial Leasing', 'Property Management'] },
  default:    { brand: 'Lab',     services: ['Strategy', 'Execution', 'Growth'] },
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
  const brand = brief.brandName || '';
  const descriptors = [
    `${brand ? `${brand} delivers` : 'We deliver'} ${title.toLowerCase()} ${audience} with measurable results.`,
    `Expert ${title.toLowerCase()} solutions designed to move the needle and exceed expectations.`,
    `${title} that scales with your ambitions and delivers consistent, reliable outcomes.`,
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
  return [
    'Results-driven approach',
    'Expert team with proven track record',
    'Scalable solutions built to last',
    'Dedicated support at every step',
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

  const headline = tagline || brandName;
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
  const heading = audience
    ? `Ready to start, ${audience}?`
    : `Ready to work with ${brandName}?`;
  const subtext = brief.usp || `Let's build something remarkable together.`;
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
function buildContent(brief, siteType = 'Landing') {
  brief = brief || {};
  const brandName = parseBrandName(brief, siteType);
  const services = parseServices(brief, siteType);
  const keyBenefits = parseKeyBenefits(brief);

  return {
    brandName,
    hero: buildHeroContent(brief, brandName),
    about: buildAboutContent(brief, brandName),
    features: buildFeaturesContent(brief, services),
    benefits: keyBenefits,
    cta: buildCtaContent(brief, brandName),
    contact: buildContactContent(brief, brandName),
    footer: buildFooterContent(brief, brandName, services),
  };
}

/**
 * Merges page-specific content (from synthetic-client's page.content field)
 * over the base content object. Falls back gracefully to base if fields are absent.
 * Call this in writePageFiles for each page before passing content to buildPageFile.
 */
function buildPageContent(baseContent, pageData) {
  if (!pageData || !pageData.content) return baseContent;
  const pc = pageData.content;

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

  // Page-specific services override features section
  if (Array.isArray(pc.services) && pc.services.length > 0) {
    result.features = {
      heading: 'Our Services',
      items: pc.services.map(s => ({
        title: s.name  || s.title || '?',
        body:  s.description || s.body || '',
      })),
    };
  }

  // Page-specific value props override benefits list
  if (Array.isArray(pc.valueProps) && pc.valueProps.length > 0) {
    result.benefits = pc.valueProps;
  }

  // Optional extras — used by section builders when present
  if (Array.isArray(pc.teamMembers) && pc.teamMembers.length > 0) {
    result.teamMembers = pc.teamMembers;
  }
  if (Array.isArray(pc.faqs) && pc.faqs.length > 0) {
    result.faqs = pc.faqs;
  }

  return result;
}

module.exports = { buildContent, buildPageContent };
