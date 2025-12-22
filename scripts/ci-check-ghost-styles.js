import fs from "node:fs";
import path from "node:path";

// Run from root, so simple relative paths work better or use process.cwd()
const STYLES_DIR = path.resolve("client/src/styles");
const INDEX_CSS = path.resolve("client/src/index.css");

// 1. List all CSS files in styles dir
if (!fs.existsSync(STYLES_DIR)) {
  console.error(`Error: Styles directory not found at ${STYLES_DIR}`);
  process.exit(1);
}

const styleFiles = fs.readdirSync(STYLES_DIR).filter((file) => file.endsWith(".css"));

if (styleFiles.length === 0) {
  console.warn("Warning: No CSS files found in styles directory.");
  process.exit(0);
}

// 2. Read index.css
if (!fs.existsSync(INDEX_CSS)) {
  console.error(`Error: index.css not found at ${INDEX_CSS}`);
  process.exit(1);
}

const indexContent = fs.readFileSync(INDEX_CSS, "utf8");

// 3. Verify imports
const missingImports = [];

console.log("Checking for Ghost Styles...");
console.log(`Scanning ${styleFiles.length} files in ${STYLES_DIR}...`);

styleFiles.forEach((file) => {
  // Check for @import matching the filename
  // Flexible regex to catch @import "./styles/FILE" or @import "styles/FILE" or similar
  const importRegex = new RegExp(`@import.*${file}.*`, "i");

  if (!importRegex.test(indexContent)) {
    missingImports.push(file);
  }
});

if (missingImports.length > 0) {
  console.error("\u001b[31m[FAIL] Ghost Styles Detected!\u001b[0m");
  console.error(
    "The following files exist in client/src/styles/ but are NOT imported in client/src/index.css:",
  );
  missingImports.forEach((file) => console.error(`  - ${file}`));
  console.error("\nPlease add an @import statement to client/src/index.css for these files.");
  process.exit(1);
} else {
  console.log("\u001b[32m[PASS] All styles are strictly accounted for.\u001b[0m");
  process.exit(0);
}
