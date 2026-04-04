'use strict';
// Double-fork launcher: spawns the watchdog as a detached child, then immediately exits.
// Because this process exits before concurrently can tree-kill it, the watchdog's parent
// becomes a dead PID — taskkill /T cannot traverse to it and will NOT kill the watchdog.
const { spawn } = require('child_process');
const path = require('path');

const [, , nodeExe, watchdogScript, electronPid] = process.argv;

const child = spawn(nodeExe, [watchdogScript, electronPid], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true
});
child.unref();
process.exit(0);
