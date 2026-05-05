# BitForge — Project Context for AI Agents

## What This App Is

**BitForge** is an Electron desktop application for exploring the ReactBits UI component library and generating complete, styled demo projects using the Claude API. Users browse components, inspect their source/install instructions, configure a project brief (components + design direction + prompt), and trigger an AI-powered generation pipeline that produces a ready-to-run Vite + React site on disk.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Desktop shell | Electron (v40) |
| Animation | Framer Motion, GSAP |
| 3D / WebGL | Three.js, OGL, @react-three/fiber |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) — Claude Sonnet 4.6 |
| Styling | CSS Modules / plain CSS, CSS custom properties |
| Build | Vite (renderer) + Electron Builder (packager) |

---

## Source Layout (`src/`)

```
src/
  App.tsx                    Root component — wires all features together
  main.tsx                   React DOM mount point

  features/                  Domain feature modules — one folder per product area
    browser/                 Left sidebar: component catalogue (AnimatedList-based)
    inspector/               Right panel: source code / install / preview viewer
    project-builder/         Bottom panel: component chips + design config + prompt
    preset-manager/          Save/load named project presets
    generation/              Full AI generation pipeline UI
      GenerateWizard.tsx     Modal: project name / path / package manager
      TaskBar.tsx            Running task pills
      TaskOverlay.tsx        Expanded task log overlay
      LoadingScreen.tsx      App boot loading screen
      EnhancePromptButton    Sends raw prompt → Sonnet → structured JSON brief
      GenerationQueue/       Live task status sidebar widget

  showcase/                  ReactBits display components (what the app showcases)
    TextAnimations/          ShinyText, SplitText, GradientText
    Backgrounds/             Iridescence, PlasmaWave (used as app background)
    UIComponents/            FlowingMenu, PillNav, CardNav, AnimatedList

  shared/                    Cross-feature shared code
    types/                   TypeScript interfaces (index.ts, api.ts)
    hooks/                   useComponentLoader, useTaskManager, useGenerationWizard
    lib/                     Pure utilities: layoutConceptGenerator, wireframeRenderer
    data/                    Static data: componentRoles.ts
    components/              Shared UI: AddComponentModal, LayoutConceptPicker

  styles/                    Global CSS (never import inside feature files by name)
    tokens.css               Design tokens (colors, spacing)
    globals.css              Reset + shared element styles
    layout.css               App chrome (scene, panels, sidebar layout)
    sidebar.css, inspector.css, taskbar.css, wizard.css
```

---

## Electron Layer (`electron/`)

All `.cjs` files are **hand-written source** — Electron's main process cannot use ES modules.

| File | Purpose |
|---|---|
| `main.cjs` | Window creation, IPC handler registration, app lifecycle |
| `preload.cjs` | Exposes `window.reactBitsApi` bridge to renderer |
| `promptEnhancer.cjs` | Calls Claude Sonnet 4.6 to turn raw user prompt → structured JSON design brief |
| `aiComposer.cjs` | Primary AI-first project composer (Claude Code) for major layout/copy/style generation |
| `aiReviewer.cjs` | AI repair/polish passes used by quality-gate loop |
| `codeGenerator.cjs` | Legacy generator wrapper (kept for compatibility, not the primary runtime path) |
| `storage.cjs` | Preset persistence via `electron-store` |
| `watchdog.cjs` / `watchdog-launcher.cjs` | Keeps long-running Claude Code generation alive |

> `main.ts` in `electron/` is an unused draft — ignore it.

---

## Key Data Flows

### 1 — Component Browsing
```
src/reactbits-manifest.json
  → useComponentLoader (shared/hooks/)
  → ComponentListPane (features/browser/)
  → App.tsx state (selectedId, selectedIds)
  → ComponentInspector (features/inspector/)
```

### 2 — AI Project Generation
```
ProjectBuilderPanel (features/project-builder/)
  → App.handleBuilderGenerate
  → window.reactBitsApi.enhancePrompt
      → electron/promptEnhancer.cjs
      → Claude Sonnet 4.6
      → structured JSON brief (projectMeta, components, design, layout)
  → GenerateWizard modal (features/generation/)
  → window.reactBitsApi.generatePlayground
      → DemoCLI/index.cjs
      → scaffolder + AI-first composer (electron/aiComposer.cjs)
      → quality gates + AI repair loop (electron/aiReviewer.cjs)
      → fallback deterministic app-builder if composer fails
      → files written to disk
  → GenerationQueue / TaskOverlay (live logs via IPC)
```

---

## AI Model Usage

| Location | Model | Purpose |
|---|---|---|
| `electron/promptEnhancer.cjs` | `claude-sonnet-4-6` | Enhance raw prompt into structured design brief |
| `electron/aiComposer.cjs` | Claude Code (Sonnet) | Primary AI-first project composition |
| `electron/aiReviewer.cjs` | Claude Code (Sonnet) | Repair/polish passes for quality gates |
| `electron/codeGenerator.cjs` | Claude Code (Sonnet) | Legacy compatibility path |

---

## Critical Files to Know

- **`src/reactbits-manifest.json`** — Component catalogue. Do NOT edit by hand; regenerate via `scripts/`.
- **`src/shared/types/index.ts`** — Core types: `ReactBitsItem`, `Task`, `ComponentFile`, `ParsedInstallData`.
- **`src/shared/types/api.ts`** — `window.reactBitsApi` interface declaration (IPC bridge shape).
- **`src/features/project-builder/ProjectBuilderPanel.tsx`** — Most complex component; exports `StyleDirection`, `DesignRules`, `ClientBrief` types used throughout.
- **`src/features/preset-manager/PresetManager.tsx`** — Imports types from `project-builder/` (cross-feature dep).

---

## Common Patterns

- **IPC calls**: Always go through `window.reactBitsApi.*` (typed in `shared/types/api.ts`). Never call Electron APIs directly from renderer.
- **CSS**: Feature-specific CSS lives alongside its `.tsx` file. Global/layout CSS lives in `styles/`. Never create new files in `styles/` for feature-specific rules.
- **Types**: All shared types live in `shared/types/`. Feature-local types stay inside their feature folder.
- **Framer Motion**: Used for panel/tab transitions (`AnimatePresence`, `motion`). Pattern: `key` prop drives re-mount animations.
