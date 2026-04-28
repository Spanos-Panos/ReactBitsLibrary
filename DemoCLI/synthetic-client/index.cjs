#!/usr/bin/env node

/**
 * BitForge — Synthetic Client System
 * Generates realistic client briefs for testing the project generation pipeline.
 *
 * Each run produces a per-client folder:
 *   output/YYYY-MM-DD-clientname/
 *     preset.json   ← import directly into BitForge via Preset Manager
 *     brief.md      ← human-readable client profile with reasoning
 *
 * Usage:
 *   node DemoCLI/synthetic-client/index.cjs [options]
 *
 * Run --help for full documentation.
 */

require('dotenv').config();
const fs   = require('fs/promises');
const path = require('path');
const archetypesMod   = require('./archetypes.cjs');
const generator       = require('./generator.cjs');
const localGenerator  = require('./local-generator.cjs');
const formatter       = require('./formatter.cjs');

// ─────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    count: 1,
    archetypeKeyword: null,
    outputDir: path.join(__dirname, 'output'),
    listMode: false,
    previewMode: false,
    helpMode: false,
    localMode: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--count':
        opts.count = Math.max(1, parseInt(args[++i], 10) || 1);
        break;
      case '--archetype':
        opts.archetypeKeyword = args[++i];
        break;
      case '--output':
        opts.outputDir = path.resolve(args[++i]);
        break;
      case '--list':
        opts.listMode = true;
        break;
      case '--preview':
        opts.previewMode = true;
        break;
      case '--local':
        opts.localMode = true;
        break;
      case '--help':
      case '-h':
        opts.helpMode = true;
        break;
    }
  }
  return opts;
}

// ─────────────────────────────────────────────────────────────
// --list mode
// ─────────────────────────────────────────────────────────────

function printList() {
  const { archetypes } = archetypesMod;

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           BitForge — Available Client Archetypes (${archetypes.length})            ║
╚══════════════════════════════════════════════════════════════════╝

  Use --archetype with any keyword from the Name, Aesthetic, Site Type,
  or Industry columns. Partial matches work (e.g. "luxury", "saas", "futur").

  #   Name                  Aesthetic    Site Type   Color Strategy
  ─── ───────────────────── ──────────── ─────────── ───────────────────`);

  archetypes.forEach((a, idx) => {
    const n = String(idx + 1).padStart(2);
    const name = a.name.padEnd(21);
    const aes  = a.aesthetic.padEnd(12);
    const site = a.siteType.padEnd(11);
    const col  = a.colorStrategy;
    console.log(`  ${n}  ${name} ${aes} ${site} ${col}`);
  });

  console.log(`
  To generate a specific archetype:
    node DemoCLI/synthetic-client/index.cjs --archetype luxury
    node DemoCLI/synthetic-client/index.cjs --archetype futuristic
    node DemoCLI/synthetic-client/index.cjs --archetype saas
`);
}

// ─────────────────────────────────────────────────────────────
// --help mode
// ─────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║             BitForge — Synthetic Client Generator                ║
╚══════════════════════════════════════════════════════════════════╝

  WHAT IT DOES
  ────────────
  Generates realistic, opinionated client briefs using Claude AI.
  Each "client" is a fictional brand persona — with a name, industry,
  colors, fonts, and a curated set of ReactBits components that fit
  their aesthetic. The output is ready to load into BitForge.

  WHAT IT DOES NOT DO
  ───────────────────
  It does NOT generate the project. You review the brief, import the
  preset, tweak anything you want, then generate manually in BitForge.

  OUTPUT STRUCTURE
  ────────────────
  Each run creates a folder inside output/:

    output/
      2026-04-26-novabrand/
        preset.json    ← import this into BitForge Preset Manager
        brief.md       ← read this to understand the client

  USAGE
  ─────
  Run from the project root:

    node DemoCLI/synthetic-client/index.cjs [options]

  OPTIONS
  ───────
  (no flags)              Generate 1 random client brief (uses Claude API)
  --local                 Generate without Claude API — free, instant, no API key needed
                          Uses curated data tables + free contact API. Same output format.
  --count N               Generate N clients in one run (sequential)
  --archetype KEYWORD     Pick a specific archetype by keyword
                          (matches name, aesthetic, site type, or industry)
  --list                  Show all 20 available archetypes and exit
  --preview               Print the brief to the terminal — don't write files
                          (useful for a quick look before committing to a file)
  --output DIR            Write output to a custom directory (default: ./output)
  --help, -h              Show this help

  EXAMPLES
  ────────
  # Generate one random client (most common workflow)
  node DemoCLI/synthetic-client/index.cjs

  # Free mode — no API cost, instant, no key needed
  node DemoCLI/synthetic-client/index.cjs --local
  node DemoCLI/synthetic-client/index.cjs --local --archetype luxury
  node DemoCLI/synthetic-client/index.cjs --local --count 5
  node DemoCLI/synthetic-client/index.cjs --local --archetype futuristic --preview

  # Generate 3 clients, each from a different random archetype
  node DemoCLI/synthetic-client/index.cjs --count 3

  # Force a futuristic client (matches: CyberpunkSaaS, RacingStore, IndieGameStudio, ...)
  node DemoCLI/synthetic-client/index.cjs --archetype futuristic

  # Force a luxury/editorial client
  node DemoCLI/synthetic-client/index.cjs --archetype luxury

  # Generate 5 minimal clients (stress-test that aesthetic)
  node DemoCLI/synthetic-client/index.cjs --count 5 --archetype minimal

  # Preview without writing files — good for evaluating output quality
  node DemoCLI/synthetic-client/index.cjs --preview
  node DemoCLI/synthetic-client/index.cjs --archetype brutalist --preview

  # Write to a custom folder
  node DemoCLI/synthetic-client/index.cjs --output ./my-test-briefs

  WORKFLOW
  ────────
  1. Run the generator (any command above)
  2. Open the generated brief.md in any text editor
     → Read the client persona, color choices, font reasoning, component justifications
  3. Open BitForge
  4. Click "Presets" → "Import" → select the preset.json from the client folder
  5. All fields populate: Brief tab, Style tab, Fonts, Colors, Pages, Components
  6. Adjust anything you want (swap a component, tweak the prompt, etc.)
  7. Click Generate → select folder → project is built

  ARCHETYPE KEYWORDS (partial match, case-insensitive)
  ─────────────────────────────────────────────────────
  Aesthetics:   minimal  editorial  brutalist  futuristic
  Site types:   landing  portfolio  saas  agency
  Industries:   luxury  racing  music  fashion  law  coffee  game  finance  fitness
  Names:        LuxuryWatch  RacingStore  CoffeeShop  PunkLabel  DeFiProtocol ...
                (run --list to see all 20)

  REQUIREMENTS
  ────────────
  - ANTHROPIC_API_KEY must be set (in .env or environment)
  - Node.js 18+
  - No additional npm installs required
`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.helpMode) {
    printHelp();
    return;
  }

  if (opts.listMode) {
    printList();
    return;
  }

  // Ensure base output dir exists
  if (!opts.previewMode) {
    await fs.mkdir(opts.outputDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             BitForge — Synthetic Client Generator            ║
╚══════════════════════════════════════════════════════════════╝`);
  console.log(`  Generating ${opts.count} client${opts.count > 1 ? 's' : ''}${opts.archetypeKeyword ? ` (filter: "${opts.archetypeKeyword}")` : ' (random)'}`);
  console.log(`  Mode: ${opts.localMode ? 'local (free, no API)' : 'Claude AI'}`);
  if (!opts.previewMode) {
    console.log(`  Output: ${path.relative(process.cwd(), opts.outputDir) || opts.outputDir}/`);
  } else {
    console.log(`  Preview: no files written`);
  }
  console.log(`  Tip: run --help for full documentation\n`);

  for (let i = 0; i < opts.count; i++) {
    const archetype = opts.archetypeKeyword
      ? archetypesMod.getArchetypeByKeyword(opts.archetypeKeyword)
      : archetypesMod.getRandomArchetype();

    console.log(`[${i + 1}/${opts.count}] ${archetype.name}  (${archetype.aesthetic} × ${archetype.siteType})`);
    if (opts.localMode) {
      console.log(`       Generating (local)...`);
    } else {
      console.log(`       Calling Claude...`);
    }

    try {
      const claudeOutput = opts.localMode
        ? await localGenerator.generateClient(archetype)
        : await generator.generateClient(archetype);
      const preset = formatter.buildPresetJson(claudeOutput, archetype.name);

      if (opts.previewMode) {
        const brief = formatter.buildBriefMd(claudeOutput, archetype.name, dateStr, null);
        console.log('\n' + '─'.repeat(64));
        console.log(brief);
        console.log('─'.repeat(64) + '\n');
      } else {
        // Per-client folder: output/projectname/
        const baseName = preset.projectName;
        let folderName = baseName;

        // Deduplication: if folder exists, append -2, -3 ...
        let dedupCounter = 1;
        while (true) {
          try {
            await fs.access(path.join(opts.outputDir, folderName));
            dedupCounter++;
            folderName = `${baseName}-${dedupCounter}`;
          } catch (_) {
            break;
          }
        }
        // Keep imported preset filename aligned with the final output folder.
        preset.id = folderName;

        const brief = formatter.buildBriefMd(claudeOutput, archetype.name, dateStr, folderName);

        const clientDir  = path.join(opts.outputDir, folderName);
        await fs.mkdir(clientDir, { recursive: true });

        const presetPath = path.join(clientDir, 'preset.json');
        const briefPath  = path.join(clientDir, 'brief.md');

        await fs.writeFile(presetPath, JSON.stringify(preset, null, 2));
        await fs.writeFile(briefPath,  brief);

        const rel = path.relative(process.cwd(), clientDir);
        console.log(`       ✓ ${rel}/`);
        console.log(`           preset.json  ← import into BitForge Preset Manager`);
        console.log(`           brief.md     ← read this to understand the client`);
        console.log(`       Brand: ${preset.clientBrief.brandName}`);
        console.log(`       Components: ${preset.selectedComponentIds.map(id => id.split('/').pop()).join(', ')}`);

        // Drop a readable copy into the BitForge presets folder.
        // The Import button in BitForge opens a file dialog that starts here,
        // so you can pick and load this preset without hunting for the file.
        const PRESETS_DIR = path.join(
          process.env.USERPROFILE || process.env.HOME || '',
          'Documents', '.reactBitsExplorer', 'presets'
        );
        try {
          await fs.mkdir(PRESETS_DIR, { recursive: true });
          const presetId     = `${folderName}-preset`;
          const exportPreset = { ...preset, id: presetId, _outputPath: clientDir };
          const destFile     = path.join(PRESETS_DIR, `${presetId}.json`);
          await fs.writeFile(destFile, JSON.stringify(exportPreset, null, 2));
          console.log(`       → Preset ready: ${path.relative(process.cwd(), destFile)}`);
        } catch (exportErr) {
          console.warn(`       ⚠ Could not write preset: ${exportErr.message}`);
        }
      }

    } catch (err) {
      console.error(`       ✗ Failed: ${err.message}`);
    }

    if (i < opts.count - 1) {
      console.log('');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!opts.previewMode && opts.count > 0) {
    console.log(`\n  All done. Open ${path.relative(process.cwd(), opts.outputDir) || opts.outputDir}/ to find your clients.\n`);
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
