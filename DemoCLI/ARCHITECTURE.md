# DemoCLI — Architecture & Session Log

## Directory Layout

```
DemoCLI/
  index.cjs                      ← Orchestrator. Routes to demo or project pipeline.
                                   Exports: generatePlayground, generateStructure

  utils/
    spawn.cjs                    ← runCommand() — spawns child processes, handles interactive prompts
    pm.cjs                       ← Shared package manager helpers:
                                     getScaffoldCmd(pm, name)  — builds `vite create` command
                                     getInstallCmd(pm)         — builds install command string
                                     patchPackageJson(path, deps, log)  — safely merges deps
    colorContrast.cjs            ← WCAG contrast utilities (getContrastColor, getContrastRatio)

  generators/
    demo/
      vite-react.cjs             ← Single-component demo generator (inspector "Generate Demo" button).
                                   Scaffolds minimal Vite+React project, injects one component +
                                   its usage code as App.tsx. Fast, no AI, no design rules.

    project/
      scaffolder.cjs             ← Full project skeleton: Vite scaffold → dep merge → install →
                                   inject all components → CSS tokens + globals → index.html →
                                   vite.config + tsconfig patches → dev.bat → .vscode tasks.
      app-builder.cjs            ← Generates src/App.tsx (single-page) or src/pages/*.tsx
                                   (multi-page with react-router-dom). Classifies components
                                   into fixed layers / navs / in-flow sections.
      content-builder.cjs        ← Turns clientBrief → structured content map (headlines,
                                   features, CTAs, etc.) consumed by page-builder.
      page-builder.cjs           ← Generates complete section JSX for each page type.
                                   Picks section variants, assigns components to slots,
                                   writes page TSX files for multi-page sites.
      page-policy.cjs            ← Route-aware section constraints and deterministic
                                   variant selection per page type.
      structure-generator.cjs    ← Standalone structure scaffold (separate flow from project gen).
      brief-writer.cjs           ← Writes Brief.md to the project root. Auto-recovers if
                                   app-builder failed to write it.
      reviewer-brief.cjs         ← Builds and writes REVIEWER_BRIEF.md — the AI reviewer's
                                   mission document. Lists mapped vs unmapped components,
                                   TS errors, priority fix order, and full brief JSON.

    shared/
      component-mapper.cjs       ← Maps every ReactBits component name → { importLine, jsx,
                                   isFixed, zIndex }. Reads from reactbits-manifest.json.
                                   Hand-crafted overrides for components whose usageMarkdown
                                   can't be cleanly extracted (AnimatedList, BounceCards, etc.)
      style-builder.cjs          ← Generates CSS: :root design tokens + aesthetic-specific
                                   globals + responsive rules + scrollbar + layering rules.
                                   Used by scaffolder (full project) only.

  synthetic-client/              ← Standalone synthetic client generator (separate feature).
    index.cjs
    generator.cjs
    local-generator.cjs
    archetypes.cjs
    formatter.cjs
    nav-rules.cjs
```

---

## Two Generation Modes

### Mode A — Demo (inspector "Generate Demo" button)

Triggered when `selectedComponents` is empty and a single `name` is present in the payload.

```
index.cjs → generators/demo/vite-react.cjs
```

Steps:
1. Scaffold Vite+React+TS project
2. Merge a fixed dep list (framer-motion, motion, motion-utils, gsap, ogl, three, …)
3. Install deps
4. Inject the single component's source files into `src/components/`
5. Build `src/App.tsx` from the component's `usageMarkdown`:
   - Rewrite import path to match the injected location
   - If usage code has no `export default`, wrap it — splitting at the first `<` line so
     `const`/`let` declarations go into the function body (not inside the JSX return)
6. Write minimal `index.css` + `App.css`
7. Remove Vite boilerplate

### Mode B — Project (builder panel "Generate" button)

Triggered when `selectedComponents.length > 0`.

```
index.cjs → project/scaffolder → project/content-builder → project/app-builder
         → [optional] project/reviewer-brief + electron/aiReviewer
```

Steps:
1. **Scaffolder** — full project skeleton + all deps installed
2. **Content builder** — clientBrief → structured content object
3. **App builder** — writes App.tsx (single) or page files (multi-page)
4. **Brief writer** — ensures Brief.md exists in project root
5. **TypeScript check** — errors captured, never aborts
6. **AI Reviewer** (if `aiSupport`) — writes REVIEWER_BRIEF.md, runs two pass review
   (makeover → quality gates → polish if gates fail), then deletes REVIEWER_BRIEF.md

---

## Key Data Flows

```
reactbits-manifest.json
  → shared/component-mapper.cjs   (load once, cache in memory)
      → project/app-builder.cjs   (getComponent, isNavComponent)
      → project/page-builder.cjs  (getComponent)
      → project/reviewer-brief.cjs (isComponentMapped)

utils/pm.cjs
  → demo/vite-react.cjs           (getScaffoldCmd, getInstallCmd, patchPackageJson)
  → project/scaffolder.cjs        (getScaffoldCmd, getInstallCmd, patchPackageJson)

utils/spawn.cjs
  → demo/vite-react.cjs           (runCommand)
  → project/scaffolder.cjs        (runCommand)
```

---

## Session Work Log

### Session 1 — Demo Generator Bug Fixes

**Problem 1: `motion/react` not resolved**
- `vite-react.cjs` installed `framer-motion` but not `motion` (the standalone package).
- 17 ReactBits components import from `motion/react`.
- Fix: added `'motion'` and `'motion-utils'` to the dep list.

**Problem 2: `images is not defined` ReferenceError**
- Usage code wrapping logic put ALL non-import lines (including `const images = [...]`)
  inside the JSX `return()`. JavaScript cannot have `const` declarations inside JSX.
- Fix: rewritten to split at the first `<` line. Everything before it goes into the
  function body as declarations; everything from it onward goes into `return()`.

**Problem 3: `PlasmaWave is not defined` ReferenceError**
- `ReactBitsComponents/Backgrounds/Ballpit/UsageBallpit.md` contained PlasmaWave's
  JSX (entire overlay structure) instead of Ballpit's own usage.
- The generated `App.tsx` imported `Ballpit` but rendered `<PlasmaWave>` — never imported.
- Fix: corrected `UsageBallpit.md` and the inline `usageMarkdown` in `reactbits-manifest.json`.

---

### Session 2 — Generator Codebase Restructure

**Phase 1 — Shared utilities**
- Created `utils/pm.cjs` with `getScaffoldCmd`, `getInstallCmd`, `patchPackageJson`.
  Previously each generator had its own inline version of all three.
- `vite-react.cjs` and `scaffolder.cjs` now import from this shared module.

**Phase 2 — Extract from `index.cjs`**
- `ensureBriefFile` (170 lines) → `generators/project/brief-writer.cjs`
- `buildBriefContext` + `writeReviewerBrief` (75 lines) → `generators/project/reviewer-brief.cjs`
- `index.cjs` shrunk from 669 → 348 lines.
- All `require()` calls hoisted to top level (were previously lazy inside async functions).
- Extracted `makeIpcEmitters()` helper to remove duplicated `onProgress`/`onLog` setup.

**Phase 3 — Directory restructure**
- `generators/` flat layout → three subdirectories with clear ownership:
  - `generators/demo/` — single-component demo path
  - `generators/project/` — full project pipeline
  - `generators/shared/` — modules consumed by multiple generators
- All internal require paths updated to reflect the new depth.
- `component-mapper.cjs` manifest path adjusted from `../../src/` to `../../../src/`.
- `style-builder.cjs` colorContrast path adjusted from `../utils/` to `../../utils/`.
- `scaffolder.cjs` joker-assets path adjusted from `'..', 'joker-assets'` to `'..', '..', 'joker-assets'`.
