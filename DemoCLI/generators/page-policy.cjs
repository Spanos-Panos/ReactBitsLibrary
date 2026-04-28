/**
 * page-policy.cjs
 * Enforces route-aware section constraints and deterministic variant selection.
 */

const PAGE_POLICY = {
  home: {
    allow: new Set(['hero', 'features', 'benefits', 'work', 'services', 'pricing', 'cta']),
    requiredAny: [['hero'], ['cta', 'features', 'benefits']],
  },
  about: {
    allow: new Set(['hero', 'about', 'features', 'benefits', 'work', 'cta']),
    requiredAny: [['about']],
  },
  services: {
    allow: new Set(['hero', 'services', 'features', 'benefits', 'pricing', 'work', 'cta']),
    requiredAny: [['services', 'features']],
  },
  contact: {
    allow: new Set(['hero', 'contact', 'about', 'cta']),
    requiredAny: [['contact']],
  },
  custom: {
    allow: new Set(['hero', 'about', 'features', 'benefits', 'services', 'work', 'pricing', 'cta', 'contact']),
    requiredAny: [['hero', 'features', 'about']],
  },
};

function stableHash(input) {
  let hash = 0;
  const str = String(input || '');
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function chooseDeterministicVariant(variants, seedKey) {
  if (!Array.isArray(variants) || variants.length === 0) return [];
  const index = stableHash(seedKey) % variants.length;
  return variants[index];
}

function repairSections(pageType, candidateSections) {
  const policy = PAGE_POLICY[pageType] || PAGE_POLICY.custom;
  const unique = Array.from(new Set(Array.isArray(candidateSections) ? candidateSections : []));
  const filtered = unique.filter(section => policy.allow.has(section));

  for (const group of policy.requiredAny) {
    const hasGroup = group.some(section => filtered.includes(section));
    if (!hasGroup) {
      const fallback = group.find(section => policy.allow.has(section));
      if (fallback) filtered.push(fallback);
    }
  }

  if (filtered.length === 0) {
    if (pageType === 'contact') return ['contact'];
    if (pageType === 'about') return ['about', 'cta'];
    if (pageType === 'services') return ['services', 'cta'];
    return ['hero', 'cta'];
  }

  return filtered;
}

function selectPolicySections({ pageType, variants, seedKey }) {
  const chosen = chooseDeterministicVariant(variants, seedKey);
  return repairSections(pageType, chosen);
}

function validatePageContentBoundary(page) {
  if (!page || typeof page !== 'object') return { ok: true, issues: [] };
  const issues = [];
  const type = page.type || 'custom';
  const content = page.content || {};
  if (type !== 'contact' && Array.isArray(content.faqs) && content.faqs.length > 0) {
    issues.push('faqs-should-be-contact-only');
  }
  if (type !== 'about' && Array.isArray(content.teamMembers) && content.teamMembers.length > 0) {
    issues.push('teamMembers-should-be-about-only');
  }
  return { ok: issues.length === 0, issues };
}

module.exports = {
  PAGE_POLICY,
  repairSections,
  chooseDeterministicVariant,
  selectPolicySections,
  validatePageContentBoundary,
};
