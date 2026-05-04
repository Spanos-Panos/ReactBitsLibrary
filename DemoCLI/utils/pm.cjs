/**
 * pm.cjs — Package manager helpers shared across all generators.
 *
 * Centralises the three repeated patterns:
 *   1. Building the `vite create` scaffold command for a given PM
 *   2. Building the install command string
 *   3. Patching package.json with a set of dependency names
 */

const fs = require('fs/promises');

function getScaffoldCmd(packageManager, projectName) {
  switch (packageManager) {
    case 'pnpm': return `pnpm create vite ${projectName} --template react-ts`;
    case 'yarn': return `yarn create vite ${projectName} --template react-ts`;
    case 'bun':  return `bun create vite ${projectName} --template react-ts`;
    default:     return `npm create vite@latest ${projectName} -- --template react-ts`;
  }
}

function getInstallCmd(packageManager) {
  return packageManager === 'npm' ? 'install --no-audit --no-fund' : 'install';
}

/**
 * Adds `deps` (Array or Set of package names) to the `dependencies` field of
 * the package.json at `pkgJsonPath`.  Skips entries already present in either
 * `dependencies` or `devDependencies` so it never downgrades a pinned version.
 */
async function patchPackageJson(pkgJsonPath, deps, log = () => {}) {
  try {
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
    pkgJson.dependencies = pkgJson.dependencies || {};
    for (const dep of deps) {
      if (!pkgJson.dependencies[dep] && !pkgJson.devDependencies?.[dep]) {
        pkgJson.dependencies[dep] = 'latest';
      }
    }
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
  } catch (e) {
    log(`Warning: Could not patch package.json: ${e.message}\n`);
  }
}

module.exports = { getScaffoldCmd, getInstallCmd, patchPackageJson };
