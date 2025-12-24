import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CLIENT_DIR = path.join(ROOT_DIR, "client/src");
const STYLES_DIR = path.join(CLIENT_DIR, "styles");
const INDEX_CSS_PATH = path.join(CLIENT_DIR, "index.css");

/**
 * Hardened CSS Contract Linter v2
 * - Supports multi-file scanning (index.css + src/styles/**)
 * - Validates utility existence and z-index semantic order.
 * - Blocks arbitrary z-[...] usage with actionable errors.
 */

const CONFIG = {
  requiredUtilities: ["backdrop-blur-xs", "z-dock", "z-modal"],
  zIndexContract: ["z-dock", "z-modal-backdrop", "z-modal", "z-popover", "z-tooltip", "z-toast"],
  // Robust patterns allowing for varying whitespace/formatting
  utilityPattern: /@utility\s+([a-zA-Z0-9-]+)/g,
  themeVarPattern: /--z-([a-zA-Z0-9-]+):\s*(-?\d+);/g,
  utilityValuePattern: /@utility\s+z-([a-zA-Z0-9-]+)\s*{\s*[^}]*?z-index:\s*(\d+);/gs,
  usagePattern: /\bz-([a-zA-Z0-9[\]-]+)(?![a-zA-Z0-9[\]-])/g,
};

function getAllCssFiles() {
  const files = [INDEX_CSS_PATH];
  if (fs.existsSync(STYLES_DIR)) {
    const styleFiles = fs
      .readdirSync(STYLES_DIR)
      .filter((f) => f.endsWith(".css"))
      .map((f) => path.join(STYLES_DIR, f));
    files.push(...styleFiles);
  }
  return files;
}

function main() {
  const cssFiles = getAllCssFiles();
  let hasErrors = false;

  const definedUtilities = new Set();
  const zValues = {};

  cssFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativeName = path.relative(CLIENT_DIR, filePath);

    // Collect defined utilities
    let match;
    while ((match = CONFIG.utilityPattern.exec(content)) !== null) {
      definedUtilities.add(match[1]);
    }

    // Collect z-index variables
    let varMatch;
    while ((varMatch = CONFIG.themeVarPattern.exec(content)) !== null) {
      zValues[`z-${varMatch[1]}`] = parseInt(varMatch[2], 10);
    }

    // Collect explicit utility values
    let utilValMatch;
    while ((utilValMatch = CONFIG.utilityValuePattern.exec(content)) !== null) {
      zValues[`z-${utilValMatch[1]}`] = parseInt(utilValMatch[2], 10);
    }
  });

  // 1. Check Required Utilities
  for (const util of CONFIG.requiredUtilities) {
    if (!definedUtilities.has(util)) {
      console.error(`❌ Missing required utility: ${util}`);
      hasErrors = true;
    }
  }

  // 2. Validate Z-Index Hierarchy
  for (let i = 0; i < CONFIG.zIndexContract.length - 1; i++) {
    const current = CONFIG.zIndexContract[i];
    const next = CONFIG.zIndexContract[i + 1];

    if (zValues[current] !== undefined && zValues[next] !== undefined) {
      if (zValues[current] >= zValues[next]) {
        console.error(
          `❌ Z-Index hierarchy violation: ${current} (${zValues[current]}) >= ${next} (${zValues[next]})`,
        );
        hasErrors = true;
      }
    }
  }

  // 3. Scan for Leakage (Arbitrary z-index)
  // Recursively find all .tsx/.ts files in src
  function getAllSourceFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== "node_modules" && file !== "dist") {
          getAllSourceFiles(filePath, fileList);
        }
      } else {
        if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          fileList.push(filePath);
        }
      }
    });

    return fileList;
  }

  const sourceFiles = getAllSourceFiles(CLIENT_DIR);

  sourceFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(CLIENT_DIR, filePath);

    let match;
    // Reset regex state
    CONFIG.usagePattern.lastIndex = 0;

    while ((match = CONFIG.usagePattern.exec(content)) !== null) {
      const zValue = match[1];
      // Check if it's an arbitrary value (starts with [) or a raw number
      if (zValue.startsWith("[") || !isNaN(parseInt(zValue))) {
        if (zValue.startsWith("[")) {
          console.error(`❌ Arbitrary Z-Index detected in ${relativePath}: z-${zValue}`);
          hasErrors = true;
        }
      }
    }
  });

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("✅ CSS Contract Verified");
    process.exit(0);
  }
}

main();
