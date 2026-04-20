# BitForge — RacePalace Testcase · Improvement Tracker

> **Testcase:** RacePalace / RaceCars · 2026-04-20 · $0.42 · ~5 min · 0 TS errors  
> **Components:** Silk, CountUp, SplitText, LogoLoop, StaggeredMenu · **Aesthetic:** Futuristic  
> **Prompt:** "a page to showcase our brand and our store"

---

## Issue Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1 | Layout tab has no explicit lock — AI ignores config unless confirmed | High | [ ] |
| 2 | Layout too generic — excessive horizontal padding, no edge-to-edge feel | High | [ ] |
| 3 | Icons & emojis look bad — lucide blocked, Unicode fallbacks are ugly | Medium | [ ] |
| 4 | StaggeredMenu (navbar) broken — wrong position, wrong z-index, not fixed | High | [ ] |
| 5 | Style fidelity weak — futuristic aesthetic barely visible in output | High | [ ] |
| 6 | Images tab completely unused — logos and product images never injected | Medium | [ ] |

---

## Issue #1 — Layout Tab: No Explicit Lock / Confirm

### Problem
The Layout tab auto-populates with defaults when components are selected. There is no "lock" or "confirm" button to tell the generator "use exactly what I configured here." If the user doesn't notice / doesn't interact, the layout defaults flow into the AI prompt and the AI may override them or partially follow them. The user needs a clear UX: **either the layout is locked (user owns it) or unlocked (AI decides freely).**

### Root Cause
- `App.tsx` passes `layoutConfig` to generation whenever `layoutConfig.length > 0` (which is always true after component selection, since auto-populate fires immediately).
- There is no boolean flag like `layoutLocked` to distinguish "user configured this intentionally" from "auto-populated default."
- The Layout tab has no confirm/lock button — changes fire immediately to state.

### Sub-problems
- [ ] **1.1** Add a `layoutLocked: boolean` state to `App.tsx` (default `false`).
- [ ] **1.2** Add a "Lock Layout / Use AI Layout" toggle button at the top of the `LayoutTab` in `ProjectBuilderPanel.tsx`. When unlocked: show a notice "AI will auto-arrange your components." When locked: show the full config controls.
- [ ] **1.3** In `App.tsx` `confirmGenerate` / `handleBuilderGenerate`: only pass `layoutConfig` when `layoutLocked === true`. Otherwise pass `null`.
- [ ] **1.4** Reset `layoutLocked` to `false` whenever `selectedIds` changes (so adding a new component unlocks the layout automatically).
- [ ] **1.5** Persist `layoutLocked` state in the preset save/load flow (`handleSavePreset` / `handleLoadPreset`).

### Files to Modify
- `src/features/project-builder/ProjectBuilderPanel.tsx` — add lock toggle UI, add `layoutLocked` + `onLayoutLockedChange` props
- `src/App.tsx` — add state, wire up toggle, conditionally pass layoutConfig
- `src/shared/types/api.ts` — (if needed) add `layoutLocked` to `GenerateOptions`

### Verification
Generate a project with layout tab untouched → confirm CLAUDE.md has no layout spec. Then lock layout → confirm spec appears in generated CLAUDE.md.

### Notes / Solution Log
_(fill in as you work)_

---

## Issue #2 — Layout Too Generic: Excessive Side Spacing & Symmetry

### Problem
The generated RacePalace site looks like a boilerplate "center column" layout. Content is narrowed to ~1280px with `clamp(1.5rem, 5vw, 5rem)` horizontal padding on top of that, leaving ~160px+ of empty space on each side on a 1440px screen. For a futuristic racing brand, content should be wider, more edge-to-edge, and less symmetric.

### Root Cause
- `vite-react.cjs` hardcodes `--max-width: 1280px` and `padding: 0 clamp(1.5rem, 5vw, 5rem)` in the CSS foundation regardless of aesthetic.
- The `buildLayoutPersonalityBlock()` function defines `gridStyle: 'geometric'` for futuristic but this never maps to a concrete `--max-width` or padding override.
- `buildPageLayoutSpec()` emits the same section structure pattern for every aesthetic.
- There are no aesthetic-driven CSS custom property overrides for spacing.

### Sub-problems
- [ ] **2.1** Add an `AESTHETIC_LAYOUT_CSS` map in `vite-react.cjs` that overrides `--max-width` and padding per aesthetic:
  - `futuristic` → `--max-width: 1440px`, padding `0 clamp(1rem, 2.5vw, 2.5rem)`
  - `luxury` → `--max-width: 1100px`, padding `0 clamp(2rem, 5vw, 6rem)`
  - `minimal` → `--max-width: 720px`, padding `0 clamp(1.5rem, 4vw, 3rem)`
  - `brutalist` → `--max-width: 100%`, padding `0 clamp(1rem, 3vw, 3rem)`
  - `editorial` → `--max-width: 1200px`, padding `0 clamp(2rem, 6vw, 7rem)`
- [ ] **2.2** Inject the aesthetic CSS overrides into the `:root` block in the generated `src/index.css`.
- [ ] **2.3** Update `buildPageLayoutSpec()` section wrapper template to use the aesthetic max-width instead of a fixed value.
- [ ] **2.4** Add a "Content Width" control to the Layout tab (or Output tab) in `ProjectBuilderPanel.tsx` — three options: `Contained (1280px)` / `Wide (1440px)` / `Full-bleed`. This overrides the aesthetic default.
- [ ] **2.5** For `futuristic` and `brutalist`: update `STYLE_RULES` to include an explicit rule about full-width content blocks with no center-column constraint.

### Files to Modify
- `DemoCLI/generators/vite-react.cjs` — `buildStyleEnforcementBlock`, `buildPageLayoutSpec`, CSS foundation block
- `electron/promptEnhancer.cjs` — pass `layoutPersonality.maxWidth` derived value
- `src/features/project-builder/ProjectBuilderPanel.tsx` — optional content-width control

### Verification
Generate futuristic project → open in browser → content should reach close to the viewport edges. No 160px+ gutters on a 1440px screen.

### Notes / Solution Log
_(fill in as you work)_

---

## Issue #3 — Icons & Emojis: Poor Quality Fallbacks

### Problem
The current CLAUDE.md instruction bans lucide-react imports in `App.tsx` entirely, forcing the AI to use Unicode symbols (`→ ← ✕ ☰`) or inline `<svg>` elements. The result in the RacePalace site was ugly or mismatched emoji/icons that broke the futuristic aesthetic.

### Root Cause
- `vite-react.cjs` CLAUDE.md generation includes: _"Do NOT import from any icon library... Use Unicode symbols or inline SVG."_
- The ban exists because TypeScript doesn't always catch invalid icon names, but this overcorrects — it forces ugly fallbacks.
- `lucide-react` IS installed as a dependency in the generated project (it's in `discoveredDeps`), but Claude Code is blocked from using it.

### Sub-problems
- [ ] **3.1** Remove the blanket ban on lucide-react from the CLAUDE.md instruction in `vite-react.cjs`.
- [ ] **3.2** Replace it with a **safe-list approach**: provide a vetted list of 20-30 icon names confirmed to exist in `lucide-react` (e.g., `ChevronDown`, `ArrowRight`, `Menu`, `X`, `Star`, `Shield`, `Zap`, `Trophy`, `Car`, `ShoppingCart`, `Phone`, `Mail`). Claude Code may ONLY import icons from this list.
- [ ] **3.3** Add an **aesthetic-to-icon-style** mapping: futuristic → prefer geometric/minimal icons (`Zap`, `Shield`, `Target`), luxury → minimal (`ArrowRight`, `ChevronDown`), playful → expressive (`Star`, `Heart`, `Sparkles`). Inject the icon recommendation into the CLAUDE.md aesthetic section.
- [ ] **3.4** Optionally add an "Icon Style" selector to the Output tab in `ProjectBuilderPanel.tsx`: `Auto (AI)` / `Lucide React` / `Unicode Only` / `No Icons`. Pass to generator.

### Files to Modify
- `DemoCLI/generators/vite-react.cjs` — update CLAUDE.md icon instruction, add safe icon list
- `src/features/project-builder/ProjectBuilderPanel.tsx` — optional icon preference control

### Verification
Generate futuristic project → check that icons render properly in browser, match the aesthetic, no broken icon names.

### Notes / Solution Log
_(fill in as you work)_

---

## Issue #4 — Navbar / StaggeredMenu: Wrong Position & Broken Z-index

### Problem
`StaggeredMenu` is a navigation component. In the RacePalace testcase it was placed `in-flow` with `zLayer: content` (z-index: 1), meaning it rendered as a mid-page block instead of a fixed top-of-page navbar. It was visually broken because it has no intrinsic layout context as an in-flow block.

### Root Cause
- In `App.tsx`, all `Components` category items default to `in-flow / content / medium` in the auto-populate logic (line ~122).
- There is no name-pattern detection for nav-type components (`Menu`, `Nav`, `Header`, `Navbar`).
- The CLAUDE.md provides no special instructions for positioning a fixed navbar or adding `padding-top` to the body to offset it.
- The scaffold in `buildAppScaffold()` renders all in-flow components inside `<section>` tags — a nav component inside a `<section>` is semantically and visually wrong.

### Sub-problems
- [ ] **4.1** In `App.tsx` auto-populate `useEffect`: add name-pattern detection — if `comp.name.toLowerCase()` includes any of `['nav', 'menu', 'header', 'topbar']`, default to `position: 'fixed', zLayer: 'overlay', heightHint: 'strip', xAlign: 'full-width'`.
- [ ] **4.2** In `vite-react.cjs` `buildAppScaffold()`: detect nav/menu components in the `fixed` array and render them with `position: fixed, top: 0, left: 0, right: 0, zIndex: 999` (not `inset: 0` which covers the whole screen).
- [ ] **4.3** When a nav component exists: inject `paddingTop` onto the first in-flow section (equal to estimated navbar height: `80px`).
- [ ] **4.4** Add a CLAUDE.md instruction block for navbar components: _"Navbar is fixed at top (z: 999). First content section must have paddingTop ≥ 80px to clear it."_
- [ ] **4.5** Add a visual warning badge in the Layout tab when a nav-type component is set to `in-flow` position: ⚠ "Navigation components should usually be Fixed."

### Files to Modify
- `src/App.tsx` — auto-populate defaults for nav-pattern names
- `DemoCLI/generators/vite-react.cjs` — `buildAppScaffold`, CLAUDE.md nav instruction block
- `src/features/project-builder/ProjectBuilderPanel.tsx` — warning badge in Layout tab row

### Verification
Select StaggeredMenu + any background → generate → StaggeredMenu renders at the top of the page, fixed, with correct z-index. First section has padding-top clearing the nav height.

### Notes / Solution Log
_(fill in as you work)_

---

## Issue #5 — Style Fidelity Weak: Futuristic Aesthetic Barely Visible

### Problem
Despite the `STYLE_RULES` map, `buildStyleEnforcementBlock()`, and `buildReferenceBlock()` injections from the previous improvement pass, the RacePalace output still looks generic and not distinctly futuristic. The STYLE_RULES are written as instructions, but Claude Code doesn't always follow instructions reliably — it defaults to safe, center-aligned, lightly-styled output.

### Root Cause
- Style rules are injected as **textual instructions in CLAUDE.md** — they are "soft" constraints that Claude Code can partially ignore.
- No pre-written CSS for the aesthetic is injected directly into `src/index.css` — all styling depends on Claude Code interpreting and applying rules.
- The design token values (`--color-bg`, `--color-primary`, etc.) are derived from `enhancedPrompt.designTokens` but may not map to strong futuristic colors (near-black bg, neon accent).
- No "hard floor" CSS exists that forces the aesthetic even if Claude Code does the minimum.

### Sub-problems
- [ ] **5.1** Create an `AESTHETIC_BASE_CSS` map in `vite-react.cjs`: pre-written CSS blocks per aesthetic that are **always injected** into `src/index.css` regardless of what Claude Code writes. For futuristic: dark bg, text-shadow on headings, grid overlay texture, glow on primary CTA, uppercase labels.
- [ ] **5.2** These base CSS blocks should target specific element selectors (`h1, h2`, `section`, `.cta-btn`, `nav`) so they apply globally even if Claude Code doesn't add inline styles.
- [ ] **5.3** Improve the `buildStyleEnforcementBlock()` to include **3–5 code examples** per aesthetic (not just text rules), e.g., show the exact CSS `box-shadow: 0 0 20px var(--color-primary)` inline.
- [ ] **5.4** In `promptEnhancer.cjs`: ensure futuristic aesthetic maps to strong design tokens — `--color-bg: #020408`, `--color-primary: #00f5ff` or similar neon. Add an `AESTHETIC_DESIGN_TOKENS` map as a fallback when the AI-generated tokens are too conservative.
- [ ] **5.5** Add a "Style Intensity" slider/toggle to the Style tab in `ProjectBuilderPanel.tsx` (Subtle / Balanced / Full Commitment). At Full Commitment, increase enforcement language and inject more aggressive base CSS.

### Files to Modify
- `DemoCLI/generators/vite-react.cjs` — add `AESTHETIC_BASE_CSS` map, inject into `index.css`, improve `buildStyleEnforcementBlock`
- `electron/promptEnhancer.cjs` — `AESTHETIC_DESIGN_TOKENS` fallback map
- `src/features/project-builder/ProjectBuilderPanel.tsx` — optional style intensity control

### Verification
Generate futuristic project → open in browser → page has clearly dark background, glowing elements, uppercase labels, neon accents. Should not look like a generic marketing site.

### Notes / Solution Log
_(fill in as you work)_

---

## Issue #6 — Images Tab Completely Unused

### Problem
The user uploaded a product image (racing-website-designs.png) via the Images tab. Zero impact on the generated output — the image was not copied to the project, not referenced in CLAUDE.md, and not used by Claude Code anywhere. The Images tab is entirely cosmetic from the AI's perspective.

### Root Cause
- `promptEnhancer.cjs` reads `designRules.fonts`, `designRules.colors`, `designRules.sizes` — but **completely skips `designRules.images`**.
- `vite-react.cjs` never receives image data and has no code to copy images to the project's `public/` folder.
- The generated CLAUDE.md has no `## ASSET REFERENCES` section.
- Base64 image data is stored in UI state but never forwarded through the IPC call chain.

### Sub-problems
- [ ] **6.1** In `electron/promptEnhancer.cjs`: read `systemContext.designRules.images`. For `logo` images: note the filename in the enhanced prompt as `projectMeta.logoAsset`. For `product` images: list as `projectMeta.productAssets[]`. For `inspiration` images: (optionally) send to Claude Sonnet vision to describe the color palette and style, add description to `projectMeta.styleInspiration`.
- [ ] **6.2** In `electron/codeGenerator.cjs` (or `vite-react.cjs`): before launching Claude Code, iterate `options.images` (logo + product). Write each base64 image to a file in the project's `public/` directory (e.g., `public/logo.png`, `public/product-1.jpg`).
- [ ] **6.3** In `vite-react.cjs` `buildClaudeMd()`: add a `## ASSET REFERENCES` section listing available image files:  
  ```
  ## ASSET REFERENCES
  - Logo: /logo.png  ← use as <img src="/logo.png"> in navbar/hero
  - Product images: /product-1.jpg, /product-2.jpg  ← use in product showcase sections
  ```
- [ ] **6.4** Pass image data through the IPC chain: `App.tsx` `handleBuilderGenerate` → `enhancePrompt` call must include `designRules.images` in `systemContext`. The `generatePlayground` call must include images in `options`.
- [ ] **6.5** Update `src/shared/types/api.ts` `GenerateOptions` to include `images?: ImageEntry[]`.
- [ ] **6.6** For inspiration images: add a step in `promptEnhancer.cjs` that sends inspiration images to Claude Sonnet (vision) with prompt _"Describe the color palette, layout style, and mood of this design reference in 2 sentences."_ Append result to `projectMeta.styleInspiration` string for CLAUDE.md context.

### Files to Modify
- `electron/promptEnhancer.cjs` — read images from designRules, send inspiration to vision
- `electron/codeGenerator.cjs` — write image files to `public/` before Claude Code runs
- `DemoCLI/generators/vite-react.cjs` — `buildClaudeMd()` asset references section
- `src/App.tsx` — pass images in both `enhancePrompt` and `generatePlayground` calls
- `src/shared/types/api.ts` — add `images` to `GenerateOptions`

### Verification
Upload a logo + product image → generate → verify `public/logo.png` exists in project, CLAUDE.md has `## ASSET REFERENCES`, and the generated App.tsx references `/logo.png` in the navbar/hero.

### Notes / Solution Log
_(fill in as you work)_

---

## Working Notes

_Use this section to log decisions, tools used, or cross-issue dependencies discovered while working._

---

*Tracker created: 2026-04-20. Based on RacePalace testcase feedback.*
