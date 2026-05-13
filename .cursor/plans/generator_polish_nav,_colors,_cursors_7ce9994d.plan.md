---
name: "Generator polish: nav, colors, cursors"
overview: Fix the reported runtime error and UX/style issues at the generator level so future BitForge outputs are stable (no undefined components), follow brief color tokens, and feel calmer/intentional for editorial + monochromatic briefs.
todos:
  - id: fix-mansory-runtime
    content: Add `Mansory` override in `component-mapper.cjs` so it renders `<Mansory items={[...]} />` (no `<Masonry>` tag) and always includes required `items`.
    status: completed
  - id: tokenize-colorbends
    content: Override `ColorBends` props to use token-based colors (via `var(--color-*)` + `color-mix`) instead of demo pink/blue.
    status: completed
  - id: bouncecards-hover
    content: Adjust `BounceCards` override to disable hover push behavior (set `enableHover={false}` and keep sensible sizing).
    status: completed
  - id: gooeynav-calmer
    content: Tune `GooeyNav` generation in `app-builder.cjs` based on aesthetic/colorStrategy (editorial+monochrome gets calmer particle settings).
    status: completed
  - id: targetcursor-buttons-only
    content: "Generate conditional rendering for `TargetCursor` in `App.tsx`: only render while pointer is over a `button` element."
    status: completed
  - id: reduce-white-glare
    content: Adjust `style-builder.cjs` to soften very-light monochromatic backgrounds by applying an off-white mix to `body` background (without changing the stored token values).
    status: completed
  - id: regen-and-typecheck
    content: Regenerate a sample portfolio and run `npm run typecheck` to confirm no regressions.
    status: completed
isProject: false
---

# BitForge generator fixes (Substrat + future builds)

## What we’ll fix (root causes)
- **Contact page crash (`Masonry is not defined`)**: the `Mansory` component’s manifest demo uses a `<Masonry>` tag + requires an `items` array. In generated pages we’re currently:
  - importing `Mansory` but rendering `<Masonry ... />` (undefined), and
  - rendering it without `items`.
- **Background/accents not matching brief**: some background components (e.g. `ColorBends`) still use manifest/demo colors instead of theme tokens.
- **BounceCards hover feels “bad”**: the component’s hover behavior aggressively pushes siblings; for editorial portfolios it reads gimmicky.
- **GooeyNav feels rushed**: `buildNavJsxForPages` currently hardcodes a busy config regardless of aesthetic.
- **TargetCursor feels random**: cursor is mounted globally; you want it active **only when hovering buttons** (for now).

## Files we’ll update
- [`DemoCLI/generators/shared/component-mapper.cjs`](c:\Users\Admin\Documents\Visual Studio Code\Reposetories\ReactBitRepository\DemoCLI\generators\shared\component-mapper.cjs)
  - Add/adjust overrides:
    - **`Mansory`**: render `<Mansory items={[...]} ... />` (tag matches import) and use local assets (joker placeholders for now) so it always works.
    - **`ColorBends`**: set `colors={[ ... ]}` to token-driven values (e.g. mixes of `var(--color-bg)`, `var(--color-text)`, `var(--color-accent)`) so monochromatic/editorial doesn’t become pink/blue.
    - **`BounceCards`**: set `enableHover={false}` (keep the entrance animation, remove the jarring push-on-hover interaction).
- [`DemoCLI/generators/project/app-builder.cjs`](c:\Users\Admin\Documents\Visual Studio Code\Reposetories\ReactBitRepository\DemoCLI\generators\project\app-builder.cjs)
  - **GooeyNav tuning**: in `buildNavJsxForPages` under `case 'GooeyNav'`, compute calmer defaults when the brief is editorial/monochromatic (lower particle count, smaller radii, less variance, and a safer `colors` array).
  - **TargetCursor gating (buttons only)**: when `TargetCursor` is selected, generate a tiny React state + `pointerover/pointerout` handler in `src/App.tsx` so the cursor layer is rendered only while the pointer is over a `button` element.
- [`DemoCLI/generators/shared/style-builder.cjs`](c:\Users\Admin\Documents\Visual Studio Code\Reposetories\ReactBitRepository\DemoCLI\generators\shared\style-builder.cjs)
  - **Reduce glare for light monochromatic briefs**: for very light `--color-bg` + `colorStrategy: monochromatic`, adjust the *applied* body background to an off-white mix (keep tokens intact) so portfolios don’t feel painfully white.

## How we’ll validate
- Regenerate a `Portfolio` preset similar to Substrat and confirm:
  - Navigating to `/contact` does not throw and `Mansory` renders.
  - `ColorBends` no longer uses pink/blue unless the brief calls for it.
  - BounceCards no longer shifts cards on hover.
  - GooeyNav feels calmer in editorial/monochrome.
  - TargetCursor only appears while hovering buttons.
- Run `npm run typecheck` in the main repo.

## Notes / constraints
- This plan applies **generator-level** changes; we won’t hand-edit `C:\Users\Admin\Documents\Visual Studio Code\Test\substrat-v1` directly, but after the generator fix you can regenerate and the new outputs will match.
