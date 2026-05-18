# Universal Components — Contributor Guide

This folder is a **product UI library** for BitForge: buttons, cards, cookie banners, forms, backgrounds, and other “real site” pieces that make generated projects look sellable—not only ReactBits showcase effects.

It mirrors the **ReactBitsComponents** pattern (source + usage + install per component) but lives in a separate tree so licensing, sources, and generator rules stay clear.

---

## Why this exists

| ReactBits (`ReactBitsComponents/`) | Universal (`UniversalComponents/`) |
|-----------------------------------|-------------------------------------|
| Hero backgrounds, 3D, flashy nav, text FX | Cookie banners, buttons, pricing/feature cards |
| “Wow” demo pieces | “Shipped website” chrome |
| Curated from ReactBits library | You add from UIverse, CodePen, shadcn snippets, etc. |

**Goal:** Improve **deterministic** project generation (AI off) and manual reference sites by giving the generator real UI building blocks—not more plasma shaders.

---

## Current inventory (2026)

### Universal · Buttons (`UniversalButtons/`)

| Component | Deps | Notes |
|-----------|------|--------|
| `LogoutButton` | `styled-components` | Expand-on-hover logout control |

### Universal · Cards (`UniversalCards/`)

| Component | Deps | Notes |
|-----------|------|--------|
| `CoockiesCard` | Tailwind (`tailwindcss`, `@tailwindcss/vite`) | Fixed bottom banner in full projects |
| `ModernRevealCard` | `styled-components` | 3D flip / reveal on hover |
| `NeumorphismCard` | `styled-components` | Simple neumorphic panel |

Planned groups (create folder when you start adding): `UniversalBackgrounds/`, `UniversalForms/`, `UniversalCompliance/`, `UniversalLayout/`, etc.

---

## Folder layout (required shape)

```
UniversalComponents/
  README.md                    ← this file
  {GroupFolder}/               ← becomes “category” in BitForge (e.g. UniversalCards)
    {ComponentName}/           ← folder name MUST match component name
      {ComponentName}.tsx      ← default export: function ComponentName()
      Usage{ComponentName}.md  ← demo App code (REQUIRED for catalogue)
      {ComponentName}Install.md ← dependencies (CLI / MANUAL blocks)
```

**Example:**

```
UniversalComponents/UniversalCards/PricingCard/
  PricingCard.tsx
  UsagePricingCard.md
  PricingCardInstall.md
```

### Naming rules

1. **Folder name = file basename = default export name** (PascalCase), e.g. `LogoutButton`.
2. Usage file: `UsageLogoutButton.md` (prefix `Usage` + exact component name).
3. Install file: `LogoutButtonInstall.md`.
4. Import in usage: `import LogoutButton from './LogoutButton';` (relative `./`, same as ReactBits).

Typos are OK if consistent everywhere (e.g. `CoockiesCard`)—but renaming later means renaming folder + all three files + regenerating manifest.

---

## The three files (what each does)

### 1. `{ComponentName}.tsx`

- Default export: `export default function ComponentName() { ... }`
- Prefer **design tokens** in generated sites when you can: `var(--color-accent)`, `var(--color-surface)` (full projects inject these in `index.css`).
- **Tailwind** is fine (`className="..."`)—demos auto-enable Tailwind when detected.
- **styled-components** is fine—demos auto-install via import scan.
- Fix invalid JSX: `className` not `class`, `type="button"` on buttons, `aria-label` where useful.

### 2. `Usage{ComponentName}.md`

This file is the **catalogue entry** and **Generate Demo** source. Without it, the component **does not appear** in BitForge.

Minimal template (inline styles):

```tsx
import MyComponent from './MyComponent';

export default function App() {
  return (
    <motion.div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
    }}>
      <MyComponent />
    </motion.div>
  );
}
```

Tailwind template:

```tsx
import MyComponent from './MyComponent';

export default function App() {
  return (
    <motion.div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6">
      <MyComponent />
    </motion.div>
  );
}
```

Use a real `div` wrapper (not `motion.div` unless you import framer-motion in the usage file).

### 3. `{ComponentName}Install.md`

Parsed by the inspector **Install** tab. Use the same blocks as ReactBits:

```md
Install
CLI
pnpm = pnpm add styled-components
npm = npm install styled-components
yarn = yarn add styled-components
bun = bun add styled-components

Install
MANUAL
pnpm = pnpm add styled-components
npm = npm install styled-components
yarn = yarn add styled-components
bun = bun add styled-components

Source: https://example.com/original-snippet (license: MIT)
```

For Tailwind-only components, list `tailwindcss` and `@tailwindcss/vite` (see `CoockiesCard/CoockiesCardInstall.md`).

---

## After adding files — refresh the catalogue

From repo root:

```bash
node scripts/generate-manifest.cjs
```

Or restart BitForge (runs manifest on `npm run dev`):

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run dev
```

Manifest output: `src/reactbits-manifest.json` (includes **both** ReactBits and Universal entries; universal rows have `"library": "universal"`).

---

## Using components in BitForge

1. Open category in sidebar: **Universal · Buttons** or **Universal · Cards**.
2. Select component → inspector shows source + install instructions.
3. **Generate Demo** — single Vite app with only that component.
4. **Add to project builder** (checkbox) → **Generate project** (with AI on or off).

Selection limits (in `src/App.tsx`): `UniversalButtons: 5`, `UniversalCards: 5` per category; 10 total across all categories.

---

## How demos are built (single component)

Pipeline: `DemoCLI/generators/demo/vite-react.cjs`

1. Scaffold Vite + React + TS.
2. Merge base deps + **auto-detect imports** from your `.tsx` (e.g. `styled-components`).
3. If Tailwind classes detected in component or usage → add `tailwindcss`, patch `vite.config.ts`, `@import "tailwindcss"` in `index.css`.
4. Copy files to `src/components/{Category}/{ComponentName}/`.
5. Build `App.tsx` from `Usage*.md` (rewrites `./Component` import to the copied path).

If demo fails with “could not resolve X”, either add the import to your component (so scan picks it up) or extend install md and regenerate.

---

## How full projects use universals

Pipeline: `DemoCLI/index.cjs` → scaffolder → app-builder → page-builder.

1. **Files copied** to `src/components/{category}/{name}/` (same as ReactBits).
2. **Extra npm deps** from import scan (`extract-component-deps.cjs`).
3. **JSX placement** via `DemoCLI/generators/shared/component-mapper.cjs`:
   - Reads manifest `usageMarkdown` or uses **hand-crafted overrides** in `COMPONENT_JSX_OVERRIDES`.

### Overrides (when to add)

Add an override when:

- Component should be **fixed** (cookie banner bottom-center).
- Usage demo wrapper (100vw centering) should **not** appear inside a page section.
- Usage markdown is too complex to parse.

Example (already in repo):

```javascript
CoockiesCard: `<div style={{ position: 'fixed', bottom: '1.25rem', ... }}>
  <CoockiesCard />
</div>`,
```

After adding an override, no manifest change needed—restart generation only.

---

## Adding a **new sidebar category** (new group folder)

When you create e.g. `UniversalForms/`, BitForge will **not** show it until you register the category in **three places**:

| File | What to add |
|------|-------------|
| `src/App.tsx` | `PILL_NAV_ITEMS` — `{ id: 'UniversalForms', label: 'Universal · Forms' }` |
| `src/App.tsx` | `CATEGORY_LIMITS` — `UniversalForms: 5` (or your limit) |
| `src/features/browser/ComponentListPane.tsx` | `CATEGORY_ORDER` — same id + label |

Manifest script already scans **any** subfolder under `UniversalComponents/`—no change needed there.

Optional later: auto-discover categories from manifest instead of hardcoding.

---

## Key code paths (for AI agents)

| Concern | Path |
|---------|------|
| Scan universal folders → manifest | `scripts/generate-manifest.cjs` |
| Manifest JSON | `src/reactbits-manifest.json` |
| Item type (`library: 'universal'`) | `src/shared/types/index.ts` |
| Load files / install paths in UI | `src/shared/hooks/useComponentLoader.ts` |
| Electron file read | `electron/preload.cjs` (`resolveComponentDir`, `getComponentFullContext`) |
| Demo generator + Tailwind detect | `DemoCLI/generators/demo/vite-react.cjs` |
| Full project scaffold + dep scan | `DemoCLI/generators/project/scaffolder.cjs` |
| JSX in generated pages | `DemoCLI/generators/shared/component-mapper.cjs` |
| Import dep extraction | `DemoCLI/generators/shared/extract-component-deps.cjs` |
| Pinned package versions | `DemoCLI/utils/pm.cjs` (`SCAFFOLD_DEP_VERSIONS`) |

**Do not** put universal components inside `ReactBitsComponents/`—keep trees separate.

---

## Checklist — adding one component at home

- [ ] Create `UniversalComponents/{Group}/{Name}/` with three files (`tsx`, `Usage`, `Install`).
- [ ] Export name matches folder name.
- [ ] Usage file imports `./{Name}` and has `export default function App()`.
- [ ] Install lists every non-React npm package you import.
- [ ] Run `node scripts/generate-manifest.cjs`.
- [ ] If new **group** folder: update `App.tsx` + `ComponentListPane.tsx` (see above).
- [ ] Restart `npm run dev`, find component under **Universal · …**.
- [ ] **Generate Demo** — confirm it runs (`npm run dev` in output folder).
- [ ] Optional: add `COMPONENT_JSX_OVERRIDES` entry for full-project placement.
- [ ] Optional: note source URL + license in Install md.

---

## Suggested build order (premium sites)

1. **Compliance** — cookie banner, legal footer links  
2. **Buttons** — primary, secondary, ghost, icon  
3. **Cards** — feature, pricing, testimonial  
4. **Forms** — labeled fields, errors, contact shell  
5. **Backgrounds** — subtle grain/mesh (not heavy WebGL)  
6. **Layout** — `Section`, `Container`, page header  

ReactBits stays for **one** hero background + **one** nav per project; universals fill the rest.

---

## Relation to the “3 reference sites” workflow

1. Generate sites in BitForge with **AI-First Composer off**.  
2. Select universals + a few ReactBits pieces.  
3. Hand-polish in VS Code.  
4. Feed final `src/` back to improve `component-mapper`, `page-builder`, and overrides.

Universal components you add here directly improve what step 1 can ship without AI.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Component not in sidebar | Add `Usage{Name}.md`, run manifest script, restart app |
| Demo: “could not resolve styled-components” | Regenerate demo from BitForge (import scan); or `npm install styled-components` manually in demo folder |
| Demo: unstyled Tailwind | Usage/component uses Tailwind classes; regenerate demo (Tailwind auto-setup) or install Tailwind manually |
| Install tab empty | Fix `{Name}Install.md` format (`Install` / `CLI` / `MANUAL` headers) |
| Full project: dashed placeholder box | Add component to manifest + `COMPONENT_JSX_OVERRIDES` or valid usage markdown |
| Wrong path in inspector install fetch | Item must have `library: 'universal'` in manifest (regenerate manifest) |

---

## For another AI agent — session context

- **Product:** BitForge (Electron + React) — ReactBits explorer + project generator.  
- **User goal:** Build a library of universal UI, then improve **non-AI** generation quality; three hand-finished reference sites will be compared to generator output later.  
- **This folder:** User-curated components; each addition should follow the three-file contract and manifest refresh.  
- **Do not** hand-edit `src/reactbits-manifest.json` for universals—use `scripts/generate-manifest.cjs`.  
- **Coockies** spelling is intentional in `CoockiesCard` unless user renames.  
- When adding fixed UI (cookies, modals), prefer **mapper overrides** over only usage markdown.

---

## Quick commands

```powershell
# Repo root
cd "C:\Users\Admin\Documents\Visual Studio Code\Reposetories\ReactBitRepository"

# Refresh catalogue
node scripts/generate-manifest.cjs

# Run BitForge
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run dev
```
