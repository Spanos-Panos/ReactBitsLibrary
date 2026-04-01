const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// ─── Path config ──────────────────────────────────────────────────────────────

const DOCUMENTS_PATH = app.getPath('documents');
const BASE_DIR = path.join(DOCUMENTS_PATH, ".reactBitsExplorer", "prompts");

const ORIGINAL_DIR = path.join(BASE_DIR, "originalPrompts");
const ENHANCED_DIR = path.join(BASE_DIR, "enhancedPrompts");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimestampedFilename() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `prompt_${day}_${month}_${year}_${hours}_${minutes}.json`;
}

function ensureDirsExist() {
  [BASE_DIR, ORIGINAL_DIR, ENHANCED_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function saveFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
  return filePath;
}

// ─── Skill content ────────────────────────────────────────────────────────────

const PROMPT_ENHANCER_SKILL = `
# promptEnhancer Skill

Transforms a rough user prompt + selected component metadata into a maximally detailed,
structured JSON prompt ready to be sent to a project-generator LLM.

## Output Format

CRITICAL: Return ONLY a raw JSON object. No explanation, no markdown fences, no preamble.

The JSON must have these top-level fields:
{
  "projectMeta": { "title", "type", "theme", "mood", "targetAudience" },
  "layout": { "sections": [ { "id", "label", "description", "componentRef" } ] },
  "componentUsage": [ { "componentName", "category", "assignedTo", "role", "usageSnippet", "wrapperNotes" } ],
  "styleGuide": { "colorPalette": string[], "typography": { "headingFont", "bodyFont" }, "borderRadius", "spacing" },
  "interactions": string[],
  "copyContent": { "headline", "subheadline", "ctaText", "supportingCopy": string[] },
  "techNotes": { "stack": "React + TypeScript", "componentImports": string[], "installationNotes", "specialInstructions" },
  "generatorInstruction": string 
}

## Rules

1. Infer & expand the project vision — infer type, audience, mood; never leave sections vague
2. background → hero section / text-animation → heading / animation → staggered elements
3. Extract exact usage snippets from usageMarkdown (import + JSX)
4. Generate coherent copy that matches the mood
5. Style guide must be consistent with the theme
6. generatorInstruction must be a self-contained 150-250 word mega-instruction paragraph.
7. Return ONLY valid JSON.
`;

// ─── Main export ──────────────────────────────────────────────────────────────

async function enhancePrompt(options) {
  try {
    const { rawPrompt, selectedComponents } = options;

    ensureDirsExist();

    const originalPayload = {
      rawPrompt,
      selectedComponents,
      createdAt: new Date().toISOString(),
    };

    const filename = getTimestampedFilename();
    const originalPath = saveFile(ORIGINAL_DIR, filename, originalPayload);

    const userMessage = `
    You are a prompt enhancement engine. Follow the skill instructions exactly.

    ${PROMPT_ENHANCER_SKILL}

    ---

    Input:
    RAW PROMPT: "${rawPrompt}"
    SELECTED COMPONENTS: ${JSON.stringify(selectedComponents, null, 2)}
    `.trim();

    // Initialize Gemini 
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // In 2026, gemini-2.0-flash is our proven winner
    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash",
      "gemini-1.5-pro"
    ];

    let lastError = null;
    let enhancedPrompt = null;
    let successfulModel = "";

    for (const modelName of candidateModels) {
      try {
        console.log(`[Gemini Enhancer] Attempting enhancement with: ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(userMessage);
        const responseText = result.response.text();

        // Clean markdown backticks if present
        const cleanedText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
        enhancedPrompt = JSON.parse(cleanedText);

        successfulModel = modelName;
        break; // Success!
      } catch (e) {
        lastError = e;
        console.warn(`[Gemini Enhancer] Model ${modelName} failed or not available: ${e.message}`);
        // Continue to next model
      }
    }

    if (!enhancedPrompt) {
      console.error("[Gemini Enhancer] All candidate models failed.", lastError);
      throw new Error(`Failed to find an available Gemini model. Last error: ${lastError.message}`);
    }

    console.log(`[Gemini Enhancer] Successfully used: ${successfulModel}`);
    const enhancedPath = saveFile(ENHANCED_DIR, filename, enhancedPrompt);

    return {
      success: true,
      enhancedPrompt,
      savedPaths: {
        original: originalPath,
        enhanced: enhancedPath,
      },
    };
  } catch (error) {
    console.error("[Gemini Enhancer] Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { enhancePrompt };
