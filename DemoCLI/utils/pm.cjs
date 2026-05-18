/**
 * pm.cjs — Package manager helpers shared across all generators.
 *
 * Centralises the three repeated patterns:
 *   1. Building the `vite create` scaffold command for a given PM
 *   2. Building the install command string
 *   3. Patching package.json with a set of dependency names
 */

const fs = require('fs/promises');

/**
 * Pinned semver ranges for generated projects (avoid `latest` on every install —
 * each `latest` forces a registry metadata fetch and slows cold installs a lot).
 * Unknown / auto-detected deps still use `latest`.
 */
/**
 * Vite 8+ pulls `rolldown` transitively. npm `overrides` must resolve with `--prefer-offline`
 * (used during scaffold install): `^1.0.1` fails ETARGET when the local packument only has 1.0.0.
 * `^1.0.0` matches 1.0.0 from cache and 1.0.1+ when the registry is fresh.
 */
const ROLLDOWN_OVERRIDE = '^1.0.0';

const SCAFFOLD_DEP_VERSIONS = {
  'framer-motion': '^12.38.0',
  motion: '^12.23.12',
  gsap: '^3.14.2',
  ogl: '^1.0.11',
  '@react-three/fiber': '^9.5.0',
  '@react-three/drei': '^10.7.6',
  three: '^0.183.2',
  maath: '^0.10.8',
  'react-spring': '^10.0.1',
  '@react-spring/three': '^10.0.1',
  'react-icons': '^5.5.0',
  meshline: '^3.3.1',
  '@react-three/rapier': '^2.1.0',
  'lucide-react': '^0.544.0',
  clsx: '^2.1.1',
  'tailwind-merge': '^3.3.1',
  '@tailwindcss/vite': '^4.1.14',
  tailwindcss: '^4.1.14',
  postprocessing: '^6.37.8',
  '@react-three/postprocessing': '^3.0.4',
  'gl-matrix': '^3.4.3',
  lenis: '^1.3.8',
  'matter-js': '^0.20.0',
  'motion-utils': '^12.23.6',
  'react-router-dom': '^7.11.0',
  'styled-components': '^6.1.19',
};

function getScaffoldCmd(packageManager, projectName) {
  switch (packageManager) {
    case 'pnpm': return `pnpm create vite ${projectName} --template react-ts`;
    case 'yarn': return `yarn create vite ${projectName} --template react-ts`;
    case 'bun':  return `bun create vite ${projectName} --template react-ts`;
    default:     return `npm create vite@latest ${projectName} -- --template react-ts`;
  }
}

function getInstallCmd(packageManager) {
  // --prefer-offline: reuse npm cache when possible (repeat generations much faster).
  // --progress: npm often hides the progress bar when stdout is not a TTY (Electron spawn).
  return packageManager === 'npm'
    ? 'install --no-audit --no-fund --prefer-offline --progress'
    : 'install';
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
        pkgJson.dependencies[dep] = SCAFFOLD_DEP_VERSIONS[dep] || 'latest';
      }
    }
    // npm / pnpm / bun (Yarn 2+): flatten transitive rolldown to a published semver range
    const prevOv = pkgJson.overrides && typeof pkgJson.overrides === 'object' && !Array.isArray(pkgJson.overrides)
      ? pkgJson.overrides
      : {};
    pkgJson.overrides = { ...prevOv, rolldown: ROLLDOWN_OVERRIDE };
    // Yarn v1
    const prevRes = pkgJson.resolutions && typeof pkgJson.resolutions === 'object' && !Array.isArray(pkgJson.resolutions)
      ? pkgJson.resolutions
      : {};
    pkgJson.resolutions = { ...prevRes, rolldown: ROLLDOWN_OVERRIDE };

    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
  } catch (e) {
    log(`Warning: Could not patch package.json: ${e.message}\n`);
  }
}

module.exports = { getScaffoldCmd, getInstallCmd, patchPackageJson, SCAFFOLD_DEP_VERSIONS };
