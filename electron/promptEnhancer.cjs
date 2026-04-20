const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// ─── Path config ──────────────────────────────────────────────────────────────

const DOCUMENTS_PATH = app.getPath('documents');
const BASE_DIR = path.join(DOCUMENTS_PATH, ".reactBitsExplorer", "prompts");

const ORIGINAL_DIR = path.join(BASE_DIR, "originalPrompts");
const ENHANCED_DIR = path.join(BASE_DIR, "enhancedPrompts");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimestampedFilename() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `prompt_${day}_${month}_${year}_${hours}_${minutes}.json`;
}

function ensureDirsExist() {
  [BASE_DIR, ORIGINAL_DIR, ENHANCED_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function saveFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
  return filePath;
}

// ─── Skill content ────────────────────────────────────────────────────────────

const PROMPT_ENHANCER_SKILL = `
# Senior Project Architect (Claude Haiku 4.5 Edition)

You are a Senior UI Architect and Frontend Lead. Your mission is to transform a raw user request + a set of custom React components into a Master Project Brief.

## YOUR CONTEXT
You will be provided with a "componentContext" array. For each component, you have:
1. **Usage**: A markdown file showing how to implement it (includes props and usage patterns).
2. **Install**: The dependencies required.

## OUTPUT FORMAT
Return ONLY a raw JSON object. No preamble, no backticks.

{
  "projectMeta": { "title", "theme", "mood" },
  "designTokens": { "colors": { "primary", "secondary", "background", "text", "accent" }, "typography", "borderRadius" },
  "siteArchitecture": {
    "sections": [
      { "id", "componentRef", "props": { "propName": "Value" }, "content": { "headline", "body", "cta" } }
    ]
  },
  "technicalRequirements": {
    "dependencies": ["List of npm packages needed"],
    "layoutStrategy": "Layout description"
  },
  "generatorSteps": [
    "Step 1: Description",
    "Step 2: Description",
    "CRITICAL: NO MARKDOWN CODE BLOCKS (\\\`\\\`\\\`) OR NEWLINES IN THESE STRINGS."
  ]
}

## CORE RULES
1. **No Code Blocks**: Do NOT use triple backticks ( \\\`\\\`\\\` ) inside the JSON string fields. Explain code in words or simple single-line strings.
2. **Atomic Steps**: Break project instructions into a clear list of 5-10 short strings.
3. **Prop Precision**: Use EXACT prop names from the provided component source code.
4. **TextAnimation Contrast**: When any TextAnimation component is included, you MUST set its color props explicitly in the \`props\` field so the text has WCAG AA contrast (≥4.5:1) against the section/page background. Use exact prop names from source (e.g. \`color\`, \`textColor\`, \`colors\`). Never leave TextAnimation color props unset — invisible text is a critical bug.
5. **No JavaScript in JSON**: ALL values in the JSON must be valid JSON types (string, number, boolean, array, object, null). NEVER write JavaScript function syntax like \`() => alert()\`, \`function() {}\`, or JSX like \`<Icon />\`. For callback props (onClick, onChange, etc.), use a string label like "navigate-home" or simply omit them.
6. **Real npm packages only**: In \`technicalRequirements.dependencies\`, list ONLY real npm package names (e.g. "framer-motion", "gsap", "lucide-react"). NEVER invent \`@react-bits/\` packages — ReactBits components are already copied locally and do NOT exist on npm.
7. **All Components Required**: Every component listed in COMPONENT CONTEXT MUST appear in \`siteArchitecture.sections\`. Do NOT omit any component — if you cannot find a fitting narrative section, create one. Components in the \`Backgrounds\` category MUST be included as a fixed ambient layer: add a section with \`"id": "ambient-bg"\`, \`"componentRef": "{ComponentName}"\`, \`"props": { "style": "position:fixed, inset:0, zIndex:0, pointerEvents:none" }\`.
8. **Font Hierarchy**: When 3 fonts are configured, distribute them hierarchically — NEVER equally. Heading font → \`h1\`, \`h2\`, \`h3\` elements only. Body font → all body text, paragraphs, lists (the majority of the page). Accent font → labels, tags, code snippets, small captions only (max 10–15% of text elements). State in \`technicalRequirements.layoutStrategy\` which font maps to which role.

## CREATIVE DIRECTION RULES (ANTI-SLOP)

When a CREATIVE DIRECTION block is present in this prompt, it is your primary design constraint. Use the specified aesthetic, color strategy, and typography intensity to drive every decision.

### Aesthetic → concrete implementation:
- **Editorial**: hero text ≥ 6rem, letter-spacing: -0.03em, mix font-weight 400 + 900, generous negative space between sections
- **Brutalist**: stark solid backgrounds (#000 or #fff), heavy 2–4px borders, zero border-radius, all-caps labels
- **Minimal**: max 2 typefaces, 60%+ of the design is whitespace, no decorative elements, muted 2-color palette
- **Futuristic**: glow/shadow effects with accent color, monospace or geometric font, dark base (#050510), subtle grid overlay
- **Organic**: curved section dividers (border-radius on divs), warm earth palette, soft drop shadows, serif accent font
- **Playful**: bold saturated primary colors, wildly varied type sizes, asymmetric cards, animation on every hover
- **Luxury**: dark base (#080808), gold or cream accent (#d4af37 or #f5f0e8), thin weight font (300), extreme whitespace
- **Corporate**: strict 12-col grid, neutral palette (navy/gray/white), clean sans-serif, no experimental elements

### Color strategy → palette:
- **dark-bold-accent**: base #0a0a0a–#111827, ONE surprising accent (amber, emerald, rose — avoid generic blue unless justified), white body text
- **light-subtle**: base #fafafa–#f1f5f9, subtle gray/slate accents, near-black text, minimum color usage
- **high-contrast-bw**: pure #000 + #fff with exactly ONE color used sparingly for emphasis
- **monochromatic**: pick one hue, vary only lightness/saturation across all elements
- **colorful**: 3+ deliberate colors in a clear hierarchy (dominant 60% / supporting 30% / accent 10%)

### Typography intensity → sizing:
- **subtle**: balanced — body 1rem, h2 2rem, h1 2.5–3rem, consistent rhythm
- **dramatic**: h1 ≥ 6rem (clamp(4rem, 10vw, 9rem)), extreme weight contrast (300 vs 900), oversized section numbers
- **experimental**: type as visual element — single huge letter as background, rotated text, clipped overflow text

### Visual effects → implementation:
- **Grain texture**: CSS ::after pseudo with SVG noise filter or semi-transparent noise overlay on hero
- **Glow/neon**: text-shadow: 0 0 30px {accent}80; box-shadow: 0 0 40px {accent}40 on key elements
- **Mesh grid**: CSS repeating-linear-gradient grid pattern as background, or use existing GridMotion component
- **Bold borders**: 2–3px solid accent-color borders on cards, sections, or as decorative lines
- **Color overlays**: mix-blend-mode color layer over hero images using ::after with accent color + opacity 0.3

### Anti-slop mandates (NON-NEGOTIABLE):
1. NEVER use a blue-to-purple gradient as the main background unless Futuristic is the active aesthetic
2. Hero headline must make a STATEMENT — forbid "Welcome to", "Transform Your", "Unleash Your", "Elevate Your"
3. Commit to the accent color — it appears in 3–5 places purposefully, not scattered everywhere
4. Stats/numbers: if the design includes metrics, show them at 4–6rem size, not in tiny badge cards
5. No filler sections — maximum 4–6 sections for a landing page, every section earns its place
6. Copy must be specific and punchy — write real content that fits the site type and audience, no Lorem ipsum
7. Section spacing: at minimum 6rem padding between sections, preferably 8–12rem for dramatic/luxury aesthetics
`;


// ─── Main export ──────────────────────────────────────────────────────────────

async function enhancePrompt(options) {
  try {
    const { rawPrompt, selectedComponents, systemContext } = options;
    const dr = systemContext?.designRules;

    // Build optional design preferences block
    let designBlock = '';
    if (dr) {
      const lines = [];

      if (Array.isArray(dr.fonts) && dr.fonts.some(f => f.value?.trim())) {
        lines.push('Fonts:');
        dr.fonts.forEach(f => {
          if (f.value?.trim()) {
            const role = f.role ? f.role : 'body (auto)';
            lines.push(`  - ${f.value.trim()} → role: ${role}`);
          }
        });
      }

      if (Array.isArray(dr.colors) && dr.colors.some(c => c.value?.trim())) {
        lines.push('Colors:');
        dr.colors.forEach(c => {
          if (c.value?.trim()) {
            const role = c.role ? c.role : 'auto';
            lines.push(`  - ${c.value.trim()} → role: ${role}`);
          }
        });
      }

      if (dr.sizes) {
        lines.push('Sizes:');
        lines.push(`  - Responsive strategy: ${dr.sizes.strategy}`);
        if (dr.sizes.maxWidth) lines.push(`  - Max container width: ${dr.sizes.maxWidth}`);
      }

      if (lines.length > 0) {
        designBlock = `\n\n## USER DESIGN PREFERENCES\nThe user has specified these design constraints. Follow them strictly.\n\n${lines.join('\n')}`;
      }
    }

    // Client brief block
    let clientBriefBlock = '';
    const cb = systemContext?.clientBrief;
    if (cb) {
      const lines = [];
      if (cb.brandName?.trim())      lines.push(`Brand name: ${cb.brandName.trim()}`);
      if (cb.tagline?.trim())        lines.push(`Tagline: ${cb.tagline.trim()}`);
      if (cb.industry?.trim())       lines.push(`Industry: ${cb.industry.trim()}`);
      if (cb.description?.trim())    lines.push(`Description: ${cb.description.trim()}`);
      if (cb.usp?.trim())            lines.push(`USP: ${cb.usp.trim()}`);
      if (cb.services?.trim())       lines.push(`Services/Products:\n${cb.services.trim()}`);
      if (cb.targetAudience?.trim()) lines.push(`Target audience: ${cb.targetAudience.trim()}`);
      if (cb.callToAction?.trim())   lines.push(`Primary CTA: ${cb.callToAction.trim()}`);
      if (cb.keyBenefits?.trim())    lines.push(`Key benefits:\n${cb.keyBenefits.trim()}`);
      if (cb.tone?.trim())           lines.push(`Tone of voice: ${cb.tone.trim()}`);
      if (cb.personality?.trim())    lines.push(`Brand personality: ${cb.personality.trim()}`);
      if (cb.contactEmail?.trim())   lines.push(`Contact email: ${cb.contactEmail.trim()}`);
      if (cb.contactPhone?.trim())   lines.push(`Contact phone: ${cb.contactPhone.trim()}`);
      if (cb.location?.trim())       lines.push(`Location: ${cb.location.trim()}`);
      if (cb.socialLinks?.trim())    lines.push(`Social links: ${cb.socialLinks.trim()}`);
      if (lines.length > 0) {
        clientBriefBlock = `\n\n## CLIENT BRIEF\nUse this client-provided information to populate REAL content throughout the site. Do NOT use placeholder text — use the actual brand name, services, benefits, and contact details provided here.\n\n${lines.join('\n')}`;
      }
    }

    // Layout vision block — rich contextual layout guidance for Claude
    const zNum = { background: 0, content: 1, overlay: 9999 };
    const hHint = { fullscreen: '100vh', large: '85vh', medium: '50vh', strip: '20vh' };

    const ANIM_MAP = {
      'fade-in':  "initial: {opacity:0} → whileInView: {opacity:1}",
      'slide-up': "initial: {y:40, opacity:0} → whileInView: {y:0, opacity:1}",
      'scale-up': "initial: {scale:0.95, opacity:0} → whileInView: {scale:1, opacity:1}",
      'blur-in':  "initial: {filter:'blur(8px)', opacity:0} → whileInView: {filter:'blur(0px)', opacity:1}",
    };

    function buildLayoutBlockFromConfig(lc, roleCtx) {
      if (!lc || lc.length === 0) return '';
      const roleMap = {};
      (roleCtx || []).forEach(r => { roleMap[r.name] = r; });

      const fixed  = lc.filter(i => i.position === 'fixed');
      const inFlow = lc.filter(i => i.position === 'in-flow');
      const lines  = ['\n\n## LAYOUT VISION', ''];

      // Scroll narrative
      if (inFlow.length > 0) {
        const narrativeParts = inFlow.map(item => {
          const r = roleMap[item.componentName];
          const role = r?.role || 'section';
          const isHero = role === 'hero' || role === 'hero-3d';
          const behaviors = r?.behaviors || [];
          if (isHero) return `immersive ${behaviors.includes('physics') ? 'physics ' : ''}hero (${item.componentName})`;
          if (role === 'gallery') return `visual gallery (${item.componentName})`;
          if (role === 'scroll-driver') return `scroll-driven experience (${item.componentName})`;
          if (role === 'navigation') return `navigation (${item.componentName})`;
          if (item.heightHint === 'strip') return `compact CTA strip (${item.componentName})`;
          return `${role} section (${item.componentName})`;
        });
        const lastPart = narrativeParts.pop();
        const narrative = narrativeParts.length > 0
          ? `Opens with ${narrativeParts.join(', transitions through ')}, closes with ${lastPart}.`
          : `Single-section focus: ${lastPart}.`;
        lines.push(`**Page narrative:** ${narrative}`);
        lines.push('');
      }

      // Fixed / ambient layers
      if (fixed.length) {
        lines.push('### Always-On Layers (position:fixed, outside page flow):');
        for (const item of fixed) {
          const r = roleMap[item.componentName];
          const rolePart = r ? `${r.role} · ${r.behaviors.join('/')}` : 'ambient';
          lines.push(`- **${item.componentName}** [${rolePart}] → z:${zNum[item.zLayer]}, inset:0, pointer-events:none`);
        }
        lines.push('');
      }

      // In-flow content sections
      if (inFlow.length) {
        lines.push('### Content Sections — scroll top → bottom:');
        inFlow.forEach((item, idx) => {
          const r = roleMap[item.componentName];
          const rolePart = r ? `${r.role} · ${r.behaviors.join('/')}` : 'content';
          const widthNote = item.widthHint === 'half' ? 'half-width' : item.widthHint === 'third' ? 'one-third-width' : item.widthHint === 'full' ? 'full-width' : 'contained';
          const alignNote = item.xAlign === 'center' ? 'centered' : item.xAlign === 'right' ? 'right-aligned' : item.xAlign === 'full-width' ? 'full-width' : 'left-aligned';
          lines.push(`${idx + 1}. **${item.componentName}** [${rolePart}] → ${hHint[item.heightHint]}, ${widthNote}, ${alignNote}, z:${zNum[item.zLayer] || 1}`);
          const anim = ANIM_MAP[item.entranceAnimation];
          if (anim) lines.push(`   → Entrance: ${item.entranceAnimation} — ${anim}`);
        });
        lines.push('');
      }

      // Width patterns (only if any non-full)
      const hasNonFull = inFlow.some(i => i.widthHint === 'half' || i.widthHint === 'third');
      if (hasNonFull) {
        lines.push('### Width Patterns:');
        lines.push('- half-width or one-third-width sections: place components side-by-side in a flex/grid row');
        lines.push('- full-width sections: section spans 100vw with optional inner max-width wrapper');
        lines.push('');
      }

      lines.push('### Interpretation rules:');
      lines.push('- height: fullscreen→min-height:100vh | large→min-height:85vh | medium→min-height:50vh | strip→min-height:20vh');
      lines.push('- align: full-width→section width:100% | left→content left-aligned | center→content centered | right→content right-aligned');
      lines.push('- All in-flow sections: position:relative, z-index:1 minimum');
      lines.push('- physics/3d components: render in sections with overflow:hidden to prevent layout thrash');
      lines.push('- scroll-driven components: ensure section has explicit height, not auto');
      return lines.join('\n');
    }

    let layoutBlock = '';
    if (systemContext?.layoutConfig?.length > 0) {
      layoutBlock = buildLayoutBlockFromConfig(
        systemContext.layoutConfig,
        systemContext.componentRoleContext || []
      );
    } else if (systemContext?.layoutMd) {
      layoutBlock = `\n\n${systemContext.layoutMd}`;
    }

    // Style direction block
    let styleBlock = '';
    const sd = systemContext?.styleDirection;
    if (sd) {
      const styleLines = [];
      if (sd.aesthetics?.length) styleLines.push(`Aesthetic style: ${sd.aesthetics.join(' + ')}`);
      if (sd.siteType)           styleLines.push(`Site type: ${sd.siteType}`);
      if (sd.typographyIntensity) styleLines.push(`Typography intensity: ${sd.typographyIntensity}`);
      if (sd.visualEffects?.length) styleLines.push(`Visual effects: ${sd.visualEffects.join(', ')}`);
      if (sd.colorStrategy)      styleLines.push(`Color strategy: ${sd.colorStrategy}`);
      if (sd.audience?.trim())   styleLines.push(`Target audience: ${sd.audience.trim()}`);
      if (styleLines.length > 0) {
        styleBlock = `\n\n## CREATIVE DIRECTION\nThe user has specified this artistic intent. Treat it as your primary design brief:\n\n${styleLines.join('\n')}`;
      }
    }
    ensureDirsExist();

    const originalPayload = {
      rawPrompt,
      selectedComponents,
      systemContext,
      createdAt: new Date().toISOString(),
    };

    const filename = getTimestampedFilename();
    const originalPath = saveFile(ORIGINAL_DIR, filename, originalPayload);

    // Initialize Anthropic 
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing in .env file.");

    const anthropic = new Anthropic({ apiKey });

    // ─── Model Discovery Loop ──────────────────────────────────────────────
    const candidateModels = [
      "claude-haiku-4-5-20251001",
      "claude-sonnet-4-6",
    ];

    let message = null;
    let successfulModel = "";
    let lastError = null;

    // Strip full source files — enhancer only needs usage docs to understand component API.
    // Source code is for Claude Code to read from disk, not for the enhancer.
    const strippedComponents = (selectedComponents || []).map(c => ({
      name: c.name,
      category: c.category,
      usage: c.usage || '',
      install: c.install || '',
    }));

    const dynamicSystemBlock = [clientBriefBlock, styleBlock, designBlock, layoutBlock,
      "\n\nCRITICAL: Do NOT use markdown code blocks (e.g. ```tsx) inside the JSON string values. Use escaped newlines (\\n) instead. Return ONLY the JSON object."
    ].filter(Boolean).join('');

    for (const modelId of candidateModels) {
      try {
        console.log(`[Claude Enhancer] Attempting enhancement with: ${modelId}...`);
        message = await anthropic.messages.create({
          model: modelId,
          max_tokens: 4096,
          temperature: 0,
          system: [
            { type: "text", text: PROMPT_ENHANCER_SKILL, cache_control: { type: "ephemeral" } },
            { type: "text", text: dynamicSystemBlock },
          ],
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `USER PROMPT: "${rawPrompt}"\n\nCOMPONENT CONTEXT:\n${JSON.stringify(strippedComponents, null, 2)}`
                }
              ]
            }
          ]
        });
        successfulModel = modelId;
        break; 
      } catch (e) {
        lastError = e;
        console.warn(`[Claude Enhancer] Model ${modelId} failed: ${e.message}`);
        // If it's a 404, we continue. Otherwise (auth/billing), we stop.
        if (!e.message.toLowerCase().includes("not found") && !e.message.toLowerCase().includes("not_found")) break;
      }
    }

    if (!message) {
      throw new Error(`All Claude models failed. Last error: ${lastError.message}`);
    }

    console.log(`[Claude Enhancer] Successfully used: ${successfulModel}`);
    const responseText = message.content[0].text;
    
    // ─── Robust JSON Extraction ───────────────────────────────────────────
    let enhancedPrompt;
    try {
      // Find the first '{' and the last '}'
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("No JSON object found in response");

      let jsonCandidate = responseText.substring(startIdx, endIdx + 1);

      // Strip lines containing JS function/JSX values that would break JSON.parse.
      // e.g. `"onClick": () => alert('x')` → removed entirely (trailing comma handled too)
      jsonCandidate = jsonCandidate
        .replace(/^\s*"[^"]+"\s*:\s*(?:\([^)]*\)\s*=>|function\s*\()[^\n]*,?\n/gm, '')
        .replace(/^\s*"[^"]+"\s*:\s*<[A-Z][^>]*\/>\s*,?\n/gm, '');   // strip JSX values

      // Sanitize literal control characters inside JSON string values.
      // Claude sometimes embeds raw newlines/tabs inside string fields which breaks JSON.parse.
      // We scan char-by-char so we only touch characters inside string values.
      {
        let sanitized = '';
        let inString = false;
        let i = 0;
        while (i < jsonCandidate.length) {
          const ch = jsonCandidate[i];
          if (inString) {
            if (ch === '\\') {
              // Already-escaped sequence — copy both characters as-is
              sanitized += ch + (jsonCandidate[i + 1] || '');
              i += 2;
              continue;
            }
            if (ch === '"') { inString = false; sanitized += ch; }
            else if (ch === '\n') { sanitized += '\\n'; }
            else if (ch === '\r') { sanitized += '\\r'; }
            else if (ch === '\t') { sanitized += '\\t'; }
            else { sanitized += ch; }
          } else {
            if (ch === '"') inString = true;
            sanitized += ch;
          }
          i++;
        }
        jsonCandidate = sanitized;
      }

      enhancedPrompt = JSON.parse(jsonCandidate);
    } catch (parseErr) {
      console.error("[Claude Enhancer] JSON Parse Failed. Raw text was:", responseText);
      throw new Error(`Claude returned invalid JSON: ${parseErr.message}`);
    }

    // ─── Post-parse: guarantee every selected component is in sections ─────────
    // Haiku occasionally drops components from siteArchitecture.sections even when
    // Rule 7 says not to. Catch it here so code gen always sees all components.
    try {
      if (!enhancedPrompt.siteArchitecture) enhancedPrompt.siteArchitecture = {};
      if (!Array.isArray(enhancedPrompt.siteArchitecture.sections)) {
        enhancedPrompt.siteArchitecture.sections = [];
      }
      const sections = enhancedPrompt.siteArchitecture.sections;
      const allRefs = sections.map(s => (s.componentRef || '').toLowerCase());

      for (const comp of strippedComponents) {
        const compLower = comp.name.toLowerCase();
        const alreadyPresent = allRefs.some(
          ref => ref === compLower || ref.includes(compLower)
        );
        if (!alreadyPresent) {
          const isBackground = comp.category === 'Backgrounds';
          const newSection = isBackground
            ? {
                id: 'ambient-bg',
                componentRef: comp.name,
                props: { style: 'position:fixed, inset:0, zIndex:0, pointerEvents:none' },
                content: {}
              }
            : {
                id: `section-${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                componentRef: comp.name,
                props: {},
                content: { headline: '', body: '', cta: '' }
              };
          sections.push(newSection);
          console.warn(`[Claude Enhancer] Auto-inserted missing component into sections: ${comp.name}`);
        }
      }
    } catch (validationErr) {
      console.warn('[Claude Enhancer] Section validation skipped (non-fatal):', validationErr.message);
    }

    // ─── Post-parse: apply user layoutConfig order + props to sections ─────────
    try {
      if (systemContext?.layoutConfig?.length > 0) {
        const lc = systemContext.layoutConfig;
        const inFlowOrder = lc.filter(i => i.position === 'in-flow').map(i => i.componentName.toLowerCase());
        const fixedItems  = lc.filter(i => i.position === 'fixed');
        const hMap = { fullscreen: '100vh', large: '85vh', medium: '50vh', strip: '20vh' };
        const sections = enhancedPrompt.siteArchitecture.sections;

        // Sort sections to match user's configured order
        sections.sort((a, b) => {
          const aRef = (a.componentRef || '').toLowerCase();
          const bRef = (b.componentRef || '').toLowerCase();
          const aIdx = inFlowOrder.findIndex(n => aRef.includes(n));
          const bIdx = inFlowOrder.findIndex(n => bRef.includes(n));
          if (aIdx === -1 && bIdx === -1) return 0;
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });

        // Inject layout props into each section
        for (const section of sections) {
          const ref = (section.componentRef || '').toLowerCase();
          const fixedMatch = fixedItems.find(i => ref.includes(i.componentName.toLowerCase()));
          const flowMatch  = lc.find(i => i.position === 'in-flow' && ref.includes(i.componentName.toLowerCase()));
          if (fixedMatch) {
            section.props = { ...section.props, position: 'fixed', zIndex: zNum[fixedMatch.zLayer] };
          } else if (flowMatch) {
            section.props = {
              ...section.props,
              minHeight: hMap[flowMatch.heightHint],
              textAlign: flowMatch.xAlign === 'center' ? 'center' : 'left',
              zIndex: zNum[flowMatch.zLayer] || 1,
            };
          }
        }
        console.log(`[Claude Enhancer] Applied layoutConfig: ${inFlowOrder.length} in-flow, ${fixedItems.length} fixed`);
      }
    } catch (layoutErr) {
      console.warn('[Claude Enhancer] Layout ordering skipped (non-fatal):', layoutErr.message);
    }

    // ─── Post-parse: derive and attach layoutPersonality ──────────────────────
    try {
      const LAYOUT_PERSONALITY_MAP = {
        brutalist:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'dense',  gridStyle: 'raw' },
        editorial:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'airy',   gridStyle: 'asymmetric' },
        futuristic: { textAlign: 'center', heroAlign: 'center', sectionDensity: 'medium', gridStyle: 'geometric' },
        minimal:    { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'airy',   gridStyle: 'single-column' },
        organic:    { textAlign: 'left',   heroAlign: 'center', sectionDensity: 'medium', gridStyle: 'irregular' },
        playful:    { textAlign: 'center', heroAlign: 'center', sectionDensity: 'dense',  gridStyle: 'mixed' },
        luxury:     { textAlign: 'center', heroAlign: 'center', sectionDensity: 'sparse', gridStyle: 'single-column' },
        corporate:  { textAlign: 'left',   heroAlign: 'left',   sectionDensity: 'medium', gridStyle: 'structured' },
      };
      const aesthetics = (systemContext?.styleDirection?.aesthetics || []).map(a => a.toLowerCase());
      const mood = (enhancedPrompt.projectMeta?.mood || '').toLowerCase();
      // Derive primary aesthetic: from styleDirection first, then fallback to mood string
      const primaryAesthetic = aesthetics[0]
        || (mood.includes('brutal') ? 'brutalist'
          : mood.includes('editorial') ? 'editorial'
          : mood.includes('futuristic') || mood.includes('cyber') ? 'futuristic'
          : mood.includes('minimal') || mood.includes('clean') ? 'minimal'
          : mood.includes('organic') || mood.includes('natural') ? 'organic'
          : mood.includes('playful') || mood.includes('fun') ? 'playful'
          : mood.includes('luxury') || mood.includes('premium') ? 'luxury'
          : mood.includes('corporate') || mood.includes('professional') ? 'corporate'
          : null);
      if (primaryAesthetic && LAYOUT_PERSONALITY_MAP[primaryAesthetic]) {
        enhancedPrompt.layoutPersonality = LAYOUT_PERSONALITY_MAP[primaryAesthetic];
        console.log(`[Claude Enhancer] Attached layoutPersonality for aesthetic: ${primaryAesthetic}`);
      }
    } catch (lpErr) {
      console.warn('[Claude Enhancer] layoutPersonality derivation skipped:', lpErr.message);
    }

    const enhancedPath = saveFile(ENHANCED_DIR, filename, enhancedPrompt);

    return {
      success: true,
      enhancedPrompt,
      savedPaths: {
        original: originalPath,
        enhanced: enhancedPath,
      },
    };
  } catch (error) {
    console.error("[Claude Enhancer] Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { enhancePrompt };
