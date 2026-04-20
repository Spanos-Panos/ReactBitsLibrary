# BitForge Generation — Post-Testcase Improvement Plan

**Test run:** AXIOM Studio (v3) — 2026-04-20  
**Cost:** $0.58 | **Time:** ~8 min | **Result:** Generated successfully, 0 TypeScript errors

---

## Summary

The pipeline is now stable (no crashes, no timeouts). The quality bar is the next frontier. Six concrete issues were identified — each with a root cause and a clear fix path.

---

## Issue 1 — Selected Components Not Used

**Observed:** TextPressure (TextAnimations) was selected but absent from the generated App.tsx.

**Root cause:** Claude Code reads component files but has no hard constraint forcing it to *use* all of them. It drops components it can't immediately fit into its mental model of the site.

**Fix ideas:**
- In `CLAUDE.md`, change the wording from "use these components" to a hard checklist with a compliance check: `❌ FAIL if any of the following components are missing from App.tsx: [list]`
- In `vite-react.cjs`, after generation, run a post-check: grep the generated `App.tsx` for each selected component's import name — if any are missing, re-invoke Claude Code with a targeted correction prompt ("You forgot to use TextPressure. Add it to the hero section now.")
- The scaffold (`buildAppScaffold`) already imports all components — if Claude Code rewrites App.tsx from scratch it loses them. Add a note: `// DO NOT remove any import — every import must appear in JSX at least once`

**Priority:** High — users selected these components deliberately.

---

## Issue 2 — Layout Looks Generic / AI-Like

**Observed:** The page structure, spacing, and section proportions felt standard and predictable. No sense of editorial risk or visual personality.

**Root cause:** The layout scaffold provides correct structure but no visual personality hints. Claude Code defaults to safe, symmetrical, center-aligned layouts. The Layout Vision block in the enhanced prompt gives structure data but not *aesthetic direction* for the layout itself.

**Fix ideas:**
- Add a `layoutPersonality` field to the enhanced prompt that maps style → layout tendencies:
  ```
  brutalist → flush-left text, no centering, raw grid, dense sections
  editorial → large left margin, oversized numbers, asymmetric columns
  cinematic → full-bleed sections, sparse content, bold vertical rhythm
  minimal → single-column, generous negative space, no decorative elements
  ```
- Inject these layout personality rules into CLAUDE.md under a new `## LAYOUT PERSONALITY` section, derived from the style direction in the enhanced brief.
- In the scaffold, vary section alignment per style (e.g., for cinematic: `text-align: left`, large padding, for brutalist: no padding, full-bleed).
- Consider adding a `layoutPersonalityHint` to `buildAppScaffold()` so the pre-written section stubs already have the right padding/alignment class.

**Priority:** High — this is the biggest perceived quality gap.

---

## Issue 3 — Scrollbar: No Control

**Observed:** The default browser scrollbar is visible and breaks the aesthetic of dark/cinematic sites. No option to hide or style it.

**Root cause:** The app has no scrollbar controls exposed to the user.

**Fix ideas (UI — ProjectBuilderPanel or a new settings panel):**
- Add a **Scrollbar** toggle group in the Layout tab or a new "Finish" tab with two options:
  - `Hide` — injects `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` into `index.css`
  - `Custom` — opens a mini color picker for track/thumb colors and injects a styled `::-webkit-scrollbar` block
- Store preference in the project config and pass it through `options` to `vite-react.cjs`
- In `vite-react.cjs`, inside the CSS foundation builder, check `options.scrollbar` and inject the appropriate CSS block

**Priority:** Medium — small feature, big polish impact for dark aesthetic sites.

---

## Issue 4 — Content Too Far From Screen Edges (Excessive Padding)

**Observed:** Horizontal padding/margins were very large, leaving content floating in the center with too much dead space on both sides.

**Root cause:** The CSS foundation builder in `vite-react.cjs` sets `--section-padding` based on the enhanced prompt, but Claude Code then adds *additional* padding inside sections on top of that, compounding the effect. Also `--max-width` might be too narrow (e.g., 1200px centered on a 1920px screen = 360px dead space each side).

**Fix ideas:**
- In CLAUDE.md, add an explicit rule: `Section inner padding: use --section-padding for top/bottom only. Left/right padding is handled by the max-width wrapper — do NOT add additional horizontal padding on sections or their children.`
- Expose a `contentWidth` preset in the UI: `Tight (960px)` / `Normal (1200px)` / `Wide (1440px)` / `Full bleed` — and pass it through to `--max-width` in CSS variables.
- In the scaffold's section stubs, set `padding: 0` explicitly so Claude Code must opt-in to padding rather than defaulting wide.

**Priority:** Medium — directly affects perceived design quality.

---

## Issue 5 — Poor Color Contrast on Text

**Observed:** Some text was hard to read due to low contrast against the background (e.g., muted gold on near-black, or secondary text color on dark surfaces).

**Root cause:** Claude Code picks text colors based on the palette but doesn't verify contrast ratios. Muted colors (`#5A5A5A`, `#C8A96E`) used at small sizes on dark backgrounds often fail WCAG AA.

**Fix ideas:**
- In the enhanced prompt's `designTokens.colors` block, add a `textOnBg` contrast hint: e.g., `"primary text #E8E4DC on #080808 — high contrast OK"` / `"accent #C8A96E — use only for display text ≥ 1.5rem, not body copy"`
- In CLAUDE.md, add a contrast rule: `Muted/accent colors (--color-muted, --color-accent) must NOT be used as body text color. Reserve them for: labels ≥ 0.8rem uppercase, decorative elements, large display text only.`
- Post-generation: could run a lightweight contrast audit script that scans the generated CSS for color pairings and flags low-contrast combinations before reporting success.

**Priority:** Medium-High — affects readability and perceived professionalism.

---

## Issue 6 — Style Strength Weak (~20-30% of Target)

**Observed:** Selecting "brutalist" produced a site that felt only vaguely brutalist. The style wasn't committed — it hedged toward safe, modern defaults.

**Root cause:** The style direction is described in prose in the enhanced prompt but Claude Code interprets it loosely. It defaults to "nice website" aesthetics unless given concrete, specific, uncommissable rules. The style system needs to translate vibes into **explicit CSS and layout decisions**.

**Fix ideas (most impactful):**

### A — Style Rule Injection (short term, in vite-react.cjs)
Build a `styleRuleMap` that maps each style direction to a set of concrete CSS + layout rules injected into CLAUDE.md:

```js
const STYLE_RULES = {
  brutalist: [
    "Borders: 2-4px solid black or white only — no border-radius ever",
    "Typography: heavy weight, large, flush-left, no letter-spacing tricks",
    "Layout: no centering — all content flush left or grid-aligned",
    "Colors: high contrast only (black/white + 1 accent max)",
    "No transitions except on interactive elements",
    "Sections separated by thick borders, not whitespace",
  ],
  cinematic: [
    "Full-bleed sections: 100vw, no inner padding",
    "Typography: oversized, light weight, generous letter-spacing",
    "Color: near-black background, off-white text, max 1 accent",
    "Transitions: slow (0.8s-1.2s), ease-out only",
    "No decorative elements except a single thin horizontal rule",
  ],
  // ... glassmorphism, editorial, etc.
};
```

Inject these as a `## STYLE ENFORCEMENT RULES` section in CLAUDE.md — these are stated as **must-follow**, not suggestions.

### B — Screenshot Polish Loop (medium term)
After Claude Code finishes writing files:
1. Spin up Vite (`npm run dev`) in headless mode
2. Take a Playwright/Puppeteer screenshot of the running site
3. Send the screenshot + the original brief to Claude with prompt: "This is the generated site. Does it match the style direction? List specific CSS changes to improve fidelity. Focus on: typography weight/size, color contrast, layout density, border usage."
4. Apply those changes automatically or show them to the user as a "Polish Pass" option

**Cost estimate:** 1 extra Claude call (vision) + ~30s Playwright — maybe $0.05-0.10 per generation.

### C — Internet Reference Search (medium term)
Before code generation, do a web search for `"{style} web design examples site:awwwards.com"` and extract CSS/layout patterns from top results. Inject a `## REFERENCE PATTERNS` block into CLAUDE.md with actual observed CSS properties from award-winning sites of that style.

**Priority:** High — this is the core value proposition. Users expect the style to feel committed.

---

## Cross-Cutting: More Budget / Time for Better Results

The current pipeline uses Claude Haiku for enhancement (fast/cheap) and Claude Code Sonnet for generation. Potential upgrade path:

| Stage | Current | Upgrade option |
|-------|---------|----------------|
| Prompt enhancement | Haiku ($0.003) | Sonnet ($0.04) — richer, more specific briefs |
| Code generation | Claude Code Sonnet | Claude Code Opus — more creative, better aesthetics |
| Polish pass | None | Add Sonnet vision call (+$0.05) |

Could offer the user a **Quality tier selector**: Fast ($0.30, Haiku enhance), Standard ($0.60, current), Premium ($1.50, Sonnet enhance + vision polish).

---

## Work Order (Suggested Priority)

| # | Issue | Effort | Impact |
|---|-------|--------|--------|
| 1 | All selected components must appear in output | Small | High |
| 2 | Style enforcement rules per style direction | Medium | High |
| 3 | Layout personality hints per style | Medium | High |
| 4 | Color contrast rules in CLAUDE.md | Small | Med-High |
| 5 | Fix excessive horizontal padding | Small | Medium |
| 6 | Scrollbar hide/customize UI + CSS injection | Small | Medium |
| 7 | Screenshot polish loop | Large | High |
| 8 | Internet reference search at generation time | Large | High |

Start with 1, 2, 4 — all are CLAUDE.md / prompt changes, low risk, high leverage.

---

*Generated from testcase AXIOM Studio v3 — 2026-04-20*
