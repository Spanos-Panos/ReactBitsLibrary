const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd, onLog) {
  return new Promise((resolve, reject) => {
    if (!command) return reject(new Error('Attempted to run an empty command. Check your package manager settings.'));

    const safeCwd = path.resolve(cwd);
    const env = { ...process.env, CI: 'true', FORCE_COLOR: '1', YES: 'true', NPM_CONFIG_YES: 'true' };

    console.log(`[DemoCLI] Spawning: "${command}" in ${safeCwd}`);
    const child = spawn(command, args, { cwd: safeCwd, shell: true, env });

    const handleOutput = (data) => {
      const text = data.toString();
      if (onLog) onLog(text);
      if (text.match(/\([yY]\/[nN]\)/) || text.match(/proceed\?/i) || text.match(/components\.json/i)) {
        try { child.stdin.write('y\n'); } catch (e) { /* ignore */ }
      }
    };

    child.stdout.on('data', handleOutput);
    child.stderr.on('data', handleOutput);
    child.on('error', (err) => { console.error('[DemoCLI] Spawn error:', err); reject(err); });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

module.exports = { runCommand };
