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

if (!fs.existsSync(BUILD_DIR)) {
  process.exit(1);
}

// Find index-*.css
const cssFiles = fs
  .readdirSync(BUILD_DIR)
  .filter((file) => file.startsWith("index-") && file.endsWith(".css"));

if (cssFiles.length === 0) {
  process.exit(1);
}

// Check the first found CSS file (usually there's only one main entry chunk)
const cssFile = cssFiles[0];
const cssPath = path.join(BUILD_DIR, cssFile);
const cssContent = fs.readFileSync(cssPath, "utf8");

const missingSelectors = [];

CRITICAL_SELECTORS.forEach((selector) => {
  if (!cssContent.includes(selector)) {
    missingSelectors.push(selector);
  }
});

if (missingSelectors.length > 0) {
  missingSelectors.forEach((s) => {});
  process.exit(1);
} else {
  process.exit(0);
}
