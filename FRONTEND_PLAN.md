# BitForge — Frontend UI/UX Redesign Plan

---

## Table of Contents

**Design System**
- [Overview](#overview)
- [Confirmed Decisions](#confirmed-decisions)
- [Design Direction — Liquid Glass](#design-direction--liquid-glass)
- [Typography](#typography)
- [Color Palette Rules](#color-palette-rules)
- [Animation Rules](#animation-rules)
- [Spacing System](#spacing-system)
- [Border Radius Scale](#border-radius-scale)
- [Responsive Breakpoints](#responsive-breakpoints)

**Redesign Scope**
- [Pages & Views — Redesign Order](#pages--views--redesign-order)
- [What to Keep](#what-to-keep)
- [What to Change](#what-to-change)

**UI Inventory**
- [Element Status Summary](#element-status-summary)
- [1. Loading Screen](#1-loading-screen)
- [2. Background](#2-background)
- [3. App Title / Header](#3-app-title--header)
- [4. Category Navigation](#4-category-navigation-pillnav)
- [5. Component List Pane](#5-component-list-pane-sidebar)
- [6. Component Inspector](#6-component-inspector-right-panel)
- [7. Preset Manager](#7-preset-manager)
- [8. Project Builder Panel](#8-project-builder-panel)
- [9. Generate Wizard](#9-generate-wizard)
- [10. Task Bar](#10-task-bar)
- [11. Task Overlay](#11-task-overlay)
- [12. Add Component Modal](#12-add-component-modal)
- [13. Layout Concept Picker](#13-layout-concept-picker)
- [14. Status Toast](#14-status-toast)

---

## Overview

Full visual overhaul of the **BitForge** desktop (Electron + React) app.
Target: clean, minimal, premium design system — responsive down to tablet/mobile widths, consistent across every page/view. Dark-only. No feature changes, purely visual.

---

## Confirmed Decisions

| Decision | Answer |
|----------|--------|
| App name | **BitForge** |
| Design direction | Liquid Glass / Tech dark (Option B) |
| Theme | Dark only |
| Font — display | **Clash Display** (Fontshare, free) |
| Font — body | **Satoshi** (Fontshare, free) |
| Font — mono | **JetBrains Mono** |
| Accent color | TBD — indigo `#6366f1` placeholder |

---

## Design Direction — Liquid Glass

**Feel:** futuristic, layered, sharp. Frosted glass panels float over a deep dark background.

| Token | Value |
|-------|-------|
| Base background | `#090c14` |
| Surface low | `rgba(255,255,255,0.04)` |
| Surface high | `rgba(255,255,255,0.08)` |
| Border subtle | `rgba(255,255,255,0.08)` |
| Border visible | `rgba(255,255,255,0.14)` |
| Accent primary | `#6366f1` (indigo — TBD) |
| Accent glow | `rgba(99,102,241,0.25)` |
| Text primary | `#f1f5f9` |
| Text muted | `#64748b` |

**Rules:**
- Panels: `backdrop-filter: blur(16–24px)` + subtle border
- Hover: border brightens, background very slightly lightens — no hard transforms
- Active / selected: accent-colored left border strip or soft glow
- Animations: only `opacity` + `transform`, never layout properties
- Gradients: backgrounds and accent highlights only — never on body text

---

## Typography

### Readability Standards

| Category | Rule |
|----------|------|
| Quantity | 1–3 font families max |
| Body size | 16px minimum (use `rem`) |
| Line height | ~1.5× body, ~1.2× headings |
| Line length | 45–80 characters (66 ideal) |
| Alignment | Left-aligned |
| Contrast | 4.5:1 minimum (WCAG AA) |
| Links | Prefer buttons over inline text links |

### Font Stack — Confirmed

| Role | Font | Used for |
|------|------|----------|
| **Display** | `Clash Display` | Logo, page titles, large headings — max 3 uses |
| **Body** | `Satoshi` | All UI labels, inputs, descriptions, tabs, body text |
| **Mono** | `JetBrains Mono` | Code viewer, terminal output, install commands |

```css
/* globals.css — already imported */
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
```

```css
/* tokens.css — already set */
--font-display: 'Clash Display', sans-serif;
--font-body:    'Satoshi', sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

```css
--text-xs:   0.75rem;    /* 12px — captions, badges          */
--text-sm:   0.875rem;   /* 14px — secondary labels          */
--text-base: 1rem;       /* 16px — body, inputs, list items  */
--text-lg:   1.125rem;   /* 18px — subheadings               */
--text-xl:   1.25rem;    /* 20px — section titles            */
--text-2xl:  1.5rem;     /* 24px — page titles               */
--text-3xl:  1.875rem;   /* 30px — hero / display            */
```

- Letter-spacing: `-0.02em` display headings · `0.04em` uppercase labels
- Min rendered size: `12px` — never go below

---

## Color Palette Rules

- One accent color with two derived tints: `--accent`, `--accent-muted`, `--accent-glow`
- Semantic aliases required: `--color-success`, `--color-warning`, `--color-error`
- **No inline hex values in component files** — all values via `tokens.css`
- Dark mode first; light mode is a stretch goal, not in scope

---

## Animation Rules

**Animatable properties only:** `opacity` · `transform` · `background-color` · `border-color` · `box-shadow`

**Never animate:** `width` · `height` · `top` · `left` · `margin` · `padding` — causes layout reflow

```css
--duration-fast:   100ms;   /* micro: button press          */
--duration-normal: 200ms;   /* hover states, tab switch     */
--duration-slow:   350ms;   /* panel slide-in, modal open   */
--duration-xslow:  600ms;   /* page transitions, entrances  */
```

- Exit easing: `cubic-bezier(0.23, 1, 0.32, 1)`
- Entrance easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Wrap all non-essential animations in `@media (prefers-reduced-motion: reduce)`

---

## Spacing System

All spacing is multiples of a `4px` base unit.

```css
--space-1:  0.25rem;   /*  4px */
--space-2:  0.5rem;    /*  8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

---

## Border Radius Scale

```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  24px;
--radius-full: 9999px;
```

---

## Responsive Breakpoints

Electron renders a webpage — layout must degrade gracefully at smaller window sizes and on mobile.

```css
--bp-sm:  480px;    /* small phone            */
--bp-md:  768px;    /* tablet / compact win   */
--bp-lg:  1024px;   /* standard desktop       */
--bp-xl:  1280px;   /* wide desktop           */
```

| Breakpoint | Layout behaviour |
|------------|-----------------|
| `< 768px` | Single column — sidebar hidden behind hamburger |
| `768–1024px` | Sidebar collapsible, inspector fills remaining width |
| `> 1024px` | Full split-view (current default) |

---

## Pages & Views — Redesign Order

| # | View | Status |
|---|------|--------|
| 1 | Loading Screen | ✅ Done |
| 2 | Main Layout shell (background, header, container) | 🔲 Next |
| 3 | Category Navigation (PillNav) | 🔲 |
| 4 | Component List Pane (sidebar) | 🔲 |
| 5 | Component Inspector (right panel) | 🔲 |
| 6 | Generate Wizard (modal) | 🔲 |
| 7 | Task Bar + Task Overlay | 🔲 |
| 8 | Project Builder Panel | 🔲 |
| 9 | Add Component Modal | 🔲 |
| 10 | Layout Concept Picker | 🔲 |
| 11 | Status Toast | 🔲 |

---

## What to Keep

- Split-view layout (sidebar left, inspector right)
- Task bar at the bottom
- Tab navigation pattern inside the inspector
- All IPC and functionality — this is purely visual

## What to Change

- Every hardcoded color, font-size, spacing → `tokens.css`
- Replace `Archivo Black` with Clash Display + Satoshi
- Background: replace Iridescence shader with a cleaner dark base
- All `box-shadow` values → token-based
- Remove all legacy Chat UI CSS (already unused code)

---

---

## UI Element Inventory

Complete map of every element in the app — what it is, where it lives, what it does, and its redesign status.

---

## Element Status Summary

| # | Element | File | Status |
|---|---------|------|--------|
| 1 | Loading Screen | `views/LoadingScreen.tsx` | ✅ Done |
| 2 | Background | `components/Backgrounds/Iridescence/` | 🔄 Redesign |
| 3 | App Title / Header | `App.tsx` | 🔄 Redesign |
| 4 | Category Nav (PillNav) | `components/Components/PillNav/` | 🔄 Redesign |
| 5 | Component List Pane | `views/ComponentListPane.tsx` | 🔄 Redesign |
| 6 | Component Inspector | `views/ComponentInspector.tsx` | 🔄 Redesign |
| 7 | Preset Manager | `components/PresetManager.tsx` | 🔄 Redesign |
| 8 | Project Builder Panel | `components/ProjectBuilderPanel.tsx` | 🔄 Redesign |
| 9 | Generate Wizard | `views/GenerateWizard.tsx` | 🔄 Redesign |
| 10 | Task Bar | `views/TaskBar.tsx` | 🔄 Redesign |
| 11 | Task Overlay | `views/TaskOverlay.tsx` | 🔄 Redesign |
| 12 | Add Component Modal | `components/AddComponentModal.tsx` | 🔄 Redesign |
| 13 | Layout Concept Picker | `components/LayoutConceptPicker.tsx` | 🔄 Redesign |
| 14 | Status Toast | `App.tsx` | 🔄 Redesign |

---

### 1. Loading Screen
**File:** `src/views/LoadingScreen.tsx`
**Visible:** Cold open, before main app renders
**What it does:** Full-screen dark overlay (`#111418`) with the MetallicPaint React logo + "BitForge" title (Clash Display) stacked and centered. Both elements animate in with a fade-up on mount. Auto-dismisses after 3.5s with a 700ms fade-out. Main app stays `visibility: hidden` until done.
**Status:** ✅ Done

---

### 2. Background
**File:** `src/components/Backgrounds/Iridescence/Iridescence.tsx`
**Location:** `App.tsx` → `.background-container` — fixed, full-screen, `z-index: 0`
**What it does:** WebGL iridescent animated shader filling the entire app background. Low-power mode hides it.
**Current props:** `color=[0,0.7,0.7]` · `mouseReact={false}` · `amplitude={0.1}` · `speed={0.3}`
**Status:** 🔄 Will be restyled / replaced in main layout redesign

---

### 3. App Title / Header
**File:** `App.tsx` → `.filter-bar`
**What it does:** Animated gradient "ReactBits Explorer" text via the `GradientText` component. Sits above the category nav.
**Status:** 🔄 Rename to "BitForge", restyle — part of main layout redesign

---

### 4. Category Navigation (PillNav)
**File:** `src/components/Components/PillNav/PillNav.tsx`
**Location:** Top of main content, centered
**What it does:** Pill-shaped tab bar — 4 items that set `activeCategory` and filter the component list.
**Items:** Components · Animations · Text Animations · Backgrounds
**Status:** 🔄 Needs visual redesign (font, sizing, colors)

---

### 5. Component List Pane (Sidebar)
**File:** `src/views/ComponentListPane.tsx`
**Location:** Left column of the split-view

| Sub-element | What it does |
|-------------|-------------|
| **Search bar** | Real-time name filter. Magnifier icon left, `×` clear button appears on input. |
| **Add button (+)** | `30×30px` button next to search. Opens Add Component modal. |
| **Component list** | Scrollable list filtered by category + search. |
| **Row — hover** | Highlights row, shows name in inspector placeholder. |
| **Row — active** | Distinct style for selected component. |
| **Row — checkbox** | Adds component to `selectedIds` for Project Builder. Per-category limits apply (max 1 Background, max 5 Components, etc.). |
| **Row — arrow** | `→` right-side indicator. |
| **Empty state** | Shown when search or category returns nothing. |

**Status:** 🔄 Full visual redesign needed

---

### 6. Component Inspector (Right Panel)
**File:** `src/views/ComponentInspector.tsx`
**Location:** Right column of the split-view

**Placeholder state** (nothing selected):
- "Select a component" heading
- Decorative mock tabs (React / CSS / Tailwind)
- Hover hint: "Click to view code and information"

**Active state** (component selected):

| Sub-element | What it does |
|-------------|-------------|
| **Component name** | H3 heading |
| **Category label** | `// Category` comment-style subtitle |
| **Primary tabs** | Code · Docs · Install |
| **Code → file tabs** | One tab per source file (e.g. `Ripple.tsx`, `Ripple.css`) |
| **Docs → sub-tabs** | `usage.md` · `install.md` |
| **Install → CLI / Manual** | Switches install instruction type |
| **Install → PM tabs** | pnpm · npm · yarn · bun |
| **Code viewer** | Raw `<pre>` source block — no syntax highlighting yet |
| **Generate button** | Primary CTA — opens Generate Wizard |
| **Copy Code button** | Copies current view to clipboard, briefly shows "Copied!" |

**Status:** 🔄 Full visual redesign needed

---

### 7. Preset Manager
**File:** `src/components/PresetManager.tsx`
**Location:** Above Project Builder Panel (top-right of split-view area)
**What it does:** Saves and loads complete "setups" — prompt, selected component IDs, design rules, layout concept, project name, package manager. Stored on disk via IPC.

| Sub-element | What it does |
|-------------|-------------|
| **Trigger button** | Opens / closes the dropdown panel |
| **Name input** | Labels the preset before saving |
| **Save button** | Persists to disk with a timestamp ID |
| **Preset list** | All saved presets with name + date |
| **Load button** | Restores a preset — overwrites current state |
| **Delete button** | Removes preset from disk |

**Status:** 🔄 Needs visual redesign

---

### 8. Project Builder Panel
**File:** `src/components/ProjectBuilderPanel.tsx`
**Location:** Below the split-view, full width
**What it does:** The AI project generation workspace — describe what to build, configure design rules, pick a layout, launch the AI flow.

| Sub-element | What it does |
|-------------|-------------|
| **Selected components summary** | Grouped by category, collapsible rows showing count + names |
| **Prompt textarea** | Free-text project description |
| **Enhance Prompt button** | Sends prompt + components + rules to Anthropic API via IPC, returns a structured prompt |
| **Design Rules panel** | Expandable — font entries (value + role), color entries, responsive strategy, max-width |
| **Layout Concept button** | Opens Layout Concept Picker modal |
| **History view** | Past generations — each can be restored (repopulates prompt + selections) |
| **Generate button** | Fires `handleBuilderGenerate` → AI enhance → Generate Wizard |

**Status:** 🔄 Needs visual redesign

---

### 9. Generate Wizard
**File:** `src/views/GenerateWizard.tsx`
**Trigger:** "Generate Project" in Inspector, or Generate in Builder
**What it does:** Modal to configure and launch a project generation task.

| Sub-element | What it does |
|-------------|-------------|
| **Window controls** | Decorative macOS-style red/yellow/green dots |
| **Title** | "Generate Demo Project" or "Generate AI Master Project" |
| **Subtitle** | Shows the component or AI project name |
| **Project Name input** | Output folder name |
| **Save To path** | Read-only path + Browse button (native folder picker via IPC) |
| **Install method tabs** | CLI / Manual |
| **Package manager tabs** | pnpm · npm · yarn · bun |
| **Open in VS Code** | Auto-opens project in VS Code on completion |
| **Run dev server** | Runs `npm run dev` after generation |
| **Auto-kill on error** | Visible only when "Run dev server" is on — kills process on browser error |
| **Cancel / Start Generation** | Start disabled until name + path are both filled |

**Status:** 🔄 Needs visual redesign

---

### 10. Task Bar
**File:** `src/views/TaskBar.tsx`
**Location:** Fixed bottom bar — hidden when no tasks exist
**What it does:** Live task tray showing all running/completed generation jobs. Max 5 concurrent tasks.

| Sub-element | What it does |
|-------------|-------------|
| **"Active Tasks:" label** | Static left label |
| **Task item** | Status dot + component name + project name. Click opens Task Overlay. |
| **Status dot** | Pulses for `running`, solid for `success` / `error` |
| **Close (×)** | Terminates IPC process + removes task |
| **CLEAR ALL** | Terminates all tasks, empties bar |

**Status:** 🔄 Needs visual redesign

---

### 11. Task Overlay
**File:** `src/views/TaskOverlay.tsx`
**Trigger:** Clicking a task item in the Task Bar
**What it does:** Full-screen modal with live build output for the selected task.

| Sub-element | What it does |
|-------------|-------------|
| **Spinner** | Animated — shown only while `status === 'running'` |
| **Status heading** | "Generating Project..." or "Generation Result" |
| **Progress text** | Latest IPC progress message |
| **Terminal header** | Window control dots + task name + Hide button |
| **Terminal body** | Scrollable `<pre>` of all log lines — auto-scrolls as new lines arrive |
| **Close Overlay button** | Appears when task is done — dismisses overlay, task stays in bar |

**Status:** 🔄 Needs visual redesign

---

### 12. Add Component Modal
**File:** `src/components/AddComponentModal.tsx`
**Trigger:** `+` button in the Component List Pane
**What it does:** Form to add a new custom component — writes files to disk, updates the manifest.

| Sub-element | What it does |
|-------------|-------------|
| **Name input** | Becomes the folder + file name on disk |
| **Category selector** | Components / Animations / Backgrounds / TextAnimations |
| **Language selector** | TS+CSS · TS+Tailwind · JS+CSS · JS+Tailwind |
| **Code textarea** | Component source (`.tsx` / `.jsx`) |
| **CSS textarea** | Optional stylesheet |
| **Install commands** | CLI + manual per package manager |
| **Usage markdown** | Documentation textarea |
| **Submit / Cancel** | Submit → IPC `addComponent` → write files → update manifest → `onAdded` callback |

**Status:** 🔄 Needs visual redesign

---

### 13. Layout Concept Picker
**File:** `src/components/LayoutConceptPicker.tsx`
**Trigger:** "Layout Concept" button in Project Builder Panel
**What it does:** Modal showing AI-generated layout zone diagrams. Selecting one attaches a layout markdown to the generation prompt.

| Sub-element | What it does |
|-------------|-------------|
| **Concept cards** | Zone diagrams color-coded by role (hero / nav / content / footer / etc.) |
| **Select + Confirm** | Sets `layoutConcept` state in App |
| **Close** | Dismisses without changing current concept |

**Status:** 🔄 Needs visual redesign

---

### 14. Status Toast
**Location:** `App.tsx` — fixed position overlay
**What it does:** Temporary notification, auto-dismisses. Three variants: `info` · `warning` · `success`.
Used for: task limit warnings, preset confirmations, generation errors, component-added confirmations.
**Status:** 🔄 Needs visual redesign
