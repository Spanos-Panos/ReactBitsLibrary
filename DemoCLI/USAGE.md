# DemoCLI — Tools & Usage Guide

This folder contains the CLI tools that support BitForge's project generation pipeline.

---

## 1 — Synthetic Client Generator

**Path:** `DemoCLI/synthetic-client/`  
**Purpose:** Generates realistic fictional client briefs using Claude AI. Each brief includes a brand persona, color palette, fonts, component selection, and a project prompt — all ready to import into BitForge.

### Quick Start

Run from the project root:

```bash
# Generate one random client
node DemoCLI/synthetic-client/index.cjs

# Generate a specific type of client
node DemoCLI/synthetic-client/index.cjs --archetype luxury
node DemoCLI/synthetic-client/index.cjs --archetype futuristic
node DemoCLI/synthetic-client/index.cjs --archetype minimal

# Generate multiple clients at once
node DemoCLI/synthetic-client/index.cjs --count 3

# Preview output in terminal without writing files
node DemoCLI/synthetic-client/index.cjs --preview

# See all 20 available archetypes
node DemoCLI/synthetic-client/index.cjs --list

# Full documentation
node DemoCLI/synthetic-client/index.cjs --help
```

### All Options

| Flag | Description |
|---|---|
| *(no flags)* | Generate 1 random client |
| `--count N` | Generate N clients sequentially |
| `--archetype KEYWORD` | Pick archetype by keyword (partial match, case-insensitive) |
| `--list` | Show all 20 archetypes and exit |
| `--preview` | Print brief to terminal, don't write files |
| `--output DIR` | Write to a custom directory (default: `DemoCLI/synthetic-client/output/`) |
| `--help` | Show full documentation |

### Archetype Keywords

Search by any part of the name, aesthetic, site type, or industry:

- **Aesthetics:** `minimal` · `editorial` · `brutalist` · `futuristic`
- **Site types:** `landing` · `portfolio` · `saas` · `agency`
- **Industries:** `luxury` · `racing` · `music` · `fashion` · `law` · `coffee` · `game` · `finance` · `fitness`

### Output Structure

Each run creates a folder inside `DemoCLI/synthetic-client/output/`:

```
output/
  voidstudio/
    preset.json    ← import this into BitForge via Presets → Import
    brief.md       ← human-readable client profile with reasoning
  novabrand/
    preset.json
    brief.md
```

### Workflow: Generator → BitForge

1. Run the generator (any command above)
2. Open `brief.md` to read the client persona, color choices, font reasoning, component justifications
3. Open BitForge
4. Click **Presets** in the top bar → **Import**
5. Navigate to the client folder (e.g. `DemoCLI/synthetic-client/output/voidstudio/`)
6. Select **`preset.json`** — all fields populate automatically:
   - Brief tab: brand name, tagline, description, services, CTA
   - Style tab: aesthetic, color mode, typography intensity
   - Design tab: fonts and color palette
   - Pages tab: page structure based on site type
   - Component chips: selected components appear in the builder
7. Review and adjust anything, then click **Generate**

### Requirements

- `ANTHROPIC_API_KEY` must be set in `.env` or environment
- Node.js 18+

---

## 2 — Project Generators

**Path:** `DemoCLI/generators/`  
**Purpose:** These are the modules that BitForge's AI pipeline uses to build generated projects. They are called automatically during generation — you don't run them directly.

| File | What It Does |
|---|---|
| `vite-react.cjs` | Main entry point — builds the full CLAUDE.md instruction file for Claude Code |
| `app-builder.cjs` | Generates the `App.tsx` scaffold structure |
| `style-builder.cjs` | Builds `index.css` with aesthetic-driven CSS tokens and rules |
| `content-builder.cjs` | Generates copy and content blocks for each page section |
| `page-builder.cjs` | Assembles per-page layout specs from component selections |
| `component-mapper.cjs` | Maps selected component IDs to import paths and usage patterns |
| `scaffolder.cjs` | Handles project file scaffold (package.json, vite.config, tsconfig) |
| `structure-generator.cjs` | Determines overall page/section structure from design brief |

---

## 3 — DemoCLI Root Files

| File | Purpose |
|---|---|
| `index.cjs` | Main entry point (referenced from package.json scripts) |
| `index.ts` | TypeScript type declarations for the CLI |

---

## Notes

- The `output/` folder is git-ignored — generated client briefs stay local.
- Generated test projects (any `test-*/` folder at the root) are also git-ignored.
- `.env` is git-ignored. Never commit your `ANTHROPIC_API_KEY`.
