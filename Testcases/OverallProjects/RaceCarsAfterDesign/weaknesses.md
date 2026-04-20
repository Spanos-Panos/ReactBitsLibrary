# RacePalace — Output Weaknesses & Scaffold Fixes

A diagnosis of the current Claude Code output (`localhost:5173`) plus concrete fixes to the scaffold so the next generation is better by default.

---

## 1. What's wrong with the generated page

### Layout
- **Single narrow column at desktop.** Content sits at ~40% of a 1440 viewport, hugging the left edge. Right 60% is dead black. The page isn't using desktop — it's a stretched mobile layout.
- **Every section is the same.** Full-width row → small heading left → small body left → thin divider. Five identical blocks stacked. No asymmetry, no full-bleed moments, no grid variation.
- **No visual rhythm.** Futuristic/experimental typography was requested; result is conservative and flat.

### Typography
- **Anton is undersized.** "30+" headline is maybe 60–80px. For a display face driving a brand moment, it should be 180–260px. Anton earns its keep only at poster scale.
- **No type hierarchy.** Eyebrow labels, stat numbers, section headings, and body copy all cluster within 3–4x of each other. Nothing dominates.
- **JetBrains Mono is wasted.** It's used only for tiny orange eyebrow labels. Mono should be doing structural work — data labels, coordinates, spec rows, timestamps — the stuff that makes racing UI feel telemetric.

### Content
- **No imagery.** Four images were uploaded (red racecar PNG, vintage F1, silhouette logo, references). None appear in the render. For a racing/accessories brand, the *absence* of product/vehicle imagery is the single biggest content failure.
- **Copy contradicts the brief.** "With 30+ years of combined expertise…" — brief says founded 2023. AI hallucinated tenure.
- **Generic ecosystem icons.** Tiny monochrome flat icons for "Gear / Replacement / Safety / Aero / Tires". No scale, no product context, no category photography.
- **Stats are underpowered.** 120+, 8,500+, 45 sit in a narrow sidebar card, barely larger than body copy. These are the scale-of-operation headline and should dominate.

### Components
- **Silk background is decorative noise.** Visible in hero only, disappears after the first viewport, doesn't tie sections together.
- **LogoLoop is invisible** — no brand logos are loading.
- **StaggeredMenu is broken.** "MENU" opens into a plain floating "HOME" panel in the corner with no brand mark, no close affordance, no hierarchy.
- **CountUp / SplitText** — no evidence they're animating; the stat numbers feel static.

### Branding
- **No brand mark in the header.** Just the word "MENU" floating in the corner. Brand invisible above the fold.
- **Red accent has no discipline.** Every button is the same orange rectangle. No use of red as a directional device (racing stripes, ticker bars, indexing marks, corner cuts).

---

## 2. Why the scaffold produced this

The generation is only as good as its brief. Here's what your `racecars_20042026_1414.json` is sending Claude Code and where it falls short.

### `projectPrompt` is 9 words with a typo
> "a page to showcase our brand and our sotre"

This is the *entire* layout intent. No section list, no hierarchy, no "hero is stats + racecar", no "feature full-bleed imagery on section 3", no "use monospace for specs". Claude Code is filling in 95% of the design decisions from priors.

**Fix:** require the user to write a structured brief before generation, or synthesize one from the `clientBrief` fields. Something like:

```
SECTIONS (top to bottom):
  1. Hero — brand mark, oversized stat (30+ stores), tagline, primary CTA
  2. Proof strip — tickerized: 120+ products, 8,500+ customers, 45 partners
  3. Product showcase — 3-col grid with real imagery
  4. Ecosystem — accessory categories, each with hero photo + 1-line
  5. Global presence — map or list of regions
  6. Visit CTA — oversized type + location pin

GRID: desktop 12-col, 1440 max, 1.5rem gutter
HIERARCHY: H1 180px Anton, H2 80px Anton, stat numerals 220px Anton,
  eyebrows 12px JetBrains Mono uppercase, body 16px Inter
USE MONO FOR: spec rows, coordinates, timestamps, section numbering
IMAGERY: every major section must have a real image or leave intentional negative space with monospace annotation
```

### `layoutConfig` is a component bag, not a layout
Right now it lists five components (Silk, CountUp, SplitText, LogoLoop, StaggeredMenu) with `position`, `xAlign`, `zLayer`, `heightHint`. The AI reads this as "put one of each on the page in order" — which is exactly what happened.

**Fix:** layoutConfig entries should include:
- `section` — what job does this component do in the narrative?
- `pairsWith` — other components/images in the same block
- `scale` — is this a hero moment or a supporting detail?
- `imagery` — which uploaded image belongs here?

### `designRules.images` is attached but not referenced
The AI can see images exist but has no instruction on *where* to use them. So it skips them.

**Fix:** tag each image with a role (`hero`, `product-1`, `logo-mark`, `reference-only`) and pass those tags into the layout brief so the prompt literally says "use `hero` image in section 1 as full-bleed right-aligned cutout".

### No negative examples
Claude Code doesn't know what *not* to do. It defaults to the safest web layout it knows (left-aligned narrow column).

**Fix:** inject an anti-pattern list into the system prompt: "DO NOT default to a single centered/left-aligned column. DO NOT use tiny icons in a row. DO NOT repeat the same section pattern."

### Desktop isn't enforced
`"strategy": "desktop", "maxWidth": "1280px"` is in the JSON, but the output is built mobile-first with no desktop breakpoint doing real work. The rule isn't reaching the code.

**Fix:** in the prompt to Claude Code, put desktop rules *first and hardest* — "design for 1440 desktop. Mobile is a responsive afterthought. All hero type must scale to ≥180px at ≥1200px viewport."

### Component registry vs. custom layout
Components like `Silk` and `StaggeredMenu` are drop-ins. They're useful as accents but shouldn't drive the layout. Right now the page *is* a stack of those components.

**Fix:** separate "layout sections" (written bespoke per page) from "accent components" (Silk, CountUp, etc.). Claude Code should author the sections and sprinkle the components inside them, not the other way around.

---

## 3. Concrete prompt-system improvements

1. **Block generation until `projectPrompt` is ≥80 words and passes a validator** (must mention: sections, hierarchy, imagery intent, desktop/mobile balance).
2. **Auto-synthesize a section plan from `clientBrief`** and show it to the user for edit before sending to Claude Code.
3. **Tag images by role** and pass them into the prompt as "use `{role}` at `{selector}` with treatment `{cover|contain|cutout}`".
4. **Add a `hierarchyRules` block** to `designRules` that specifies type sizes in px for h1/h2/h3/eyebrow/body/stat at desktop, and the px multiplier for mobile.
5. **Add anti-patterns to the system prompt** ("avoid left-aligned narrow single-column layouts; avoid tiny icon rows; avoid generic corporate copy like 'with X years of combined expertise'").
6. **Require each section to declare a `layoutPattern`** from an enum: `split`, `full-bleed-image`, `oversized-type`, `grid-3col`, `ticker`, `data-table`, `map-with-pin`, `stacked-quote`. This forces variety.
7. **Give the LLM a style memory** — one canonical page per aesthetic (Futuristic, Editorial, Brutalist, etc.) it can reference as a positive example.

See `RacePalace Redesign.html` in this project for what the output *could* look like with these fixes applied.
