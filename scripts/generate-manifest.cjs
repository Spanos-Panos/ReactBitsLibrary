const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reactBitsRoot = path.join(root, "ReactBitsComponents");
const outFile = path.join(root, "src", "reactbits-manifest.json");

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function buildItem(category, dirName, usageFileName) {
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
    usageMarkdown,
    relativePath: path.relative(root, fullPath).replace(/\\/g, "/"),
  };
}

function collectItems() {
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
      items.push(buildItem(category, dir.name, usageFile.name));
    }
  }

  return items;
}

function main() {
  if (!fs.existsSync(reactBitsRoot)) {
    console.error("ReactBitsComponents folder not found at:", reactBitsRoot);
    process.exit(1);
  }

  const items = collectItems();
  console.log(`Collected ${items.length} items from ReactBitsComponents.`);

  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf-8");
  console.log("Wrote manifest to:", outFile);
}

main();

