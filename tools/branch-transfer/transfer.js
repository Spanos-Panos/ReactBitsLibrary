#!/usr/bin/env node
'use strict';

const https        = require('https');
const readline     = require('readline');
const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const { execSync } = require('child_process');

// ─── Colors (ANSI, zero deps) ─────────────────────────────────────────────────

const c = {
  reset:   s => `\x1b[0m${s}\x1b[0m`,
  bold:    s => `\x1b[1m${s}\x1b[0m`,
  dim:     s => `\x1b[2m${s}\x1b[0m`,
  red:     s => `\x1b[91m${s}\x1b[0m`,
  green:   s => `\x1b[92m${s}\x1b[0m`,
  yellow:  s => `\x1b[93m${s}\x1b[0m`,
  blue:    s => `\x1b[94m${s}\x1b[0m`,
  magenta: s => `\x1b[95m${s}\x1b[0m`,
  cyan:    s => `\x1b[96m${s}\x1b[0m`,
  white:   s => `\x1b[97m${s}\x1b[0m`,
};

const ok  = msg => console.log(`${c.green('✓')} ${msg}`);
const err = msg => console.log(`${c.red('✗')} ${msg}`);
const warn = msg => console.log(`${c.yellow('⚠')} ${msg}`);
const info = msg => console.log(`${c.dim('·')} ${msg}`);

// ─── Spinner ──────────────────────────────────────────────────────────────────

function spinner(msg) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${c.cyan(frames[i++ % frames.length])} ${c.dim(msg)}   `);
  }, 80);
  const clear = (line = '') => {
    clearInterval(id);
    process.stdout.write(`\r${line}${' '.repeat(Math.max(0, msg.length + 6 - line.length))}\n`);
  };
  return {
    succeed: text => clear(`${c.green('✓')} ${text}`),
    fail:    text => clear(`${c.red('✗')} ${text}`),
    stop:    ()   => { clearInterval(id); process.stdout.write('\r' + ' '.repeat(msg.length + 8) + '\r'); },
  };
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const CONFIG_DIR   = path.join(os.homedir(), '.branch-transfer');
const CONFIG_FILE  = path.join(CONFIG_DIR, 'config.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');

// ─── Config ───────────────────────────────────────────────────────────────────

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return {}; }
}

function saveConfig(data) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { warn('Could not save config: ' + e.message); }
}

// ─── History ──────────────────────────────────────────────────────────────────

function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch { return []; }
}

function saveHistory(entries) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries.slice(0, 50), null, 2), 'utf8');
  } catch (e) { warn('Could not save history: ' + e.message); }
}

function appendHistory(entry) {
  const h = loadHistory();
  const id = (h[0]?.id ?? 0) + 1;
  h.unshift({ id, ...entry });
  saveHistory(h);
  return id;
}

// ─── Workflows ────────────────────────────────────────────────────────────────

function loadWorkflows() { return loadConfig().workflows || []; }

function saveWorkflow(w) {
  const cfg = loadConfig();
  const wf = cfg.workflows || [];
  const idx = wf.findIndex(x => x.name === w.name);
  if (idx >= 0) wf[idx] = w; else wf.push(w);
  saveConfig({ ...cfg, workflows: wf });
}

function deleteWorkflow(name) {
  const cfg = loadConfig();
  saveConfig({ ...cfg, workflows: (cfg.workflows || []).filter(w => w.name !== name) });
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, a => resolve(a.trim())));
const close = () => rl.close();

// ─── GitHub API ───────────────────────────────────────────────────────────────

function githubApi(method, endpoint, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'branch-transfer-cli/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`GitHub API error (${res.statusCode}): ${parsed?.message || parsed}`));
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getBranchSHA(owner, repo, branch, token) {
  const ref = await githubApi('GET', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, null, token);
  const sha = ref?.object?.sha;
  if (!sha) throw new Error(`Could not read SHA for branch "${branch}"`);
  return sha;
}

async function forcePushSHA(owner, repo, branch, sha, token) {
  await githubApi('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, { sha, force: true }, token);
}

// ─── Git local ────────────────────────────────────────────────────────────────

function getGitRoot(dir) {
  try { return execSync('git rev-parse --show-toplevel', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim(); }
  catch { return null; }
}

function syncLocalBranch(repoRoot, destBranch) {
  const run = cmd => execSync(cmd, { cwd: repoRoot, stdio: 'inherit' });
  info('git fetch origin...');
  run('git fetch origin');
  info(`git checkout ${destBranch}...`);
  run(`git checkout -f ${destBranch}`); // -f: discard conflicting local changes
  info(`git reset --hard origin/${destBranch}...`);
  run(`git reset --hard origin/${destBranch}`);
}

async function handleLocalSync(destBranch, autoSync = false) {
  let localRepoRoot = getGitRoot(process.cwd());
  if (localRepoRoot) {
    info(`Detected local repo: ${c.dim(localRepoRoot)}`);
    if (!autoSync) {
      const ans = await ask(c.yellow('Sync locally too? ') + c.dim('(Y/n): '));
      if (ans.toLowerCase() === 'n') return;
    } else {
      info('Auto-sync enabled — syncing locally...');
    }
  } else {
    if (autoSync) { warn('No local repo detected — skipping auto-sync'); return; }
    const p = await ask(c.yellow('Local repo path ') + c.dim('(Enter to skip): '));
    if (!p) return;
    localRepoRoot = getGitRoot(p);
    if (!localRepoRoot) { warn('Not a git repo — skipping local sync'); return; }
  }
  console.log('');
  try {
    syncLocalBranch(localRepoRoot, destBranch);
    ok('Local repo synced');
  } catch (e) {
    warn('Local sync failed: ' + e.message);
    warn(`Run manually: git fetch origin && git checkout -f ${destBranch} && git reset --hard origin/${destBranch}`);
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseRepoInput(input) {
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  const plainMatch = input.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (plainMatch) return { owner: plainMatch[1], repo: plainMatch[2].replace(/\.git$/, '') };
  throw new Error(`Cannot parse repo from: "${input}"\nExpected: https://github.com/owner/repo  OR  owner/repo`);
}

function parseBranchInput(input) {
  const treeMatch = input.match(/github\.com\/[^/]+\/[^/]+\/tree\/(.+)/);
  if (treeMatch) return treeMatch[1].trim();
  if (input) return input;
  throw new Error(`Cannot parse branch from: "${input}"`);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ─── Token ────────────────────────────────────────────────────────────────────

function getToken() {
  return loadConfig().token || null;
}

async function setupToken() {
  const config = loadConfig();
  console.log('');
  console.log(c.cyan('  GitHub Personal Access Token'));
  console.log(c.dim('  Classic PAT (recommended) → github.com/settings/tokens → "Generate new token (classic)" → tick repo'));
  console.log(c.dim('  Fine-grained PAT          → needs "Contents: Read and write" for the repo'));
  console.log('');
  const token = await ask(c.yellow('Paste your PAT: '));
  if (!token) { warn('No token entered.'); return; }
  saveConfig({ ...config, token });
  ok(`Token saved ${c.dim('(ends in ...' + token.slice(-4) + ')')}`);
}

async function doSettings() {
  const config = loadConfig();
  const token  = config.token;
  console.log('');
  console.log(c.bold(c.cyan('  Settings')));
  console.log(c.dim('  ─────────────────────────────────────────────────────────'));
  if (token) {
    info(`Token: ${c.green('configured')} ${c.dim('(ends in ...' + token.slice(-4) + ')')}`);
  } else {
    info(`Token: ${c.red('not set')}  — required before using the tool`);
  }
  console.log('');
  console.log(`  ${c.yellow('1)')} ${token ? 'Change' : 'Set up'} GitHub token`);
  if (token) console.log(`  ${c.yellow('2)')} Clear saved token`);
  console.log(`  ${c.dim('0)')} Back`);
  console.log('');

  const choice = await ask(c.yellow('Choice: '));
  console.log('');

  if (choice === '1') {
    await setupToken();
  } else if (choice === '2' && token) {
    const conf = await ask(c.yellow('Clear saved token? ') + c.dim('(Y/n): '));
    if (conf.toLowerCase() !== 'n') {
      saveConfig({ ...config, token: undefined });
      ok('Token cleared.');
    }
  }
}

// ─── Option 1: New Transfer ───────────────────────────────────────────────────

async function doNewTransfer(token, presetWorkflow) {
  let owner, repo, sourceBranch, destBranch;

  if (!presetWorkflow) {
    const workflows = loadWorkflows();
    if (workflows.length > 0) {
      console.log('');
      console.log(c.bold(c.cyan('  Saved workflows:')));
      workflows.forEach((w, i) => {
        const syncTag = w.autoSync ? c.green(' ⟳') : '';
        console.log(`  ${c.yellow(String(i + 1) + ')')} ${c.white(w.name.padEnd(20))}${syncTag} ${c.cyan(w.source)} ${c.dim('→')} ${c.magenta(w.dest)}   ${c.dim(w.owner + '/' + w.repo)}`);
      });
      console.log('');
      const pick = await ask(c.yellow('Run a saved workflow? ') + c.dim('(# or Enter for manual): '));
      const idx = parseInt(pick, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < workflows.length) presetWorkflow = workflows[idx];
    }
  }

  if (presetWorkflow) {
    ({ owner, repo, source: sourceBranch, dest: destBranch } = presetWorkflow);
    console.log('');
    info(`Repo   : ${c.magenta(owner + '/' + repo)}`);
    info(`From   : ${c.cyan(sourceBranch)}`);
    info(`To     : ${c.yellow(destBranch)}`);
    console.log('');
  } else {
    console.log('');
    const repoRaw = await ask(c.yellow('Repository ') + c.dim('(URL or owner/repo): '));
    try { ({ owner, repo } = parseRepoInput(repoRaw)); }
    catch (e) { err(e.message); return; }
    info(`→ ${c.magenta(owner + '/' + repo)}\n`);

    const sourceRaw = await ask(c.yellow('Source branch ') + c.dim('(name or URL): '));
    sourceBranch = parseBranchInput(sourceRaw);
    info(`→ ${c.cyan(sourceBranch)}\n`);

    const destRaw = await ask(c.yellow('Destination branch ') + c.dim('(name or URL): '));
    destBranch = parseBranchInput(destRaw);
    info(`→ ${c.yellow(destBranch)}\n`);
  }

  // Summary box
  const line1 = `  Repo :  ${owner}/${repo}`;
  const line2 = `  FROM :  ${sourceBranch}`;
  const line3 = `  TO   :  ${destBranch}  ← will be OVERWRITTEN`;
  const width = Math.max(line1.length, line2.length, line3.length) + 2;
  const bar = '─'.repeat(width);
  console.log(c.dim('┌' + bar + '┐'));
  console.log(c.dim('│') + `  Repo :  ${c.magenta(owner + '/' + repo)}`);
  console.log(c.dim('│') + `  FROM :  ${c.cyan(sourceBranch)}`);
  console.log(c.dim('│') + `  TO   :  ${c.yellow(destBranch)}  ${c.red('← will be OVERWRITTEN')}`);
  console.log(c.dim('└' + bar + '┘'));
  console.log('');

  const confirm = await ask(c.yellow('Confirm transfer? ') + c.dim('(Y/n): '));
  if (confirm.toLowerCase() === 'n') { console.log(c.dim('Cancelled.')); return; }
  console.log('');

  // Snapshot destination SHA
  let prevSHA;
  const snap = spinner('Snapshotting destination branch...');
  try {
    prevSHA = await getBranchSHA(owner, repo, destBranch, token);
    snap.succeed(`Snapshot saved ${c.dim(prevSHA.slice(0, 7))}`);
  } catch (e) {
    snap.fail('Could not snapshot destination (revert unavailable)');
  }

  // Get source SHA
  const srcSpin = spinner('Reading source branch...');
  let appliedSHA;
  try {
    appliedSHA = await getBranchSHA(owner, repo, sourceBranch, token);
    srcSpin.succeed(`Source SHA ${c.dim(appliedSHA.slice(0, 7))}`);
  } catch (e) {
    srcSpin.fail('Failed to read source branch: ' + e.message);
    return;
  }

  // Force-update remote
  const pushSpin = spinner(`Updating remote "${destBranch}"...`);
  try {
    await forcePushSHA(owner, repo, destBranch, appliedSHA, token);
    pushSpin.succeed(`Remote ${c.yellow(destBranch)} updated`);
  } catch (e) {
    pushSpin.fail('Failed: ' + e.message);
    if (e.message.includes('403')) {
      warn('Token permission issue: needs "repo" scope (classic) or "Contents: write" (fine-grained)');
    }
    return;
  }

  // Local sync
  console.log('');
  await handleLocalSync(destBranch, presetWorkflow?.autoSync || false);

  // History
  const id = appendHistory({
    date: new Date().toISOString(),
    owner, repo,
    source: sourceBranch,
    dest: destBranch,
    appliedSHA,
    prevSHA: prevSHA || null,
  });

  // Save as workflow (skip if already running from a saved workflow)
  console.log('');
  if (presetWorkflow) {
    info(`Workflow ${c.cyan('"' + presetWorkflow.name + '"')} already saved — skipping.`);
  }
  const wfAns = presetWorkflow ? 'n' : await ask(c.yellow('Save as workflow? ') + c.dim('(Y/n): '));
  if (wfAns.toLowerCase() !== 'n') {
    const suggested = `${sourceBranch}-to-${destBranch}`;
    let wfName = await ask(c.yellow('Workflow name ') + c.dim(`(Enter for "${suggested}"): `));
    if (!wfName) wfName = suggested;

    // Duplicate loop
    let resolved = false;
    while (!resolved) {
      const existing = loadWorkflows().find(w => w.name === wfName);
      if (!existing) { resolved = true; break; }
      warn(`Workflow "${wfName}" already exists.`);
      const action = await ask(c.yellow('  (o) Overwrite  (r) Rename  (s) Skip → '));
      if (action.toLowerCase() === 'o') { resolved = true; break; }
      if (action.toLowerCase() === 's') { wfName = null; break; }
      wfName = await ask(c.yellow('  New name: '));
      if (!wfName) { wfName = null; break; }
    }

    if (wfName) {
      const syncAns = await ask(c.yellow('Auto-sync locally when running this workflow? ') + c.dim('(Y/n): '));
      const autoSync = syncAns.toLowerCase() !== 'n';
      saveWorkflow({ name: wfName, owner, repo, source: sourceBranch, dest: destBranch, autoSync });
      ok(`Saved as ${c.cyan('"' + wfName + '"')}${autoSync ? c.dim(' (auto-sync on)') : ''}`);
    } else {
      info('Skipped.');
    }
  }

  console.log('');
  console.log(c.green(c.bold(`  ✓ Transfer #${id} complete!`)));
  info(`${c.yellow(destBranch)} now matches ${c.cyan(sourceBranch)}`);
  info(c.dim(`https://github.com/${owner}/${repo}/tree/${destBranch}`));
  console.log('');
}

// ─── Option 2: History & Revert ───────────────────────────────────────────────

async function doHistory(token) {
  const history = loadHistory();
  if (history.length === 0) {
    console.log('');
    info('No history yet. Complete a transfer first.');
    console.log('');
    return;
  }

  console.log('');
  console.log(c.bold(c.cyan('  Transfer history')));
  console.log(c.dim('  ─────────────────────────────────────────────────────────'));
  const shown = history.slice(0, 10);
  shown.forEach(h => {
    const revertTag = h.prevSHA ? c.green(' [revertable]') : c.dim(' [no snapshot]');
    const isRevert  = h.source?.startsWith('REVERT') ? c.yellow(' ↺ revert') : '';
    console.log(`  ${c.dim('#' + String(h.id).padEnd(3))} ${c.dim(fmtDate(h.date).padEnd(17))} ${c.cyan(h.source)} ${c.dim('→')} ${c.yellow(h.dest)}${isRevert}${revertTag}`);
    if (h.prevSHA) info(`       snapshot: ${c.dim(h.prevSHA.slice(0, 7))}  →  apply: ${c.dim((h.appliedSHA || '').slice(0, 7))}`);
  });
  console.log(c.dim('  ─────────────────────────────────────────────────────────'));
  console.log('');

  const raw2    = await ask(c.yellow('Revert which entry? ') + c.dim('(type the # number, or Enter to cancel): '));
  const pick    = raw2.replace(/^#/, '').trim();
  if (!pick) return;

  const targetId = parseInt(pick, 10);
  const entry = history.find(h => h.id === targetId);
  if (!entry) { warn(`No entry #${targetId} found.`); return; }
  if (!entry.prevSHA) {
    warn(`Entry #${targetId} has no snapshot — created before snapshots were enabled.`);
    return;
  }

  console.log('');
  info(`Will revert ${c.yellow(entry.dest)} → SHA ${c.dim(entry.prevSHA.slice(0, 7))}`);
  info(c.dim(`(Undoes transfer #${entry.id} from ${fmtDate(entry.date)})`));
  console.log('');
  const confirm = await ask(c.yellow('Confirm revert? ') + c.dim('(Y/n): '));
  if (confirm.toLowerCase() === 'n') { console.log(c.dim('Cancelled.')); return; }
  console.log('');

  const revertSpin = spinner(`Reverting "${entry.dest}"...`);
  try {
    await forcePushSHA(entry.owner, entry.repo, entry.dest, entry.prevSHA, token);
    revertSpin.succeed(`Remote ${c.yellow(entry.dest)} reverted`);
  } catch (e) {
    revertSpin.fail('Revert failed: ' + e.message);
    return;
  }

  console.log('');
  await handleLocalSync(entry.dest);

  const rid = appendHistory({
    date: new Date().toISOString(),
    owner: entry.owner, repo: entry.repo,
    source: `REVERT of #${entry.id}`,
    dest: entry.dest,
    appliedSHA: entry.prevSHA,
    prevSHA: null,
  });

  console.log('');
  console.log(c.green(c.bold(`  ✓ Reverted! (logged as #${rid})`)));
  info(`${c.yellow(entry.dest)} is back to its state before transfer #${entry.id}`);
  console.log('');
}

// ─── Option 3: Saved Workflows ────────────────────────────────────────────────

async function doWorkflows(token) {
  while (true) {
    const workflows = loadWorkflows();
    console.log('');
    if (workflows.length === 0) {
      info('No saved workflows yet. Save one after a transfer.');
      console.log('');
      return;
    }

    console.log(c.bold(c.cyan('  Saved workflows')));
    console.log(c.dim('  ─────────────────────────────────────────────────────────'));
    workflows.forEach((w, i) => {
      const syncTag = w.autoSync ? c.green(' ⟳auto') : c.dim(' manual');
      console.log(`  ${c.yellow(String(i + 1) + ')')} ${c.white(w.name.padEnd(22))} ${c.cyan(w.source)} ${c.dim('→')} ${c.magenta(w.dest)}${syncTag}   ${c.dim(w.owner + '/' + w.repo)}`);
    });
    console.log(c.dim('  ─────────────────────────────────────────────────────────'));
    console.log(c.dim('  Enter number to run  ·  d<n> to delete  ·  e<n> to edit  ·  Enter to go back'));
    console.log(c.dim('  Example: 1 = run first · d1 = delete first · e1 = edit first'));
    console.log('');

    const raw  = await ask(c.yellow('Choice: '));
    const pick = raw.replace(/^#/, '').trim(); // strip accidental # prefix
    if (!pick) return;

    const lower = pick.toLowerCase();

    if (lower.startsWith('d')) {
      const idx = parseInt(pick.slice(1), 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= workflows.length) { warn('Invalid — type d1, d2, etc.'); continue; }
      const w = workflows[idx];
      const conf = await ask(c.yellow(`Delete "${w.name}"? `) + c.dim('(Y/n): '));
      if (conf.toLowerCase() !== 'n') { deleteWorkflow(w.name); ok(`Deleted "${w.name}"`); }

    } else if (lower.startsWith('e')) {
      const idx = parseInt(pick.slice(1), 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= workflows.length) { warn('Invalid — type e1, e2, etc.'); continue; }
      const w = workflows[idx];
      console.log('');
      console.log(c.bold(`  Editing: ${c.cyan(w.name)}`));
      info(`Current: ${c.cyan(w.source)} → ${c.magenta(w.dest)}  |  auto-sync: ${w.autoSync ? c.green('on') : c.dim('off')}`);
      console.log('');
      const newName = await ask(c.yellow('New name ') + c.dim(`(Enter to keep "${w.name}"): `));
      const syncAns = await ask(c.yellow('Auto-sync locally? ') + c.dim(`(current: ${w.autoSync ? 'Y' : 'N'})  (Y/n): `));
      const updated = {
        ...w,
        name: newName || w.name,
        autoSync: syncAns.toLowerCase() !== 'n',
      };
      if (newName && newName !== w.name) deleteWorkflow(w.name);
      saveWorkflow(updated);
      ok(`Updated "${updated.name}"`);

    } else {
      const idx = parseInt(pick, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= workflows.length) { warn(`Invalid — type a number between 1 and ${workflows.length}.`); continue; }
      await doNewTransfer(token, workflows[idx]);
      return;
    }
  }
}

// ─── Main menu ────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log(c.cyan('  ╔══════════════════════════════════════╗'));
  console.log(c.cyan('  ║') + c.bold(c.white('      GitHub Branch Transfer          ')) + c.cyan('║'));
  console.log(c.cyan('  ║') + c.dim('  Force-sync one branch to another    ') + c.cyan('║'));
  console.log(c.cyan('  ╚══════════════════════════════════════╝'));
  console.log('');

  while (true) {
    const token     = getToken();
    const histCount = loadHistory().length;
    const wfCount   = loadWorkflows().length;
    const locked    = !token;

    console.log(c.bold('  What would you like to do?'));
    if (locked) {
      console.log(`  ${c.dim('1)')} ${c.dim('New transfer')}           ${c.red('⚠ token required')}`);
      console.log(`  ${c.dim('2)')} ${c.dim('History & revert')}       ${c.red('⚠ token required')}`);
      console.log(`  ${c.dim('3)')} ${c.dim('Saved workflows')}        ${c.red('⚠ token required')}`);
    } else {
      console.log(`  ${c.yellow('1)')} New transfer`);
      console.log(`  ${c.yellow('2)')} History & revert   ${histCount > 0 ? c.dim(histCount + ' entries') : c.dim('empty')}`);
      console.log(`  ${c.yellow('3)')} Saved workflows    ${wfCount > 0 ? c.dim(wfCount + ' saved') : c.dim('none')}`);
    }
    console.log(`  ${c.yellow('4)')} Settings           ${token ? c.green('● token set') : c.red('○ no token')}`);
    console.log(`  ${c.dim('5)')} Exit`);
    console.log('');

    const choice = await ask(c.yellow('Choice: '));
    console.log('');

    if (locked && ['1','2','3'].includes(choice)) {
      warn('Set up your GitHub token first — go to Settings (4).');
      console.log('');
      continue;
    }

    if      (choice === '1') await doNewTransfer(token);
    else if (choice === '2') await doHistory(token);
    else if (choice === '3') await doWorkflows(token);
    else if (choice === '4') await doSettings();
    else if (choice === '5' || choice.toLowerCase() === 'exit' || choice === '') break;
    else { warn('Invalid choice.\n'); }
  }

  console.log(c.dim('  Goodbye.'));
  close();
}

main().catch(e => {
  console.error(c.red('\n  Unexpected error: ' + e.message));
  close();
  process.exit(1);
});
