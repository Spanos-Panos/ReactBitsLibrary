# DemoCLI — Tools & Usage Guide

This folder contains the CLI tools that support BitForge's project generation pipeline.

---

## 1 — Synthetic Client Generator

**Path:** `DemoCLI/synthetic-client/`  
**Purpose:** Generates realistic fictional client briefs using Claude AI. Each brief includes a brand persona, color palette, fonts, component selection, and a project prompt — all ready to import into BitForge.

### Quick Start

Run from the project root:

```bash
# Generate one random client (uses Claude API — requires ANTHROPIC_API_KEY)
node DemoCLI/synthetic-client/index.cjs

# Free mode — no API, no key, instant
node DemoCLI/synthetic-client/index.cjs --local
node DemoCLI/synthetic-client/index.cjs --local --archetype luxury
node DemoCLI/synthetic-client/index.cjs --local --count 3
node DemoCLI/synthetic-client/index.cjs --local --count 10 --seed test-batch-a --quality high

# Generate a specific type of client (Claude mode)
node DemoCLI/synthetic-client/index.cjs --archetype luxury
node DemoCLI/synthetic-client/index.cjs --archetype futuristic
node DemoCLI/synthetic-client/index.cjs --archetype minimal

# Generate multiple clients at once
node DemoCLI/synthetic-client/index.cjs --count 3

# Preview output in terminal without writing files
node DemoCLI/synthetic-client/index.cjs --preview

# See all 20 available archetypes
node DemoCLI/synthetic-client/index.cjs --list

# Brief / style / pages only — omit component IDs from preset.json (pick components in BitForge)
node DemoCLI/synthetic-client/index.cjs --local --manual-components
node DemoCLI/synthetic-client/index.cjs --local --archetype luxury --manual-components --preview
# Alias: --no-preset-components

# Full documentation
node DemoCLI/synthetic-client/index.cjs --help
```

### All Options

| Flag                  | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| *(no flags)*          | Generate 1 random client (Claude API)                                       |
| `--local`             | Generate free, instant, offline-capable (no API key needed)                 |
| `--count N`           | Generate N clients sequentially                                             |
| `--seed VALUE`        | Deterministic seed for reproducible multi-run datasets                      |
| `--quality LEVEL`     | Local generation richness profile: `low`, `medium`, `high` (default: high)  |
| `--archetype KEYWORD` | Pick archetype by keyword (partial match, case-insensitive)                 |
| `--list`              | Show all 20 archetypes and exit                                             |
| `--preview`           | Print brief to terminal, don't write files                                  |
| `--output DIR`        | Write to a custom directory (default: `DemoCLI/synthetic-client/output/`)   |
| `--manual-components` | Omit `selectedComponentIds` and per-page `componentIds` from `preset.json` and align `brief.md` — import brief/style/pages only; choose components in BitForge |
| `--no-preset-components` | Same as `--manual-components`                                          |
| `--help`              | Show full documentation                                                     |

### Claude vs Local Mode

|               | Claude mode                          | `--local` mode                        |
|---------------|--------------------------------------|---------------------------------------|
| Cost          | ~$0.002 per client                   | Free                                  |
| Speed         | 10–20 seconds                        | Instant                               |
| API key       | Required                             | Not needed                            |
| Variety       | High (AI improvises + normalization) | High (seeded + curated realism pools) |
| Output format | Same `preset.json` + `brief.md`      | Identical                             |

### Manual component selection

With **`--manual-components`** (or **`--no-preset-components`**), the generator still produces a full internal component set for validation, but the **exported** `preset.json` clears global and per-page component IDs, and `brief.md` documents that components are intentionally omitted. Import the preset for the client brief, style direction, design rules, and page shell, then select ReactBits components yourself before **Generate**.

In BitForge **Presets → Load**, you can also check **Keep my current component selection** so a preset updates brief/style without replacing your sidebar picks (page assignments are filtered to your existing selection).

### Testing-Focused Commands

```bash
# Reproducible local dataset
node DemoCLI/synthetic-client/index.cjs --local --count 3 --quality high --no-preset-components

# Same seed, different archetype filter
node DemoCLI/synthetic-client/index.cjs --local --count 10 --seed qa-round-01 --archetype futuristic

# Quick lower-richness stress pass
node DemoCLI/synthetic-client/index.cjs --local --count 30 --seed stress-low --quality low

# Brief-only presets (no component IDs in export)
node DemoCLI/synthetic-client/index.cjs --local --count 5 --seed brief-only --manual-components
```

Each run now prints a summary with:
- success / failed count
- unique component count
- category spread
- page types seen

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
   - Component chips: selected components appear in the builder (or empty if you used `--manual-components`)
7. Review and adjust anything, then click **Generate** (at least one component is required for an AI build)

### Requirements

- `ANTHROPIC_API_KEY` must be set in `.env` or environment
- Node.js 18+

---

## 2 — Project Generators

**Path:** `DemoCLI/generators/`  
**Purpose:** These are the modules that BitForge's AI pipeline uses to build generated projects. They are called automatically during generation — you don't run them directly.

| File                      | What It Does                                                                  |
|---------------------------|-------------------------------------------------------------------------------|
| `vite-react.cjs`          | Main entry point — builds the full CLAUDE.md instruction file for Claude Code |
| `app-builder.cjs`         | Generates the `App.tsx` scaffold structure                                    |
| `style-builder.cjs`       | Builds `index.css` with aesthetic-driven CSS tokens and rules                 |
| `content-builder.cjs`     | Generates copy and content blocks for each page section                       |
| `page-builder.cjs`        | Assembles per-page layout specs from component selections                     |
| `component-mapper.cjs`    | Maps selected component IDs to import paths and usage patterns                |
| `scaffolder.cjs`          | Handles project file scaffold (package.json, vite.config, tsconfig)           |
| `structure-generator.cjs` | Determines overall page/section structure from design brief                   |

---

## 3 — DemoCLI Root Files

| File        | Purpose                                                 |
|-------------|---------------------------------------------------------|
| `index.cjs` | Main entry point (referenced from package.json scripts) |
| `index.ts`  | TypeScript type declarations for the CLI                |

---

## Notes

- The `output/` folder is git-ignored — generated client briefs stay local.
- Generated test projects (any `test-*/` folder at the root) are also git-ignored.
- `.env` is git-ignored. Never commit your `ANTHROPIC_API_KEY`.
