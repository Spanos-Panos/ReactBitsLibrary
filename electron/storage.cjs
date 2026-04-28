const { app, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DOCUMENTS_PATH = app.getPath('documents');
const BASE_FOLDER = path.join(DOCUMENTS_PATH, '.reactBitsExplorer');
const PROMPTS_BASE_PATH = path.join(BASE_FOLDER, 'prompts');
const ORIGINAL_PATH = path.join(PROMPTS_BASE_PATH, 'originalPrompts');
const ENHANCED_PATH = path.join(PROMPTS_BASE_PATH, 'enhancedPrompts');

// Ensure all levels exist
[BASE_FOLDER, PROMPTS_BASE_PATH, ORIGINAL_PATH, ENHANCED_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function openHistoryFolder() {
  shell.openPath(PROMPTS_BASE_PATH);
}

function openPresetsFolder() {
  ensurePresetsDir();
  shell.openPath(PRESETS_DIR);
}

function formatTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  
  return `${day}_${month}_${year}_${hours}-${mins}`;
}

function savePrompt(data) {
  try {
    const filename = `prompt_${formatTimestamp()}.json`;
    const fullPath = path.join(ORIGINAL_PATH, filename);

    const promptData = {
      timestamp: new Date().toISOString(),
      originalPrompt: data.prompt,
      selectedComponents: data.selectedComponents,
      status: 'original'
    };

    fs.writeFileSync(fullPath, JSON.stringify(promptData, null, 2), 'utf-8');
    
    console.log(`[Storage] Saved original prompt to: ${fullPath}`);
    return { success: true, path: fullPath };
  } catch (error) {
    console.error(`[Storage] Failed to save prompt:`, error);
    return { success: false, error: error.message };
  }
}

function getHistory() {
  try {
    if (!fs.existsSync(ORIGINAL_PATH)) return [];
    const files = fs.readdirSync(ORIGINAL_PATH).filter(f => f.endsWith('.json'));
    const history = files.map(f => {
      const content = fs.readFileSync(path.join(ORIGINAL_PATH, f), 'utf-8');
      return { ...JSON.parse(content), id: f };
    });
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error(`[Storage] Failed to load history:`, error);
    return [];
  }
}

function clearHistory() {
  return { success: true };
}

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS_DIR = path.join(BASE_FOLDER, 'presets');

function ensurePresetsDir() {
  if (!fs.existsSync(PRESETS_DIR)) fs.mkdirSync(PRESETS_DIR, { recursive: true });
}

function savePreset(preset) {
  try {
    ensurePresetsDir();
    const filePath = path.join(PRESETS_DIR, `${preset.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf-8');
    console.log(`[Storage] Saved preset: ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('[Storage] Failed to save preset:', error);
    return { success: false, error: error.message };
  }
}

function listPresets() {
  try {
    ensurePresetsDir();
    return fs.readdirSync(PRESETS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, f), 'utf-8')); }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    console.error('[Storage] Failed to list presets:', error);
    return [];
  }
}

// Resolved once so every deletePreset call can use it as a fallback root.
const SYNTH_OUTPUT_ROOT = path.join(__dirname, '..', 'DemoCLI', 'synthetic-client', 'output');

function deletePreset(id) {
  try {
    const filePath = path.join(PRESETS_DIR, `${id}.json`);

    // Read the preset before deleting so we can find the output folder
    let outputPath = null;
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Primary: explicit path stored by the CLI
        if (data._outputPath) {
          outputPath = data._outputPath;
        // Fallback: derive from projectName — covers presets generated before _outputPath was added
        } else if (data.projectName) {
          const candidate = path.join(SYNTH_OUTPUT_ROOT, data.projectName);
          if (fs.existsSync(candidate)) outputPath = candidate;
        }
      } catch {}
    }

    // Delete the preset JSON from the presets folder
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete the output folder (preset.json + brief.md)
    if (outputPath && fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
      console.log(`[Storage] Deleted output folder: ${outputPath}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Storage] Failed to delete preset:', error);
    return { success: false, error: error.message };
  }
}

function importPresetFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const preset = JSON.parse(raw);
    if (!preset.id || !preset.name || !preset.selectedComponentIds) {
      return { error: 'Invalid preset file — missing required fields.' };
    }
    ensurePresetsDir();
    const destPath = path.join(PRESETS_DIR, `${preset.id}.json`);
    let finalPreset = preset;
    if (fs.existsSync(destPath)) {
      finalPreset = { ...preset, id: `${preset.id}-imported` };
    }
    const finalPath = path.join(PRESETS_DIR, `${finalPreset.id}.json`);
    fs.writeFileSync(finalPath, JSON.stringify(finalPreset, null, 2), 'utf-8');
    console.log(`[Storage] Imported preset: ${finalPath}`);
    return { success: true, preset: finalPreset };
  } catch (err) {
    console.error('[Storage] Failed to import preset:', err);
    return { error: err.message };
  }
}

module.exports = { savePrompt, getHistory, clearHistory, openHistoryFolder, openPresetsFolder, savePreset, listPresets, deletePreset, importPresetFromFile };
