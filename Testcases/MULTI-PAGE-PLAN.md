# Multi-Page Project Generation — Implementation Plan

**Scope:** Add a "Generate Project Structure" flow that produces a real multi-page React app (React Router, shared navbar layout, per-page component assignment) at zero API cost. Claude-limited and mixed approaches are designed but built later.

**Answers locked in:**
- Page info: Title + Type per page (Home / About / Services / Contact / Custom)
- First approach: No-cost deterministic template scaffold
- Component scope: Navbar is global (all pages), remaining components are assigned per page

---

## 0. Quick Reference — Files Touched

| Area | File |
|------|------|
| Types | `src/shared/types/index.ts` |
| UI — Pages tab | `src/features/project-builder/ProjectBuilderPanel.tsx` |
| UI — new modal | `src/features/generation/StructureWizard.tsx` (new) |
| Hook for modal | `src/shared/hooks/useStructureWizard.ts` (new) |
| App wiring | `src/App.tsx` |
| IPC bridge type | `src/shared/types/api.ts` |
| Preload | `electron/preload.cjs` |
| Main process | `electron/main.cjs` |
| Generator (no-cost) | `DemoCLI/generators/structure-generator.cjs` (new) |
| CLI entry | `DemoCLI/index.cjs` |

---

## 1. Types & Data Structures ✅ DONE (session 1)

- [x] **1.1** Add `PageType` union to `src/shared/types/index.ts`
  ```ts
  export type PageType = 'home' | 'about' | 'services' | 'contact' | 'custom';
  ```

- [x] **1.2** Add `PageConfig` interface
  ```ts
  export interface PageConfig {
    id: string;           // uuid or index-based e.g. "page-1"
    title: string;        // display name → used as route label and file name
    type: PageType;
    componentIds: string[]; // selected component ids assigned to THIS page (no navbar)
  }
  ```

- [x] **1.3** Add `ProjectStructureOptions` interface
  ```ts
  export interface ProjectStructureOptions {
    pages: PageConfig[];
    navbarComponentId: string;    // the one navbar selected
    projectName: string;
    outputPath: string;
    packageManager: 'npm' | 'pnpm' | 'yarn';
  }
  ```

- [x] **1.4** Add `StructureGenerateResult` interface (mirrors `GenerateResult`)
  ```ts
  export interface StructureGenerateResult {
    success: boolean;
    path?: string;
    error?: string;
  }
  ```

---

## 2. UI — Pages Tab in ProjectBuilderPanel

- [x] **2.1** Increase max selected components from current limit → **5**
  - Already was 5 (`MAX_SELECTED_COMPONENTS_TOTAL = 5` in App.tsx)

- [x] **2.2** Add `pages` state to the builder panel
  - Lifted to `App.tsx` (same pattern as `layoutConfig`)

- [x] **2.3** Add `"Pages"` tab to the existing tab row (alongside Layout, Style, Brief, etc.)
  - Tab label: `Pages`
  - Tab icon: layers SVG

- [x] **2.4** Build the Pages tab content panel
  - [x] **2.4a** Page count control — `+` / `−` buttons, label shows current count, max 4
  - [x] **2.4b** Per-page row: text input for **Title** + dropdown for **Type** (Home / About / Services / Contact / Custom)
  - [x] **2.4c** Per-page component assignment — a mini chip list showing only the non-navbar selected components; user checks which ones go on this page
  - [x] **2.4d** Navbar indicator — show a fixed row at the top: `Navbar: [NavbarComponentName] → all pages` in muted style (not editable)
  - [x] **2.4e** Validation hint — if no navbar is selected, show a soft warning: `"Select a Navbar component to enable multi-page generation"`

- [x] **2.5** Pass `pages` state up/through same way as `layoutConfig` — include in preset save/load

---

## 3. Navbar Detection Utility

- [x] **3.1** Create `isNavbarComponent(name: string): boolean` helper inline in the panel
  - Match: name includes `"nav"` (case-insensitive) OR name includes `"Menu"` OR `"Header"`

- [x] **3.2** In the builder panel, derive `navbarComponent` from selected components

- [x] **3.3** Show the "Generate Project Structure" button as **disabled** with tooltip when `navbarComponent` is null

---

## 4. "Generate Project Structure" Button

- [x] **4.1** Add button below "Generate Demo Project" in `ProjectBuilderPanel.tsx`
  - Label: `Generate Project Structure`
  - Style: secondary style (outlined / less prominent)
  - Disabled state: when `navbarComponent` is null

- [x] **4.2** On click: call `onGenerateStructure(pages, navbarComponentId)` prop (new prop passed from App.tsx)

---

## 5. Generation Modal — StructureWizard

- [x] **5.1** Create `src/features/generation/StructureWizard.tsx`
  - Mirrors the existing `GenerateWizard.tsx` layout/style
  - Fields: Project name, Output path, Package manager, Approach selector
  - Shows page summary below fields

- [x] **5.2** Generation approach selector (3 options, styled as radio cards)
  - `Free  — Template scaffold, no AI` ← **default, only active one for now**
  - `Smart — Claude-assisted ($0.15 max)` ← greyed out / "coming soon" badge
  - `Mixed — Template + AI polish` ← greyed out / "coming soon" badge

- [x] **5.3** Create `src/shared/hooks/useStructureWizard.ts`
  - State: `isOpen`, `pages`, `navbarId`, `projectName`, `outputPath`, `packageManager`
  - Methods: `open(pages, navbarId)`, `close()`

- [x] **5.4** Wire modal open/close in `src/App.tsx`
  - New handler `handleGenerateStructure(pages, navbarId)` → opens StructureWizard
  - On confirm → calls `window.reactBitsApi.generateStructure(options)`

---

## 6. IPC Layer ✅ DONE (session 1)

- [x] **6.1** Add `generateStructure` to `src/shared/types/api.ts` ReactBitsApi interface

- [x] **6.2** Add to `electron/preload.cjs`
  ```js
  generateStructure(options) {
    return ipcRenderer.invoke('generate-structure', options);
  },
  ```

- [x] **6.3** Register IPC handler in `electron/main.cjs`
  ```js
  ipcMain.handle('generate-structure', (_event, options) =>
    generateStructure(options)
  );
  ```

- [x] **6.4** Add `generateStructure` export to `DemoCLI/index.cjs` and wire to the new generator

---

## 7. No-Cost Generator — `structure-generator.cjs` ✅ DONE (session 1)

### 7.1 Scaffold & Install
- [x] **7.1a** Run `npm create vite@latest {projectName} -- --template react-ts`
- [x] **7.1b** Add `react-router-dom` to dependencies before `npm install`
- [x] **7.1c** Run `npm install`
- [x] **7.1d** Inject selected component files into `src/components/`

### 7.2 Generate File Structure
- [x] **7.2a** Create `src/layouts/MainLayout.tsx`
- [x] **7.2b** For each page in `pages[]`, create `src/pages/{PageTitle}.tsx`
- [x] **7.2c** Create `src/App.tsx` with React Router setup
- [x] **7.2d** `src/main.tsx` — no changes needed (Vite template)
- [x] **7.2e** Write `src/index.css` with minimal reset + CSS variables
- [x] **7.2f** Update `index.html` — set `<title>` to project name

### 7.3 Navbar Prop Handling
- [x] **7.3a** Read the navbar component's `.tsx` file to extract its props interface
- [x] **7.3b** Pass safe default props to `<Navbar />` based on pages list (or TODO comment)

### 7.4 Route Map Generation
- [x] **7.4a** Page type → route path map (home→/, about→/about, etc.)

### 7.5 Cleanup & Verification
- [x] **7.5a** Delete Vite boilerplate: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`
- [x] **7.5b** Run `npx tsc --noEmit`
- [x] **7.5c** Report success with project path
- [x] **7.5d** Open in VS Code

---

## 8. Progress & Task Display

- [x] **8.1** Reuse existing `TaskBar` / `TaskOverlay` — generator emits same IPC events automatically
- [ ] **8.2** Add distinct task type label `"Structure"` vs `"Demo"` in the task system
- [ ] **8.3** Success notification shows: `"{ProjectName} — {N} pages ready"`

---

## 9. Preset System Integration

- [ ] **9.1** Include `pages` state in `SavedPreset` interface (schema v4)
  ```ts
  pages?: PageConfig[];   // v4 addition
  ```
- [ ] **9.2** Save `pages` in `handleSavePreset` in `App.tsx`
- [ ] **9.3** Restore `pages` in `handleLoadPreset` (fallback: default single Home page)
- [ ] **9.4** Bump `PRESET_SCHEMA_VERSION` to `4`

---

## 10. Future Phases (Design Only — Not Implemented Now)

### Phase 2 — Claude-Limited ($0.15 max)
- Pass the page structure + component list to Claude with a hard token budget
- Claude fills in: realistic section content, proper component prop values, CSS custom properties
- Hard cap: `max_tokens: 2000` per page, abort if cost exceeds $0.15
- Output: replaces the placeholder `{/* TODO */}` comments in each page file

### Phase 3 — Mixed Approach
- Run the no-cost generator first (instant skeleton)
- Then run one Claude call per page (up to 4) to polish prop values and add content
- Show two-phase progress: `Scaffolding... → Polishing Page 1/3 → Polishing Page 2/3 → Done`

---

## 11. Verification Checklist

- [ ] App loads, Pages tab is visible in the builder panel
- [ ] Can add up to 4 pages, each with a title and type
- [ ] Without a navbar selected: "Generate Project Structure" button is disabled
- [ ] With a navbar selected: button is enabled, modal opens
- [ ] Modal shows correct page summary, approach selector defaults to Free
- [ ] Clicking Generate creates the project in the output directory
- [ ] Generated project runs with `npm run dev` without errors
- [ ] Navigating between routes works (navbar links go to correct pages)
- [ ] Each page renders only its assigned components
- [ ] `tsc --noEmit` passes on the generated project
- [ ] Preset save/load round-trips the pages config correctly

---

*Created: 2026-04-21 | Branch: app-new-frontend | Priority: Ship the no-cost generator (sections 1–8) first*
*Session 1 (2026-04-21): Sections 1, 6, 7 complete*
*Session 2 (2026-04-21): Sections 2, 3, 4, 5 complete — zero TypeScript errors — remaining: 8.2, 8.3, 9.x*
