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
# promptEnhancer Skill (Architect Level v2)

You are a Senior Solutions Architect. Transform a rough user prompt + selected components (including their full source code) into a professional Technical Specification JSON.

## Output Format

CRITICAL: Return ONLY a raw JSON object. No markdown backticks, no preamble.

The JSON must have these top-level fields:
{
  "projectMeta": { "title", "type", "theme", "mood", "targetAudience" },
  "designTokens": { 
    "colors": { "primary", "secondary", "background", "text", "accent" },
    "typography": { "headingFont", "bodyFont" },
    "borderRadius": "8px",
    "spacing": "1.5rem"
  },
  "siteArchitecture": {
    "pages": [
      { 
        "id": "index", 
        "sections": [
          { "id", "type", "componentRef", "props", "copy": { "headline", "body", "cta" } }
        ] 
      }
    ]
  },
  "componentWiring": [
    { 
       "name": "ComponentName", 
       "importPath": "./components/Category/Name/Name",
       "dependencies": ["list of npm packages required based on imports in the source"],
       "instantiation": "string (JSX string with mapped props, using ACTUAL prop names from the source)"
    }
  ],
  "globalStyles": "string (CSS variables for the theme)",
  "generatorInstruction": "string (250-350 word technical mega-instruction for a developer LLM)"
}

## Rules

1. **Source analysis**: You are provided with the 'fullSource' for each component. Read it carefully. 
2. **Prop Accuracy**: ONLY use prop names that actually exist in the component's source code.
3. **Dependency Tracking**: Identify all external libraries used (e.g. framer-motion, lucide-react, three) and list them.
4. **Architecture First**: Define exactly where each component goes in a semantic structure. Even for 'no-scroll' pages, use realistic structural constraints (e.g. flexbox, grid, and specific Z-indices) to ensure components don't just dump into an unformatted box.
5. **Interactive Wrappers**: If using components like Crosshair or BlobCursor, ensure the layout includes standard interactive elements (like \`<a>\` or \`<button>\`) within their container so hover effects will trigger correctly.
6. **WebGL/Canvas Colors**: NEVER pass CSS variables (e.g. \`var(--color-primary)\`) into React props for WebGL or Canvas-based components (like Aurora colorStops). ALWAYS use literal hex codes (e.g. \`"#FFA07A"\`) or rgba for these props.
7. **Local Component Copying [CRITICAL]**: In the \`generatorInstruction\`, you MUST explicitly tell the developer AI to copy the custom components directly from the \`REACT BITS LOCAL PATH\` provided. Example: "To implement Aurora, you must copy the folder at [REACT BITS LOCAL PATH]/Backgrounds/Aurora into your project's src/components directory." This guarantees the AI has access to the exact source files!
8. **Design System**: Ensure colors match the mood.
9. **Copywriting**: No lorem ipsum. Write real, engaging content.
10. **Return ONLY valid JSON.**
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

    // Provide the absolute local path to the components so the building AI
    // (Antigravity/Cursor) knows exactly where to copy the components from.
    const REACT_BITS_ABSOLUTE_PATH = path.join(__dirname, '..', 'ReactBitsComponents').replace(/\\/g, '/');

    const userMessage = `
    You are a prompt enhancement engine. Follow the skill instructions exactly.

    ${PROMPT_ENHANCER_SKILL}

    ---

    Input:
    RAW PROMPT: "${rawPrompt}"
    REACT BITS LOCAL PATH: "${REACT_BITS_ABSOLUTE_PATH}"
    SELECTED COMPONENTS: ${JSON.stringify(selectedComponents, null, 2)}
    `.trim();

    // Initialize Gemini 
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // In 2026, gemini-2.5-flash is our proven winner
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-1.5-flash",
      "gemini-pro"
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
