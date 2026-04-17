import { getRoleData, type ComponentRole, type RoleType } from '../data/componentRoles';

export interface LayoutZone {
  componentName: string;
  role: RoleType;
  heightHint: 'full-viewport' | 'large' | 'medium' | 'small' | 'strip' | 'overlay';
  widthHint: 'full' | 'contained' | 'inline';
  zIndex: number;
  notes: string;
}

export interface LayoutConcept {
  id: string;
  name: string;
  description: string;
  zones: LayoutZone[];
  layoutMd: string;
}

// ── Priority helpers ──────────────────────────────────────────────────────

const HERO_ROLES: RoleType[] = ['hero-3d', 'hero', 'gallery'];
const OVERLAY_ROLES: RoleType[] = ['cursor', 'overlay-fx'];
const INLINE_ROLES: RoleType[] = ['text-reveal', 'text-display'];
const STRUCTURAL_ROLES: RoleType[] = ['gallery', 'scroll-driver', 'card', 'ui', 'navigation', 'decoration', 'transition'];

function heroScore(role: RoleType): number {
  const order: RoleType[] = ['hero-3d', 'hero', 'gallery', 'scroll-driver', 'card', 'navigation', 'ui', 'decoration', 'transition', 'text-display', 'text-reveal'];
  const idx = order.indexOf(role);
  return idx === -1 ? 99 : idx;
}

function toHeightHint(role: RoleType, footprint: string): LayoutZone['heightHint'] {
  if (footprint === 'overlay') return 'overlay';
  if (footprint === 'full-viewport' || footprint === 'full-bleed') return 'full-viewport';
  if (footprint === 'full-width') return 'strip';
  if (footprint === 'section') return 'large';
  if (footprint === 'inline') return 'small';
  if (role === 'navigation') return 'small';
  return 'medium';
}

function toWidthHint(footprint: string): LayoutZone['widthHint'] {
  if (footprint === 'full-viewport' || footprint === 'full-bleed' || footprint === 'full-width') return 'full';
  if (footprint === 'inline') return 'inline';
  return 'contained';
}

// ── Zone note builder ─────────────────────────────────────────────────────

function buildNotes(comp: ComponentRole, role: RoleType): string {
  const parts: string[] = [];
  if (comp.behavior.includes('physics')) parts.push('physics simulation — loads async');
  if (comp.behavior.includes('scroll-driven')) parts.push('activated by scroll position');
  if (comp.behavior.includes('mouse-reactive')) parts.push('responds to cursor movement');
  if (role === 'ambient') parts.push('position: fixed, z-index: 0, pointer-events: none');
  if (role === 'cursor' || role === 'overlay-fx') parts.push('position: fixed, z-index: 9999, pointer-events: none');
  if (comp.footprint === 'full-viewport') parts.push('100vw × 100vh');
  return parts.join(' · ') || 'standard placement';
}

// ── layoutMd builder ──────────────────────────────────────────────────────

function buildLayoutMd(conceptName: string, description: string, zones: LayoutZone[]): string {
  const lines: string[] = [
    `## LAYOUT BLUEPRINT: ${conceptName}`,
    `> ${description}`,
    '',
    '### Zone Specifications',
  ];

  zones.forEach((z, i) => {
    if (z.heightHint === 'overlay') {
      lines.push(`- **[OVERLAY] ${z.componentName}** (${z.role}) — ${z.notes}`);
    } else {
      lines.push(`- **[Zone ${i + 1}] ${z.componentName}** (${z.role})`);
      lines.push(`  - Size: ${z.heightHint} height, ${z.widthHint} width`);
      lines.push(`  - z-index: ${z.zIndex}`);
      lines.push(`  - Notes: ${z.notes}`);
    }
  });

  lines.push('', '### Critical Rules');
  lines.push('- Ambient/background components MUST be position:fixed at z-index:0 spanning the full viewport.');
  lines.push('- Overlay components (cursors, sparks) MUST be position:fixed at z-index:9999.');
  lines.push('- Follow the zone order strictly for the scroll narrative.');
  lines.push('- Do NOT wrap full-viewport components inside fixed-height containers.');

  return lines.join('\n');
}

// ── Main generator ────────────────────────────────────────────────────────

export function generateLayoutConcepts(selectedComponentNames: string[]): LayoutConcept[] {
  // Enrich with role data, skip unknowns
  const enriched = selectedComponentNames
    .map(name => getRoleData(name))
    .filter((r): r is ComponentRole => r !== undefined);

  if (enriched.length === 0) return [];

  // Partition into slots
  const ambientLayers = enriched.filter(c => c.roles[0] === 'ambient');
  const overlayComponents = enriched.filter(c => OVERLAY_ROLES.includes(c.roles[0]));
  const structural = enriched.filter(c =>
    !OVERLAY_ROLES.includes(c.roles[0]) && c.roles[0] !== 'ambient'
  );

  // Sort structural by hero priority
  const sorted = [...structural].sort((a, b) => heroScore(a.roles[0]) - heroScore(b.roles[0]));

  const heroComp = sorted[0] ?? null;
  const secondaries = sorted.slice(1);

  // Build overlay zones (always float above everything)
  const overlayZones: LayoutZone[] = overlayComponents.map(c => ({
    componentName: c.name,
    role: c.roles[0],
    heightHint: 'overlay',
    widthHint: 'full',
    zIndex: 9999,
    notes: buildNotes(c, c.roles[0]),
  }));

  // Build ambient zone
  const ambientZone: LayoutZone | null = ambientLayers[0]
    ? {
        componentName: ambientLayers[0].name,
        role: 'ambient',
        heightHint: 'full-viewport',
        widthHint: 'full',
        zIndex: 0,
        notes: buildNotes(ambientLayers[0], 'ambient'),
      }
    : null;

  // Helper to build a zone from a component
  const makeZone = (c: ComponentRole, zIdx: number): LayoutZone => ({
    componentName: c.name,
    role: c.roles[0],
    heightHint: toHeightHint(c.roles[0], c.footprint),
    widthHint: toWidthHint(c.footprint),
    zIndex: zIdx,
    notes: buildNotes(c, c.roles[0]),
  });

  const concepts: LayoutConcept[] = [];

  // ── Concept A: Dominant Hero ───────────────────────────────────────────
  // Hero takes full first viewport, secondaries stack below
  if (heroComp) {
    const heroZone: LayoutZone = {
      componentName: heroComp.name,
      role: heroComp.roles[0],
      heightHint: 'full-viewport',
      widthHint: 'full',
      zIndex: 10,
      notes: buildNotes(heroComp, heroComp.roles[0]) + ' · anchors first viewport',
    };

    const below = secondaries.map((c, i) => makeZone(c, 10 + i + 1));
    const zones = [
      ...overlayZones,
      ...(ambientZone ? [ambientZone] : []),
      heroZone,
      ...below,
    ];

    const name = heroComp.roles[0] === 'hero-3d'
      ? '3D Centerpiece'
      : heroComp.behavior.includes('physics')
      ? 'Physics Drop'
      : heroComp.behavior.includes('scroll-driven')
      ? 'Scroll Cinema'
      : 'Full Immersion';

    const desc = `${heroComp.name} commands the entire first viewport${secondaries.length > 0 ? `, with ${secondaries.map(c => c.name).join(', ')} unfolding below on scroll` : ''}.`;

    concepts.push({
      id: 'concept-a',
      name,
      description: desc,
      zones,
      layoutMd: buildLayoutMd(name, desc, zones),
    });
  }

  // ── Concept B: Editorial Split ─────────────────────────────────────────
  // Hero shares first viewport with a secondary element (side-by-side or staggered)
  if (heroComp && secondaries.length >= 1) {
    const heroZone: LayoutZone = {
      componentName: heroComp.name,
      role: heroComp.roles[0],
      heightHint: 'large',
      widthHint: heroComp.footprint === 'contained' ? 'contained' : 'full',
      zIndex: 10,
      notes: buildNotes(heroComp, heroComp.roles[0]) + ' · shares viewport in editorial split',
    };

    const splitPartner: LayoutZone = {
      componentName: secondaries[0].name,
      role: secondaries[0].roles[0],
      heightHint: 'large',
      widthHint: toWidthHint(secondaries[0].footprint),
      zIndex: 11,
      notes: buildNotes(secondaries[0], secondaries[0].roles[0]) + ' · alongside hero in split layout',
    };

    const rest = secondaries.slice(1).map((c, i) => makeZone(c, 12 + i));
    const zones = [
      ...overlayZones,
      ...(ambientZone ? [ambientZone] : []),
      heroZone,
      splitPartner,
      ...rest,
    ];

    const name = secondaries[0].roles[0] === 'text-reveal' || secondaries[0].roles[0] === 'text-display'
      ? 'Editorial Split'
      : secondaries[0].roles[0] === 'navigation'
      ? 'Structured Entry'
      : 'Dynamic Duo';

    const desc = `${heroComp.name} and ${secondaries[0].name} share the opening view${rest.length > 0 ? `, with ${rest.map(z => z.componentName).join(', ')} continuing the narrative below` : ''}.`;

    concepts.push({
      id: 'concept-b',
      name,
      description: desc,
      zones,
      layoutMd: buildLayoutMd(name, desc, zones),
    });
  }

  // ── Concept C: Scroll Cascade ──────────────────────────────────────────
  // Each component gets its own section in a deliberate scroll sequence
  if (structural.length >= 3) {
    const zones: LayoutZone[] = [
      ...overlayZones,
      ...(ambientZone ? [ambientZone] : []),
      ...sorted.map((c, i) => ({
        componentName: c.name,
        role: c.roles[0],
        heightHint: i === 0 ? 'full-viewport' as const : toHeightHint(c.roles[0], c.footprint),
        widthHint: toWidthHint(c.footprint),
        zIndex: 10 + i,
        notes: buildNotes(c, c.roles[0]) + (i > 0 ? ' · revealed on scroll' : ' · opens the page'),
      })),
    ];

    const hasScrollDrivers = structural.some(c =>
      c.behavior.includes('scroll-driven') || c.roles.includes('scroll-driver')
    );

    const name = hasScrollDrivers ? 'Scroll Immersion' : 'Section Cascade';
    const desc = `Each component owns a dedicated section — ${sorted.map(c => c.name).join(' → ')} — building a deliberate scroll narrative.`;

    concepts.push({
      id: 'concept-c',
      name,
      description: desc,
      zones,
      layoutMd: buildLayoutMd(name, desc, zones),
    });
  }

  // Fallback: if only overlays / ambient / inline, return a single minimal concept
  if (concepts.length === 0) {
    const zones: LayoutZone[] = [
      ...overlayZones,
      ...(ambientZone ? [ambientZone] : []),
      ...structural.map((c, i) => makeZone(c, 10 + i)),
    ];
    const name = 'Ambient Canvas';
    const desc = 'Atmospheric background with inline content elements layered on top.';
    concepts.push({
      id: 'concept-a',
      name,
      description: desc,
      zones,
      layoutMd: buildLayoutMd(name, desc, zones),
    });
  }

  return concepts;
}
