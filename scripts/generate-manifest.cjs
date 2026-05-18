const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reactBitsRoot = path.join(root, "ReactBitsComponents");
const universalRoot = path.join(root, "UniversalComponents");
const outFile = path.join(root, "src", "reactbits-manifest.json");

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function buildReactBitsItem(category, dirName, usageFileName) {
  const name = dirName;
  const fullPath = path.join(reactBitsRoot, category, dirName, usageFileName);
  let usageMarkdown = "";
  try {
    usageMarkdown = fs.readFileSync(fullPath, "utf-8");
  } catch {
    usageMarkdown = "";
  }

  return {
    id: `${category}/${name}`,
    name,
    category,
    library: "reactbits",
    usageMarkdown,
    relativePath: path.relative(root, fullPath).replace(/\\/g, "/"),
  };
}

function buildUniversalItem(group, dirName, usageFileName) {
  const name = dirName;
  const fullPath = path.join(universalRoot, group, dirName, usageFileName);
  let usageMarkdown = "";
  try {
    usageMarkdown = fs.readFileSync(fullPath, "utf-8");
  } catch {
    usageMarkdown = "";
  }

  return {
    id: `${group}/${name}`,
    name,
    category: group,
    library: "universal",
    usageMarkdown,
    relativePath: path.relative(root, fullPath).replace(/\\/g, "/"),
  };
}

function collectReactBitsItems() {
  const categories = ["Components", "Animations", "Backgrounds", "TextAnimations"];
  const items = [];

  for (const category of categories) {
    const categoryDir = path.join(reactBitsRoot, category);
    const entries = safeReadDir(categoryDir);
    const dirs = entries.filter((e) => e.isDirectory());

    for (const dir of dirs) {
      const dirPath = path.join(categoryDir, dir.name);
      const files = safeReadDir(dirPath);
      const usageFile = files.find(
        (f) => f.isFile() && f.name.toLowerCase().startsWith("usage") && f.name.toLowerCase().endsWith(".md"),
      );
      if (!usageFile) continue;
      items.push(buildReactBitsItem(category, dir.name, usageFile.name));
    }
  }

  return items;
}

function collectUniversalItems() {
  const items = [];
  const groups = safeReadDir(universalRoot).filter((e) => e.isDirectory());

  for (const group of groups) {
    const groupDir = path.join(universalRoot, group.name);
    const entries = safeReadDir(groupDir).filter((e) => e.isDirectory());

    for (const dir of entries) {
      const dirPath = path.join(groupDir, dir.name);
      const files = safeReadDir(dirPath);
      const usageFile = files.find(
        (f) => f.isFile() && f.name.toLowerCase().startsWith("usage") && f.name.toLowerCase().endsWith(".md"),
      );
      if (!usageFile) continue;
      items.push(buildUniversalItem(group.name, dir.name, usageFile.name));
    }
  }

  return items;
}

function main() {
  if (!fs.existsSync(reactBitsRoot)) {
    console.error("ReactBitsComponents folder not found at:", reactBitsRoot);
    process.exit(1);
  }

  const reactBitsItems = collectReactBitsItems();
  const universalItems = fs.existsSync(universalRoot) ? collectUniversalItems() : [];
  const items = [...reactBitsItems, ...universalItems];

  console.log(`Collected ${reactBitsItems.length} ReactBits + ${universalItems.length} universal items.`);

  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf-8");
  console.log("Wrote manifest to:", outFile);
}

main();
