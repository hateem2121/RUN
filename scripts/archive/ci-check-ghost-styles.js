import fs from "node:fs";
import path from "node:path";

// Run from root, so simple relative paths work better or use process.cwd()
const STYLES_DIR = path.resolve("client/src/styles");
const INDEX_CSS = path.resolve("client/src/index.css");

// 1. List all CSS files in styles dir
if (!fs.existsSync(STYLES_DIR)) {
  process.exit(1);
}

const styleFiles = fs.readdirSync(STYLES_DIR).filter((file) => file.endsWith(".css"));

if (styleFiles.length === 0) {
  process.exit(0);
}

// 2. Read index.css
if (!fs.existsSync(INDEX_CSS)) {
  process.exit(1);
}

const indexContent = fs.readFileSync(INDEX_CSS, "utf8");

// 3. Verify imports
const missingImports = [];

styleFiles.forEach((file) => {
  // Check for @import matching the filename
  // Flexible regex to catch @import "./styles/FILE" or @import "styles/FILE" or similar
  const importRegex = new RegExp(`@import.*${file}.*`, "i");

  if (!importRegex.test(indexContent)) {
    missingImports.push(file);
  }
});

if (missingImports.length > 0) {
  missingImports.forEach((_file) => {});
  process.exit(1);
} else {
  process.exit(0);
}
