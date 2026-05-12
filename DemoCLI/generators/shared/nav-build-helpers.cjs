'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Escapes text for embedding inside an SVG/XML literal (brand name in logo).
 */
function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateBrandLabel(s, maxLen) {
  const t = String(s || '')
    .replace(/[^\w\s\-&.]/g, '')
    .trim();
  if (!t) return 'Brand';
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen);
}

/**
 * Minimal wordmark SVG as a data URI (readable on light and dark bars).
 */
function buildBrandLogoDataUri(brandName) {
  const label = escapeXmlText(truncateBrandLabel(brandName, 20));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48"><rect width="200" height="48" rx="10" fill="#11151a"/><text x="100" y="31" text-anchor="middle" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700">${label}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/** When no user logo: prefer this public file for these nav components (after /logo.svg). */
const NAV_DEFAULT_LOGO_PATH = {
  PillNav: '/ReactIcon.svg',
  CardNav: '/ReactIcon.svg',
  StaggeredMenu: '/ReactIcon.svg',
};

/**
 * Resolves nav logo URL for deterministic builds.
 * Order: user Images → /logo.svg → per-nav /ReactIcon.svg if present → brand SVG → joker raster.
 */
function resolveLogoUriSync(designRules, clientBrief, targetDir, navName) {
  const images = (designRules && designRules.images) || [];
  const withData = (img) =>
    img &&
    (String(img.base64 || '').trim() || String(img.path || '').trim());
  let candidate =
    images.find((i) => i && i.category === 'logo' && withData(i)) ||
    images.find((i) => withData(i));

  if (candidate) {
    const b64 = candidate.base64 && String(candidate.base64).trim();
    if (b64) {
      if (b64.startsWith('data:') || /^https?:\/\//i.test(b64)) return b64;
      const stripped = b64.replace(/^data:image\/\w+;base64,/, '');
      return `data:image/png;base64,${stripped}`;
    }
    const p = candidate.path && String(candidate.path).trim();
    if (p && p.startsWith('/') && !p.startsWith('//')) return p;
  }

  if (targetDir) {
    try {
      const logoPath = path.join(targetDir, 'public', 'logo.svg');
      if (fs.existsSync(logoPath)) return '/logo.svg';
      const defaultPath = navName && NAV_DEFAULT_LOGO_PATH[navName];
      if (defaultPath) {
        const abs = path.join(targetDir, 'public', path.basename(defaultPath));
        if (fs.existsSync(abs)) return defaultPath;
      }
    } catch (_) {
      /* ignore */
    }
  }

  const brand = clientBrief && clientBrief.brandName && String(clientBrief.brandName).trim();
  if (brand) return buildBrandLogoDataUri(brand);

  return '/joker-square.jpg';
}

module.exports = { resolveLogoUriSync, buildBrandLogoDataUri, escapeXmlText };
