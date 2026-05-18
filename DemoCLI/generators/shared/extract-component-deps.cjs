/**
 * Scans component source for external import package names.
 * Used by scaffolder (full projects) and vite-react (single-component demos).
 */

function rootPackageName(pkg) {
  if (pkg.startsWith('.')) return null;
  if (pkg.startsWith('/')) return null;
  return pkg.startsWith('@')
    ? pkg.split('/').slice(0, 2).join('/')
    : pkg.split('/')[0];
}

function extractFromSource(content, skipSet) {
  const extra = new Set();
  if (!content) return extra;

  const matches = content.matchAll(/\bimport\s+(?:type\s+)?(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g);
  for (const [, pkg] of matches) {
    const root = rootPackageName(pkg);
    if (root && !skipSet.has(root)) extra.add(root);
  }
  return extra;
}

function extractComponentDepsFromFiles(files, skipSet) {
  const extra = new Set();
  for (const file of files || []) {
    for (const dep of extractFromSource(file.content, skipSet)) extra.add(dep);
  }
  return extra;
}

function extractComponentDeps(selectedComponents, skipSet) {
  const extra = new Set();
  for (const comp of selectedComponents || []) {
    if (!comp.files) continue;
    for (const dep of extractComponentDepsFromFiles(comp.files, skipSet)) extra.add(dep);
  }
  return extra;
}

module.exports = { extractComponentDeps, extractComponentDepsFromFiles };
