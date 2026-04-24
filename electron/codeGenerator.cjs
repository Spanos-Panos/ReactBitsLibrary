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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collect src/ file names so the continuation prompt can be specific. */
function listSrcFiles(projectPath) {
  try {
    const srcDir = path.join(projectPath, 'src');
    const walk = (dir, base = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const result = [];
      for (const e of entries) {
        const rel = base ? `${base}/${e.name}` : e.name;
        if (e.isDirectory()) result.push(...walk(path.join(dir, e.name), rel));
        else result.push(rel);
      }
      return result;
    };
    return walk(srcDir);
  } catch {
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs Claude Code inside the generated project directory.
 * On budget-exhaustion, automatically spawns one continuation pass.
 *
 * @param {{ projectPath, onProgress, prompt?, maxBudgetUsd? }} options
 * @param {number}  _attempt        rate-limit retry counter (internal)
 * @param {boolean} _isContinuation true when this is the auto-continuation pass
 */
async function generateCode({ projectPath, onProgress, prompt: customPrompt, maxBudgetUsd }, _attempt = 0, _isContinuation = false) {
  const notify = (msg) => { if (onProgress) onProgress(msg); };

  if (_isContinuation) {
    notify('[Generator] Starting continuation pass to complete unfinished files...');
  } else {
    notify('[Generator] Starting Claude Code agent...');
  }

  return new Promise((resolve, reject) => {
    let saw429 = false;
    let sawBudgetError = false;
    const isWin = process.platform === 'win32';

    const prompt = customPrompt || 'Read CLAUDE.md and follow the WORKFLOW section to build the site. Output DONE when finished.';
    const safePrompt = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const effectiveBudget = (Number.isFinite(maxBudgetUsd) ? Math.min(5, Math.max(0.05, maxBudgetUsd)) : 1.5).toFixed(2);

    const cmd = [
      'npx @anthropic-ai/claude-code',
      '--print',
      '--verbose',
      '--dangerously-skip-permissions',
      '--output-format stream-json',
      '--include-partial-messages',
      '--model claude-sonnet-4-6',
      `--max-budget-usd ${effectiveBudget}`,
      `"${safePrompt}"`,
    ].join(' ');

    const child = spawn(cmd, [], {
      cwd: path.resolve(projectPath),
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    });

    const timeoutHandle = setTimeout(() => {
      notify('[Generator] ⏱ Timed out after 15 minutes. Terminating...');
      if (isWin) {
        try { require('child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch (_) {}
      } else {
        child.kill('SIGTERM');
      }
      reject(new Error('[Generator] Timed out. The project may be partially generated — open it and run `npm run dev` to check.'));
    }, TIMEOUT_MS);

    let stdoutBuf = '';
    child.stdout.on('data', (data) => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.type === 'result' && msg.subtype === 'error_max_budget_usd') sawBudgetError = true;
          const ui = formatStreamMessage(msg);
          if (ui) notify(ui);
        } catch (_) {
          if (!trimmed.startsWith('npm warn') && !trimmed.includes('added ') && trimmed.length > 2) {
            notify(trimmed);
          }
        }
      }
    });

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
        return;
      }

      if (sawBudgetError && !_isContinuation) {
        // First budget hit — auto-spawn one continuation pass.
        const existingFiles = listSrcFiles(projectPath);
        const fileList = existingFiles.length
          ? existingFiles.map(f => `  - src/${f}`).join('\n')
          : '  (none detected)';

        notify('[Generator] Budget reached. Auto-starting continuation pass...');

        const continuationPrompt =
          'Read CLAUDE.md to understand the project goals. ' +
          'A previous generation pass ran out of budget. ' +
          'The following src/ files already exist and should NOT be rewritten unless clearly incomplete:\n' +
          fileList + '\n' +
          'Check each required file. Complete only missing or stub files. ' +
          'Do not modify files that already have a full implementation. ' +
          'Output DONE when finished.';

        // Give continuation half the original budget, minimum $0.50.
        const continuationBudget = Math.max(0.5, (Number.isFinite(maxBudgetUsd) ? maxBudgetUsd : 1.5) * 0.5);

        generateCode(
          { projectPath, onProgress, prompt: continuationPrompt, maxBudgetUsd: continuationBudget },
          0,
          true // isContinuation — no further auto-retry on budget
        ).then(resolve).catch(() => {
          notify('[Generator] ⚠ Continuation pass also hit budget — project may be incomplete. Open the folder to inspect partial output.');
          resolve(); // partial output is still accessible
        });
        return;
      }

      if (sawBudgetError && _isContinuation) {
        notify('[Generator] ⚠ Continuation pass hit budget limit — project may be incomplete. Open the folder to inspect.');
        resolve();
        return;
      }

      if (saw429 && _attempt < 2) {
        const waitSec = 65;
        notify(`[Generator] Rate limit hit — retrying in ${waitSec}s (attempt ${_attempt + 1}/2)...`);
        setTimeout(() => {
          generateCode({ projectPath, onProgress, maxBudgetUsd }, _attempt + 1).then(resolve).catch(reject);
        }, waitSec * 1000);
        return;
      }

      reject(new Error(`[Generator] Claude Code exited with code ${code}. Check the log for details.`));
    });
  });
}

module.exports = { generateCode };
