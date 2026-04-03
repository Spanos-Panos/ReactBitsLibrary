const Anthropic = require("@anthropic-ai/sdk");
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
# Senior Project Architect (Claude Haiku 4.5 Edition)

You are a Senior UI Architect and Frontend Lead. Your mission is to transform a raw user request + a set of custom React components (Full Source provided) into a Master Project Brief.

## YOUR CONTEXT
You will be provided with a "componentContext" array. For each component, you have:
1. **Source Code**: The actual .tsx and .css files. Analyze the 'props' interface carefully.
2. **Usage**: A markdown file showing how to implement it.
3. **Install**: The dependencies required.

## OUTPUT FORMAT
Return ONLY a raw JSON object. No preamble, no backticks.

{
  "projectMeta": { "title", "theme", "mood" },
  "designTokens": { "colors": { "primary", "secondary", "background", "text", "accent" }, "typography", "borderRadius" },
  "siteArchitecture": {
    "sections": [
      { "id", "componentRef", "props": { "propName": "Value" }, "content": { "headline", "body", "cta" } }
    ]
  },
  "technicalRequirements": {
    "dependencies": ["List of npm packages needed"],
    "layoutStrategy": "Layout description"
  },
  "generatorSteps": [
    "Step 1: Description",
    "Step 2: Description",
    "CRITICAL: NO MARKDOWN CODE BLOCKS (\\\`\\\`\\\`) OR NEWLINES IN THESE STRINGS."
  ]
}

## CORE RULES
1. **No Code Blocks**: Do NOT use triple backticks ( \\\`\\\`\\\` ) inside the JSON string fields. Explain code in words or simple single-line strings.
2. **Atomic Steps**: Break project instructions into a clear list of 5-10 short strings.
3. **Prop Precision**: Use EXACT prop names from the provided component source code.
`;

// ─── Main export ──────────────────────────────────────────────────────────────

async function enhancePrompt(options) {
  try {
    const { rawPrompt, selectedComponents, systemContext } = options;
    ensureDirsExist();

    const originalPayload = {
      rawPrompt,
      selectedComponents,
      systemContext,
      createdAt: new Date().toISOString(),
    };

    const filename = getTimestampedFilename();
    const originalPath = saveFile(ORIGINAL_DIR, filename, originalPayload);

    // Initialize Anthropic 
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing in .env file.");

    const anthropic = new Anthropic({ apiKey });

    // ─── Model Discovery Loop ──────────────────────────────────────────────
    const candidateModels = [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307"
    ];

    let message = null;
    let successfulModel = "";
    let lastError = null;

    for (const modelId of candidateModels) {
      try {
        console.log(`[Claude Enhancer] Attempting enhancement with: ${modelId}...`);
        message = await anthropic.messages.create({
          model: modelId,
          max_tokens: 4096,
          temperature: 0, // Lower temperature = more stable JSON
          system: PROMPT_ENHANCER_SKILL + "\n\nCRITICAL: Do NOT use markdown code blocks (e.g. ```tsx) inside the JSON string values. Use escaped newlines (\\n) instead. Return ONLY the JSON object.",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `USER PROMPT: "${rawPrompt}"\n\nSYSTEM CONTEXT:\n${JSON.stringify(systemContext, null, 2)}\n\nCOMPONENT CONTEXT:\n${JSON.stringify(selectedComponents, null, 2)}`
                }
              ]
            }
          ]
        });
        successfulModel = modelId;
        break; 
      } catch (e) {
        lastError = e;
        console.warn(`[Claude Enhancer] Model ${modelId} failed: ${e.message}`);
        // If it's a 404, we continue. Otherwise (auth/billing), we stop.
        if (!e.message.toLowerCase().includes("not found") && !e.message.toLowerCase().includes("not_found")) break;
      }
    }

    if (!message) {
      throw new Error(`All Claude models failed. Last error: ${lastError.message}`);
    }

    console.log(`[Claude Enhancer] Successfully used: ${successfulModel}`);
    const responseText = message.content[0].text;
    
    // ─── Robust JSON Extraction ───────────────────────────────────────────
    let enhancedPrompt;
    try {
      // Find the first '{' and the last '}'
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("No JSON object found in response");
      
      const jsonCandidate = responseText.substring(startIdx, endIdx + 1);
      
      // We no longer manually replace newlines here because it can corrupt brackets.
      // We rely on the system prompt to force Claude to escape them correctly.
      enhancedPrompt = JSON.parse(jsonCandidate);
    } catch (parseErr) {
      console.error("[Claude Enhancer] JSON Parse Failed. Raw text was:", responseText);
      throw new Error(`Claude returned invalid JSON: ${parseErr.message}`);
    }

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
    console.error("[Claude Enhancer] Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { enhancePrompt };
