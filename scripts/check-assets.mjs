import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const REQUIRED_ASSETS = [
  // Source text fonts
  "client/public/fonts/NeueStance-Regular.ttf",
];

// Also scan these directories for any 0-byte files
const SCAN_DIRS = ["client/public", "dist/public", "dist/server"];

let hasError = false;

function checkFile(filePath) {
  const fullPath = path.resolve(root, filePath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  const stats = fs.statSync(fullPath);
  if (stats.size === 0) {
    return false;
  }
  return true;
}

function scanDir(dirRelative) {
  const dirPath = path.resolve(root, dirRelative);
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(entry.parentPath || entry.path, entry.name);
      const _relPath = path.relative(root, fullPath);
      const stats = fs.statSync(fullPath);

      // Check for fonts specifically to be strict
      if (/\.(ttf|woff|woff2|otf)$/i.test(entry.name)) {
        if (stats.size === 0) {
          hasError = true;
        }
      }
    }
  }
}

// 1. Check specific required source assets
REQUIRED_ASSETS.forEach((file) => {
  if (!checkFile(file)) hasError = true;
});

// 2. Scan directories for any corrupt fonts (source + dist)
SCAN_DIRS.forEach((dir) => {
  // Dist might not exist yet if check runs before build, that's fine/warn
  if (fs.existsSync(path.resolve(root, dir))) {
    scanDir(dir);
  }
});

if (hasError) {
  process.exit(1);
} else {
  process.exit(0);
}
