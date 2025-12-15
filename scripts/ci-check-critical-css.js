import fs from "node:fs";
import path from "node:path";

const BUILD_DIR = path.resolve("dist/public/assets");

// Critical selectors that MUST be present in production CSS
const CRITICAL_SELECTORS = [
  ".executive-glass-card", // Theme: Luxury / Glass
  ".style1-card", // Theme: Style1
  // Tailwind classes might vary if JIT, but if we safe-listed or use them, they should appear.
  // We'll check for the custom z-index variable definitions as a proxy for the config being loaded
  "--z-index-modal",
];

console.log("Checking Critical CSS integrity...");

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`Error: Build directory not found at ${BUILD_DIR}`);
  console.error('Run "npm run build:client" before running this check.');
  process.exit(1);
}

// Find index-*.css
const cssFiles = fs
  .readdirSync(BUILD_DIR)
  .filter((file) => file.startsWith("index-") && file.endsWith(".css"));

if (cssFiles.length === 0) {
  console.error("Error: No index-*.css asset found in build directory.");
  process.exit(1);
}

// Check the first found CSS file (usually there's only one main entry chunk)
const cssFile = cssFiles[0];
const cssPath = path.join(BUILD_DIR, cssFile);
const cssContent = fs.readFileSync(cssPath, "utf8");

console.log(`Inspecting artifact: ${cssFile}`);

let missingSelectors = [];

CRITICAL_SELECTORS.forEach((selector) => {
  if (!cssContent.includes(selector)) {
    missingSelectors.push(selector);
  }
});

if (missingSelectors.length > 0) {
  console.error("\u001b[31m[FAIL] Critical CSS missing!\u001b[0m");
  console.error(`The following required selectors were not found in ${cssFile}:`);
  missingSelectors.forEach((s) => console.error(`  - ${s}`));
  console.error("\nPossible causes:");
  console.error("  1. File not imported (Ghost Style).");
  console.error("  2. Tailwind config misconfiguration.");
  console.error("  3. Purge/Tree-shaking aggressively removed it (if not used in code).");
  process.exit(1);
} else {
  console.log("\u001b[32m[PASS] Critical CSS signatures verified.\u001b[0m");
  process.exit(0);
}
