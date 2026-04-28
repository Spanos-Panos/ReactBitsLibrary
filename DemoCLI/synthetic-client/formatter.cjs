/**
 * Formats Claude's output into the final preset.json and brief.md files.
 */
const { validatePageContentBoundary } = require('../generators/page-policy.cjs');

const SAFE_FONTS = [
  "Inter", "Space Grotesk", "Playfair Display", "Neue Haas Grotesk", "IBM Plex Mono",
  "DM Sans", "DM Serif Display", "Syne", "Josefin Sans", "Outfit", "Plus Jakarta Sans",
  "Bebas Neue", "Anton", "Cormorant Garamond", "Instrument Serif", "Montserrat",
  "Raleway", "Work Sans", "Barlow", "Archivo Black", "Unbounded", "Orbitron",
  "Share Tech Mono", "Oxanium", "Rajdhani"
];

const BANNED_BRAND_TOKENS = ['acme', 'demo', 'sample', 'test', 'brand', 'project', 'studio project'];

function scoreComponentDiversity(selectedComponentIds) {
  const ids = Array.isArray(selectedComponentIds) ? selectedComponentIds : [];
  const categories = new Set();
  const names = new Set();
  ids.forEach(id => {
    const parts = String(id).split('/');
    if (parts[0]) categories.add(parts[0]);
    if (parts[1]) names.add(parts[1]);
  });
  return {
    total: ids.length,
    uniqueNames: names.size,
    categories: categories.size,
    score: (categories.size * 20) + (names.size * 5),
  };
}

function validateBrandRealism(brandName) {
  const value = String(brandName || '').trim().toLowerCase();
  if (!value || value.length < 3) return false;
  for (const token of BANNED_BRAND_TOKENS) {
    if (value.includes(token)) return false;
  }
  return true;
}

function toPageOverrides(page) {
  const content = page && page.content && typeof page.content === 'object' ? page.content : null;
  if (!content) return undefined;
  return {
    enabled: true,
    content: {
      pageTitle: content.pageTitle || '',
      tagline: content.tagline || '',
      description: content.description || '',
      callToAction: content.callToAction || '',
      valueProps: Array.isArray(content.valueProps) ? content.valueProps : [],
      services: Array.isArray(content.services) ? content.services : [],
      teamMembers: Array.isArray(content.teamMembers) ? content.teamMembers : [],
      faqs: Array.isArray(content.faqs) ? content.faqs : [],
    },
    brief: {
      tagline: content.tagline || '',
      description: content.description || '',
      callToAction: content.callToAction || '',
    },
  };
}

function validateSyntheticClientData(raw) {
  const requiredKeys = [
    "clientBrief",
    "styleDirection",
    "designRules",
    "selectedComponentIds",
    "pages",
    "projectPrompt",
    "projectName",
  ];
  for (const key of requiredKeys) {
    if (raw == null || raw[key] == null) {
      throw new Error(`Synthetic client output missing required key "${key}"`);
    }
  }
  if (!Array.isArray(raw.selectedComponentIds) || raw.selectedComponentIds.length === 0) {
    throw new Error('Synthetic client output must include at least one selected component.');
  }
  const diversity = scoreComponentDiversity(raw.selectedComponentIds);
  if (diversity.total < 4) {
    throw new Error('Synthetic client output must include at least 4 selected components for realistic layout coverage.');
  }
  if (diversity.categories < 2) {
    throw new Error('Synthetic client output must include components from at least 2 categories.');
  }

  if (!validateBrandRealism(raw.clientBrief && raw.clientBrief.brandName)) {
    throw new Error('Synthetic client output brand name appears generic or unrealistic.');
  }

  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    throw new Error('Synthetic client output must include at least one page.');
  }
  raw.pages.forEach((page, index) => {
    const boundary = validatePageContentBoundary(page);
    if (!boundary.ok) {
      throw new Error(`Synthetic page ${index + 1} (${page.type || 'custom'}) violates page boundary policy: ${boundary.issues.join(', ')}`);
    }
  });
  if (!raw.designRules || !Array.isArray(raw.designRules.fonts) || !Array.isArray(raw.designRules.colors)) {
    throw new Error('Synthetic client output must include designRules.fonts and designRules.colors arrays.');
  }
  if (!raw.clientBrief.contactEmail || !String(raw.clientBrief.contactEmail).includes('@')) {
    throw new Error('Synthetic client output must include a valid contact email.');
  }
  if (!raw.clientBrief.contactPhone || String(raw.clientBrief.contactPhone).length < 7) {
    throw new Error('Synthetic client output must include a realistic contact phone.');
  }
  return raw;
}

function buildPresetJson(claudeOutput, archetypeName) {
  const validated = validateSyntheticClientData(claudeOutput);
  const { clientBrief, styleDirection, designRules, selectedComponentIds, pages, projectPrompt, projectName, reasoning } = validated;

  // Task 2.2 — Font name sanitization
  if (designRules.fonts) {
    designRules.fonts = designRules.fonts.map(font => {
      let val = font.value;
      if (!val || typeof val !== 'string' || val.length > 40 || /^(serif|sans-serif|monospace|system-ui)$/.test(val)) {
        val = font.role === 'heading' ? "Inter" : "DM Sans";
      } else if (!SAFE_FONTS.includes(val)) {
        val = font.role === 'heading' ? "Inter" : "DM Sans";
      }
      return { ...font, value: val };
    });
  }

  // Task 2.3 — Color validation
  if (designRules.colors) {
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    designRules.colors = designRules.colors.map(color => {
      let val = color.value;
      if (!colorRegex.test(val)) {
        // Fallbacks based on aesthetic
        const aesthetic = styleDirection.aesthetics[0] || "Minimal";
        if (aesthetic === "Futuristic") {
          if (color.role === "background") val = "#050508";
          else if (color.role === "text") val = "#e0e8ff";
          else val = "#00f5ff";
        } else if (aesthetic === "Minimal") {
          if (color.role === "background") val = "#fafafa";
          else if (color.role === "text") val = "#111111";
          else val = "#111111";
        } else if (aesthetic === "Editorial") {
          if (color.role === "background") val = "#f5f3ee";
          else if (color.role === "text") val = "#1a1a1a";
          else val = "#c8392b";
        } else { // Brutalist or fallback
          if (color.role === "background") val = "#ffffff";
          else if (color.role === "text") val = "#000000";
          else val = "#ff2200";
        }
      }
      return { ...color, value: val };
    });
  }

  const normalizedPages = (pages || []).map((page, idx) => ({
    id: page.id || `page-${idx + 1}`,
    title: page.title || (idx === 0 ? 'Home' : `Page ${idx + 1}`),
    type: page.type || (idx === 0 ? 'home' : 'custom'),
    componentIds: Array.isArray(page.componentIds) ? page.componentIds : [],
    overrides: toPageOverrides(page),
  }));

  return {
    // Keep ID human-readable so imported preset filenames match project output naming.
    id: projectName,
    name: `${clientBrief.brandName} — ${styleDirection.aesthetics[0]} ${styleDirection.siteType}`,
    savedAt: new Date().toISOString(),
    schemaVersion: 6,
    projectPrompt,
    selectedComponentIds,
    designRules,
    projectName,
    packageManager: "npm",
    scrollbarStyle: { mode: 'custom' },
    styleDirection,
    clientBrief,
    pages: normalizedPages,
    _reasoning: reasoning
  };
}

function buildBriefMd(claudeOutput, archetypeName, date, folderName) {
  const { clientBrief, styleDirection, reasoning, designRules } = claudeOutput;

  // Component table with category column
  let componentRows = "";
  if (claudeOutput.selectedComponentIds && reasoning && reasoning.componentChoices) {
    componentRows = claudeOutput.selectedComponentIds.map(id => {
      const [category, name] = id.split('/');
      const reason = reasoning.componentChoices[name] || reasoning.componentChoices[id] || "Selected for brand alignment.";
      return `| ${name} | ${category} | ${reason} |`;
    }).join("\n");
  }

  // Fonts — one per row
  const fontRows = (designRules.fonts || []).map(f =>
    `| ${f.role} | ${f.value} |`
  ).join("\n");

  // Colors — one per row with the hex value prominent
  const colorRows = (designRules.colors || []).map(c =>
    `| ${c.role} | \`${c.value}\` |`
  ).join("\n");

  // Services and key benefits as lists
  const servicesList = (clientBrief.services || '')
    .split('\n').filter(Boolean).map(s => `- ${s}`).join('\n') || '—';
  const benefitsList = (clientBrief.keyBenefits || '')
    .split('\n').filter(Boolean).map(b => `- ${b}`).join('\n') || '—';

  return `# ${clientBrief.brandName} — Client Brief

> **Generated:** ${date} · **Archetype:** ${archetypeName} · **Aesthetic:** ${styleDirection.aesthetics.join(', ')} · **Site type:** ${styleDirection.siteType}

---

## Who Is This Client?

${reasoning && reasoning.clientPersona ? reasoning.clientPersona : '_No persona description generated._'}

---

## The Brand

| Field | Value |
|---|---|
| **Brand Name** | ${clientBrief.brandName} |
| **Tagline** | ${clientBrief.tagline} |
| **Industry** | ${clientBrief.industry} |
| **Target Audience** | ${clientBrief.targetAudience} |
| **Call to Action** | ${clientBrief.callToAction} |
| **Tone** | ${clientBrief.tone} |
| **Personality** | ${clientBrief.personality} |
| **Location** | ${clientBrief.location} |
| **Contact** | ${clientBrief.contactEmail} · ${clientBrief.contactPhone} |
| **Social** | ${clientBrief.socialLinks} |

**Description**
${clientBrief.description}

**Unique Selling Proposition**
${clientBrief.usp}

**Services**
${servicesList}

**Key Benefits**
${benefitsList}

---

## Style Direction

${reasoning && reasoning.aestheticChoice ? reasoning.aestheticChoice : ''}

| Setting | Value |
|---|---|
| Aesthetic | ${styleDirection.aesthetics.join(', ')} |
| Color Mode | ${styleDirection.colorStrategy} |
| Typography Intensity | ${styleDirection.typographyIntensity} |
| Visual Effects | ${(styleDirection.visualEffects || []).join(', ')} |
| Audience | ${styleDirection.audience} |

---

## Typography

${reasoning && reasoning.fontChoices ? reasoning.fontChoices : ''}

| Role | Font |
|---|---|
${fontRows}

---

## Color Palette

${reasoning && reasoning.colorChoices ? reasoning.colorChoices : ''}

| Role | Hex |
|---|---|
${colorRows}

---

## Selected Components

${reasoning && reasoning.componentChoices
  ? `Why this client chose these specific components:`
  : ''}

| Component | Category | Why This Client Would Choose It |
|---|---|---|
${componentRows}

---

## How to Load This Brief in BitForge

${folderName
  ? `Files are in: \`DemoCLI/synthetic-client/output/${folderName}/\`

1. Open BitForge
2. Click **Presets** in the top bar → **Import**
3. Navigate to \`DemoCLI/synthetic-client/output/${folderName}/\`
4. Select **\`preset.json\`** — all fields populate automatically:
   - Brief tab: brand name, tagline, description, services, CTA
   - Style tab: aesthetic, color mode, typography intensity
   - Design tab: fonts and color palette
   - Pages tab: page structure based on site type (${styleDirection.siteType})
   - Component chips: the selected components appear in the builder
5. Review and adjust anything you want
6. Click **Generate** → choose an output folder → project is built`
  : `This was a preview run — no files were written.
To generate the loadable files, run without \`--preview\`:

    node DemoCLI/synthetic-client/index.cjs --archetype ${archetypeName.toLowerCase()}

That will create a folder in \`DemoCLI/synthetic-client/output/\` containing:
- \`preset.json\` — import this into BitForge via Presets → Import
- \`brief.md\` — this file, saved for reference`}

> **Tip:** The most important things to review before generating are the component selection and the project prompt.
> If a component doesn't feel right for the client, swap it in the builder before clicking Generate.
`;
}

module.exports = {
  validateSyntheticClientData,
  buildPresetJson,
  buildBriefMd
};
