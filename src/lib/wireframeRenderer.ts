import type { LayoutConcept, LayoutZone } from './layoutConceptGenerator';
import type { RoleType } from '../data/componentRoles';

// ── Color palette per role family ─────────────────────────────────────────

const ROLE_COLORS: Record<RoleType | 'default', { fill: string; stroke: string; label: string }> = {
  'ambient':      { fill: '#0f1a2e', stroke: '#1e3a5f', label: '#3b82f6' },
  'hero':         { fill: '#1a0f2e', stroke: '#4c1d95', label: '#a78bfa' },
  'hero-3d':      { fill: '#1a0f2e', stroke: '#6d28d9', label: '#c4b5fd' },
  'gallery':      { fill: '#0f2a2a', stroke: '#134e4a', label: '#2dd4bf' },
  'scroll-driver':{ fill: '#0f2a1a', stroke: '#14532d', label: '#4ade80' },
  'navigation':   { fill: '#1a1a0f', stroke: '#451a03', label: '#fb923c' },
  'card':         { fill: '#1a1a2a', stroke: '#1e3a8a', label: '#60a5fa' },
  'ui':           { fill: '#1a1a1a', stroke: '#374151', label: '#9ca3af' },
  'decoration':   { fill: '#1a120f', stroke: '#431407', label: '#f97316' },
  'cursor':       { fill: 'transparent', stroke: '#334155', label: '#475569' },
  'overlay-fx':   { fill: 'transparent', stroke: '#334155', label: '#475569' },
  'transition':   { fill: '#111827', stroke: '#1f2937', label: '#6b7280' },
  'text-reveal':  { fill: '#1a1a2e', stroke: '#312e81', label: '#818cf8' },
  'text-display': { fill: '#1a1a2e', stroke: '#312e81', label: '#818cf8' },
  'default':      { fill: '#1a1a1a', stroke: '#333',    label: '#888' },
};

function getColors(role: RoleType) {
  return ROLE_COLORS[role] ?? ROLE_COLORS['default'];
}

// ── Height in SVG units per heightHint ────────────────────────────────────

const HEIGHT_MAP: Record<LayoutZone['heightHint'], number> = {
  'full-viewport': 80,
  'large':         60,
  'medium':        44,
  'small':         24,
  'strip':         20,
  'overlay':        0, // overlays are rendered separately as floating badges
};

// ── Behavior icons ────────────────────────────────────────────────────────

function behaviorGlyph(notes: string): string {
  if (notes.includes('physics')) return '⚛';
  if (notes.includes('scroll')) return '↕';
  if (notes.includes('cursor')) return '⌖';
  if (notes.includes('mouse') || notes.includes('cursor movement')) return '⌖';
  return '';
}

// ── Role short label ──────────────────────────────────────────────────────

function roleShort(role: RoleType): string {
  const map: Partial<Record<RoleType, string>> = {
    'ambient': 'bg', 'hero': 'hero', 'hero-3d': '3d',
    'gallery': 'gallery', 'scroll-driver': 'scroll',
    'navigation': 'nav', 'card': 'card', 'ui': 'ui',
    'decoration': 'deco', 'cursor': 'cursor', 'overlay-fx': 'fx',
    'transition': 'trans', 'text-reveal': 'reveal', 'text-display': 'text',
  };
  return map[role] ?? role;
}

// ── Main renderer ─────────────────────────────────────────────────────────

export function renderWireframeSVG(concept: LayoutConcept): string {
  const W = 200;
  const PAD = 10;
  const GAP = 3;
  const contentW = W - PAD * 2;

  // Separate overlays from structural zones
  const overlays = concept.zones.filter(z => z.heightHint === 'overlay');
  const structural = concept.zones.filter(z => z.heightHint !== 'overlay');

  // Compute total height
  let totalH = PAD;
  structural.forEach(z => { totalH += HEIGHT_MAP[z.heightHint] + GAP; });
  totalH += PAD + (overlays.length > 0 ? 22 : 0);

  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${totalH}" width="${W}" height="${totalH}">`);

  // Background
  lines.push(`<rect width="${W}" height="${totalH}" fill="#080d18" rx="8"/>`);

  // Grid lines (subtle)
  for (let y = 0; y < totalH; y += 20) {
    lines.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#ffffff08" stroke-width="0.5"/>`);
  }

  let y = PAD;

  structural.forEach((zone, i) => {
    const h = HEIGHT_MAP[zone.heightHint];
    const colors = getColors(zone.role);
    const isAmbient = zone.role === 'ambient';
    const rx = isAmbient ? 4 : 6;

    // Main rect
    lines.push(`<rect x="${PAD}" y="${y}" width="${contentW}" height="${h}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1" rx="${rx}" opacity="${isAmbient ? 0.6 : 1}"/>`);

    // Ambient gets a dashed border instead of solid
    if (isAmbient) {
      lines.push(`<rect x="${PAD}" y="${y}" width="${contentW}" height="${h}" fill="none" stroke="${colors.stroke}" stroke-width="1" stroke-dasharray="4 3" rx="${rx}" opacity="0.5"/>`);
    }

    // Inner shimmer line for hero-class zones
    if (zone.heightHint === 'full-viewport' || zone.heightHint === 'large') {
      lines.push(`<rect x="${PAD + 1}" y="${y + 1}" width="${contentW - 2}" height="2" fill="${colors.stroke}" rx="1" opacity="0.4"/>`);
    }

    // Role badge (top-left pill)
    const badge = roleShort(zone.role);
    const badgeW = badge.length * 6 + 8;
    lines.push(`<rect x="${PAD + 6}" y="${y + 6}" width="${badgeW}" height="12" fill="${colors.stroke}" rx="3" opacity="0.7"/>`);
    lines.push(`<text x="${PAD + 6 + badgeW / 2}" y="${y + 15}" text-anchor="middle" font-family="monospace" font-size="7" fill="${colors.label}" font-weight="700">${badge}</text>`);

    // Component name (center)
    const glyph = behaviorGlyph(zone.notes);
    const label = glyph ? `${glyph} ${zone.componentName}` : zone.componentName;
    lines.push(`<text x="${PAD + contentW / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="${colors.label}" font-weight="600">${label}</text>`);

    // Width hint indicator (bottom-right)
    if (zone.widthHint === 'contained') {
      const bw = Math.floor(contentW * 0.6);
      const bx = PAD + (contentW - bw) / 2;
      lines.push(`<rect x="${bx}" y="${y + h - 8}" width="${bw}" height="3" fill="${colors.stroke}" rx="1" opacity="0.4"/>`);
    } else if (zone.widthHint === 'full') {
      lines.push(`<rect x="${PAD + 4}" y="${y + h - 8}" width="${contentW - 8}" height="3" fill="${colors.stroke}" rx="1" opacity="0.4"/>`);
    }

    // Scroll arrow between zones (if either is scroll-driven)
    if (i < structural.length - 1 && zone.heightHint !== 'overlay') {
      const nextZone = structural[i + 1];
      const arrowY = y + h + GAP / 2 + 0.5;
      const isScrollPair = zone.role === 'scroll-driver' || nextZone?.role === 'scroll-driver'
        || zone.notes.includes('scroll') || nextZone?.notes.includes('scroll');
      if (isScrollPair) {
        lines.push(`<text x="${PAD + contentW / 2}" y="${arrowY + 6}" text-anchor="middle" font-size="7" fill="#334155">↓</text>`);
      }
    }

    y += h + GAP;
  });

  // Overlay badges row at the bottom
  if (overlays.length > 0) {
    y += 4;
    lines.push(`<text x="${PAD}" y="${y + 9}" font-family="monospace" font-size="7" fill="#334155" font-weight="600">OVERLAYS:</text>`);
    let ox = PAD + 58;
    overlays.forEach(ov => {
      const bw = ov.componentName.length * 5.5 + 8;
      lines.push(`<rect x="${ox}" y="${y}" width="${bw}" height="13" fill="#0f172a" stroke="#334155" stroke-width="1" rx="3" stroke-dasharray="3 2"/>`);
      lines.push(`<text x="${ox + bw / 2}" y="${y + 9}" text-anchor="middle" font-family="monospace" font-size="7" fill="#475569">${ov.componentName}</text>`);
      ox += bw + 4;
    });
  }

  lines.push('</svg>');
  return lines.join('\n');
}
