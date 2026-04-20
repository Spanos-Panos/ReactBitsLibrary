/**
 * polishPass.cjs
 *
 * Post-generation style fidelity pass:
 * 1. Captures a full-page screenshot via screenshotCapture.cjs (build + Playwright)
 * 2. Sends screenshot + style brief to Claude vision
 * 3. Applies CSS patches to src/index.css if score < 7
 */

const path = require('path');
const fs   = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const { captureAndSave } = require('./screenshotCapture.cjs');

const client = new Anthropic();

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}   opts.projectPath    - absolute path to generated project
 * @param {object}   opts.enhancedPrompt - AI brief (projectMeta, designTokens, etc.)
 * @param {string[]} opts.aesthetics     - e.g. ['brutalist']
 * @param {function} opts.onLog         - progress logger
 */
async function runPolishPass({ projectPath, enhancedPrompt, aesthetics, onLog }) {
  const log = (msg) => { if (onLog) onLog(msg); };

  // Guard: playwright optional dependency
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    log('[Polish] Playwright not installed — skipping polish pass. Run: npm i -D playwright && npx playwright install chromium');
    return;
  }

  // 1 + 2 + 3. Build, start preview, take screenshot — delegated to screenshotCapture.cjs
  log('[Polish] Capturing screenshot (build + preview + headless)...');
  const captureResult = await captureAndSave(projectPath, log);

  if (!captureResult.success) {
    log(`[Polish] Screenshot failed: ${captureResult.error} — skipping vision analysis`);
    return;
  }

  const screenshotBuffer = fs.readFileSync(captureResult.screenshotPath);
  let screenshotB64 = screenshotBuffer.toString('base64');
  log('[Polish] Screenshot ready for vision analysis.');

  if (!screenshotB64) return;

  // 4. Send to Claude vision
  log('[Polish] Analyzing style fidelity with Claude vision...');
  const aestheticDesc = aesthetics.length ? aesthetics.join(', ') : (enhancedPrompt?.projectMeta?.mood || 'modern');
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: screenshotB64 },
          },
          {
            type: 'text',
            text: `This is a generated website. The intended aesthetic is: ${aestheticDesc}.
Design brief title: ${enhancedPrompt?.projectMeta?.title || 'Unknown'}, mood: ${enhancedPrompt?.projectMeta?.mood || 'Unknown'}.

Rate style fidelity 1–10. List 3–5 specific CSS improvements that would increase fidelity.
Focus on: typography weight/size, color contrast, spacing density, border usage, overall aesthetic commitment.

Respond ONLY with valid JSON in this exact format (no preamble, no markdown):
{"score":7,"changes":[{"selector":"h1","property":"font-weight","value":"800","reason":"Brutalist requires heavy weight"}]}`,
          },
        ],
      }],
    });

    const raw = response.content[0]?.text?.trim() || '{}';
    let result;
    try { result = JSON.parse(raw); }
    catch { log(`[Polish] Could not parse vision response — skipping patches`); return; }

    log(`[Polish] Style fidelity score: ${result.score ?? '?'}/10`);

    // 5. Apply CSS patches if score < 7
    if (typeof result.score === 'number' && result.score < 7 && Array.isArray(result.changes) && result.changes.length > 0) {
      log(`[Polish] Applying ${result.changes.length} CSS improvement(s)...`);
      const indexCssPath = path.join(projectPath, 'src', 'index.css');
      let css = fs.existsSync(indexCssPath) ? fs.readFileSync(indexCssPath, 'utf-8') : '';

      // Append a Polish Pass block at the end
      const patchBlock = [
        '',
        '/* ── Polish Pass overrides (style fidelity improvements) ── */',
        ...result.changes.map(c => `${c.selector} { ${c.property}: ${c.value}; /* ${c.reason} */ }`),
        '',
      ].join('\n');

      css += patchBlock;
      fs.writeFileSync(indexCssPath, css, 'utf-8');
      log(`[Polish] CSS patches applied to src/index.css.`);
    } else {
      log(`[Polish] Score ≥ 7 — no patches needed.`);
    }
  } catch (e) {
    log(`[Polish] Vision analysis failed: ${e.message}`);
  }
}

module.exports = { runPolishPass };
