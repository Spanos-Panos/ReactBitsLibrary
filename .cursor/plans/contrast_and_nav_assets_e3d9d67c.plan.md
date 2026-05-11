---
name: Contrast and nav assets
overview: Fix remaining invisible copy by (1) correcting PillNav hover/default color wiring and CSS inheritance, (2) adding theme-safe tokens and snippet cleanup so section and Stepper text always contrasts with surfaces, (3) extending deterministic asset copying and `resolveLogoUriSync` so nav and fragile components (e.g. StickerPeel) get a real `/public` icon such as `ReactIcon.svg` when the user provides none.
todos:
  - id: pillnav-colors-css
    content: "Fix PillNav: explicit .pill-label color in PillNav.css; change hoveredPillTextColor in app-builder + component-mapper (avoid var(--color-bg) on light sites)"
    status: completed
  - id: tokens-text-on-surface
    content: Add --color-text-on-surface (and optional muted) in style-builder.cjs using contrast vs surface
    status: completed
  - id: page-builder-surface-text
    content: Use --color-text-on-surface for copy on var(--color-surface) sections in page-builder.cjs
    status: completed
  - id: mapper-stepper-stickerpeel
    content: "Stepper snippet: replace #f8fafc/#cbd5e1 with theme vars; add StickerPeel override with public URL; grep/fix other hardcoded light text in DemoCLI generators"
    status: completed
  - id: scaffold-reacticon-nav-fallback
    content: Copy images/ReactIcons/ReactIcon.svg to public in scaffolder; extend resolveLogoUriSync with navName-aware fallback to /ReactIcon.svg
    status: completed
isProject: false
---

# Deterministic contrast, PillNav labels, and default component icons

## What is still going wrong

### PillNav: labels only on hover

Generated nav passes `hoveredPillTextColor="var(--color-bg)"` in [`buildNavJsxForPages`](DemoCLI/generators/project/app-builder.cjs) (mirroring the static mapper). On a **light** site, `--color-bg` is often **white or near-white**, which matches the **hover duplicate** (`.pill-label-hover` in [`PillNav.css`](ReactBitsComponents/Components/PillNav/PillNav.css) uses `color: var(--hover-text, #fff)`). Idle text should come from `.pill` → `color: var(--pill-text)`, but if **`--color-text` and `--color-surface` are both very light** (user palette), pill labels match the pill fill and disappear; hover briefly shows the animation layer with a different stack.

**Fix direction:** In `app-builder.cjs` (and static [`component-mapper.cjs`](DemoCLI/generators/shared/component-mapper.cjs) PillNav snippet for consistency), set `hoveredPillTextColor` to something that contrasts the **pill fill**, e.g. `var(--color-text)` or `var(--color-accent)`, not `var(--color-bg)`. In [`PillNav.css`](ReactBitsComponents/Components/PillNav/PillNav.css), add an explicit `color: var(--pill-text)` on `.pill-label` (and keep `.pill-label-hover` on `var(--hover-text)`) so idle color is never lost to inheritance / Tailwind preflight on `a`.

### “WHY ADJACENT … React Icon” and white-on-white blocks

- **Benefits / features** sections in [`page-builder.cjs`](DemoCLI/generators/project/page-builder.cjs) already use `var(--color-text)` on `var(--color-surface)` — if those two tokens are **too close** in the preset, list copy disappears. [`buildTokensCSS`](DemoCLI/generators/shared/style-builder.cjs) only enforces contrast for **text vs background**, not **text vs surface**.
- **Stepper** override in [`component-mapper.cjs`](DemoCLI/generators/shared/component-mapper.cjs) still uses hardcoded `#f8fafc` / `#cbd5e1` (same class of bug as the old SpotlightCard).
- **“React Icon”** matches the **StickerPeel** usage in [`src/reactbits-manifest.json`](src/reactbits-manifest.json): `import logo from '../public/ReactIcon.svg'` plus `alt="React Icon"`. The generator strips that import; the built JSX can resolve to a **broken `<img>`**, so the browser shows the **alt string** next to your benefits list.

**Fix direction:**

1. **Tokens** — In `style-builder.cjs`, after resolving `bg`, `text`, and `surface`, compute a **`--color-text-on-surface`** (hex) with [`getContrastColor`](DemoCLI/utils/colorContrast.cjs) / `getContrastRatio` against the resolved **surface** color (with try/catch for non-hex). Optionally add **`--color-muted-on-surface`** as `color-mix(in srgb, var(--color-text-on-surface) 65%, transparent)` or a second contrast pass for secondary copy.
2. **page-builder** — For sections that use `background: 'var(--color-surface)'` (benefits, CTA, etc.), switch body/list/paragraph inline styles from `color: 'var(--color-text)'` to **`var(--color-text-on-surface)`** (and muted variants where you use opacity). Keep headings consistent or use the same token for simplicity.
3. **component-mapper** — Replace Stepper step copy colors with `var(--color-text)` / `opacity` patterns. Add a **`StickerPeel` (and any similar)** override that uses **`imageSrc="/ReactIcon.svg"`** (or joker) so no Vite import is required.
4. **Grep pass** — Remove remaining `#f8fafc`, `#cbd5e1`, `#e2e8f0` in `DemoCLI/generators/**/*.cjs` used in generated JSX.

### Navbar image: configurable default (e.g. ReactIcon.svg)

You want a **repo-defined default** per component when the user has no image (e.g. PillNav → `images/ReactIcons/ReactIcon.svg`).

**Fix direction:**

1. **Scaffolder** — In [`scaffolder.cjs`](DemoCLI/generators/project/scaffolder.cjs), after joker assets, copy selected files from the BitForge repo into `public/` (at minimum `images/ReactIcons/ReactIcon.svg` → `public/ReactIcon.svg`).
2. **nav-build-helpers** — Extend [`resolveLogoUriSync`](DemoCLI/generators/shared/nav-build-helpers.cjs) (or a sibling map) with a per-nav fallback, e.g. `PillNav` / `CardNav` → `'/ReactIcon.svg'` **before** brand SVG / joker, when no user image applies. Pass `navName` into the resolver from `buildNavJsxForPages`.
3. **Optional config table** — Add a small constant map in `nav-build-helpers.cjs` or `component-default-assets.cjs` (`{ PillNav: '/ReactIcon.svg', CardNav: '/ReactIcon.svg', ... }`) so you can extend defaults without UI work first; a future preset/UI field can override the same map.

## Implementation order

1. **PillNav** — CSS explicit label color + generator `hoveredPillTextColor` change + mapper alignment.
2. **Tokens + page-builder** — `--color-text-on-surface` + section color updates.
3. **Mapper** — Stepper colors + StickerPeel (and grep for other hardcoded light text).
4. **Scaffold + logo resolver** — Copy `ReactIcon.svg` to `public/`; nav resolver prefers user images, then `/logo.svg`, then per-nav default, then brand SVG, then joker.

## Files to touch (concise)

| Area | File |
|------|------|
| Nav JSX + hover color | [`DemoCLI/generators/project/app-builder.cjs`](DemoCLI/generators/project/app-builder.cjs) |
| Static PillNav parity | [`DemoCLI/generators/shared/component-mapper.cjs`](DemoCLI/generators/shared/component-mapper.cjs) |
| Label inheritance | [`ReactBitsComponents/Components/PillNav/PillNav.css`](ReactBitsComponents/Components/PillNav/PillNav.css) (and optionally [`src/showcase/...`](src/showcase/UIComponents/PillNav/) if you keep showcase in sync) |
| Surface text token | [`DemoCLI/generators/shared/style-builder.cjs`](DemoCLI/generators/shared/style-builder.cjs) |
| Sections on surface | [`DemoCLI/generators/project/page-builder.cjs`](DemoCLI/generators/project/page-builder.cjs) |
| Stepper / StickerPeel / grep | [`DemoCLI/generators/shared/component-mapper.cjs`](DemoCLI/generators/shared/component-mapper.cjs) |
| Public assets + logo chain | [`DemoCLI/generators/project/scaffolder.cjs`](DemoCLI/generators/project/scaffolder.cjs), [`DemoCLI/generators/shared/nav-build-helpers.cjs`](DemoCLI/generators/shared/nav-build-helpers.cjs) |

## Risk notes

- **`color-mix` / `color()`** in inline styles: prefer **extra hex CSS variables** from `style-builder` so generated projects work on older engines if needed.
- **StickerPeel** override must match the real prop name (`imageSrc` vs `src`) — confirm against [`ReactBitsComponents/Animations/StickerPeel`](ReactBitsComponents/Animations/StickerPeel) before editing.
