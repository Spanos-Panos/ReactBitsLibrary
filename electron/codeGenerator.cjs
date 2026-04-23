const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// ── Stream-JSON message formatter ─────────────────────────────────────────────

function formatStreamMessage(msg) {
  try {
    if (msg.type === 'assistant') {
      const content = msg.message?.content || [];
      for (const block of content) {
        if (block.type === 'text' && block.text?.trim()) {
          // Only show first 220 chars of text blocks — they can be very long
          const preview = block.text.trim().slice(0, 220).replace(/\n+/g, ' ');
          return `[Claude] ${preview}${block.text.length > 220 ? '…' : ''}`;
        }
        if (block.type === 'tool_use') {
          const name = block.name || 'tool';
          const input = block.input || {};
          if (name === 'Bash')      return `[Bash] ${(input.command || '').slice(0, 120)}`;
          if (name === 'Edit' || name === 'MultiEdit')
                                    return `[Edit] ${input.file_path || input.path || '?'}`;
          if (name === 'Write')     return `[Write] ${input.file_path || '?'}`;
          if (name === 'Read')      return `[Read] ${input.file_path || input.path || '?'}`;
          if (name === 'Glob')      return `[Glob] ${input.pattern || '?'}`;
          if (name === 'Grep')      return `[Grep] ${input.pattern || '?'}`;
          return `[${name}] ${JSON.stringify(input).slice(0, 100)}`;
        }
      }
      return null;
    }

    if (msg.type === 'result') {
      const parts = [];
      if (msg.num_turns)  parts.push(`${msg.num_turns} turns`);
      if (msg.cost_usd != null) parts.push(`$${msg.cost_usd.toFixed(4)}`);
      const status = msg.subtype === 'success' ? 'Complete' : `Ended (${msg.subtype})`;
      return `[Generator] ${status}${parts.length ? ` · ${parts.join(' · ')}` : ''}`;
    }
  } catch (_) { /* ignore parse errors */ }
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs Claude Code programmatically (no visible terminal window) inside the
 * generated project directory. Claude reads CLAUDE.md for its mission.
 *
 * @param {{ projectPath: string, onProgress: (msg: string) => void }} options
 */
async function generateCode({ projectPath, onProgress, prompt: customPrompt, maxBudgetUsd }, _attempt = 0) {
  const notify = (msg) => { if (onProgress) onProgress(msg); };
  notify('[Generator] Starting Claude Code agent...');

  return new Promise((resolve, reject) => {
    let saw429 = false;
    const isWin = process.platform === 'win32';

    // The prompt is intentionally short — the real mission lives in CLAUDE.md.
    // Keep it free of ALL shell metacharacters: no backticks, no parens, no $, no quotes.
    const prompt = customPrompt || 'Read CLAUDE.md and follow the WORKFLOW section to build the site. Output DONE when finished.';

    // Build the full command as ONE string and pass it to spawn with an empty args array.
    // This avoids the Node.js concatenation-without-quoting bug (DEP0190).
    // Double-quote the prompt so the shell treats it as a single token.
    const safePrompt = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const cmd = [
      'npx @anthropic-ai/claude-code',
      '--print',
      '--verbose',
      '--dangerously-skip-permissions',
      '--output-format stream-json',
      '--include-partial-messages',
      `--model claude-sonnet-4-6`,
      `--max-budget-usd ${(Number.isFinite(maxBudgetUsd) ? Math.min(1, Math.max(0.05, maxBudgetUsd)) : 0.6).toFixed(2)}`,
      `"${safePrompt}"`,
    ].join(' ');

    const child = spawn(cmd, [], {
      cwd: path.resolve(projectPath),
      shell: true,
      windowsHide: true,   // ← no visible console window
      env: { ...process.env },
    });

    // Kill after timeout
    const timeoutHandle = setTimeout(() => {
      notify('[Generator] ⏱ Timed out after 15 minutes. Terminating...');
      if (isWin) {
        try {
          require('child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
        } catch (_) {}
      } else {
        child.kill('SIGTERM');
      }
      reject(new Error('[Generator] Timed out. The project may be partially generated — open it and run `npm run dev` to check.'));
    }, TIMEOUT_MS);

    // Parse NDJSON stream line-by-line
    let stdoutBuf = '';
    child.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop(); // hold incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          const ui = formatStreamMessage(msg);
          if (ui) notify(ui);
        } catch (_) {
          // Not JSON (e.g. npx download progress) — show as-is but filter noise
          if (!trimmed.startsWith('npm warn') && !trimmed.includes('added ') && trimmed.length > 2) {
            notify(trimmed);
          }
        }
      }
    });

    // stderr goes to progress log as warnings
    let stderrBuf = '';
    child.stderr.on('data', (data) => {
      stderrBuf += data.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('npm warn') || trimmed.includes('added ')) continue;
        if (trimmed.includes('429') || trimmed.toLowerCase().includes('rate limit')) saw429 = true;
        notify(`[stderr] ${trimmed}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`[Generator] Failed to start Claude Code: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      if (code === 0 || code === null) {
        notify('[Generator] Claude Code finished.');
        resolve();
      } else if (saw429 && _attempt < 2) {
        const waitSec = 65;
        notify(`[Generator] Rate limit hit — retrying in ${waitSec}s (attempt ${_attempt + 1}/2)...`);
        setTimeout(() => {
          generateCode({ projectPath, onProgress }, _attempt + 1).then(resolve).catch(reject);
        }, waitSec * 1000);
      } else {
        reject(new Error(`[Generator] Claude Code exited with code ${code}. Check the log for details.`));
      }
    });
  });
}

module.exports = { generateCode };
