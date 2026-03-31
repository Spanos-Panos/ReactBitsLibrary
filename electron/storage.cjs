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

module.exports = { savePrompt, getHistory, clearHistory, openHistoryFolder };
