/**
 * verify-no-sourcemaps.ts
 * Scans the dist/ directory to ensure:
 * 1. No .map files exist (or if they do, they are not referenced).
 * 2. No sourceMappingURL comments exist in .js files.
 * 3. No HTML files reference .map files.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "../dist/public");

// Exit if dist doesn't exist (e.g. pre-build) - CI should build first.
if (!fs.existsSync(DIST_DIR)) {
  console.error("❌ dist directory not found. Run 'npm run build' first.");
  process.exit(1);
}

let violations = 0;

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath);

  // 1. Log .map files presence but DO NOT FAIL (they are needed for Sentry, but hidden from client)
  if (ext === ".map") {
    // console.log(`ℹ️  Found sourcemap artifact (Expected): ${path.relative(DIST_DIR, filePath)}`);
    return;
  }

  // 3. Check HTML for references
  if (ext === ".html") {
    if (content.includes(".map")) {
      console.error(`❌ Found .map reference in HTML: ${path.relative(DIST_DIR, filePath)}`);
      violations++;
    }
  }

  // 2. Check JS/CSS for sourceMappingURL comments
  if (ext === ".js" || ext === ".css") {
    if (content.includes("sourceMappingURL=")) {
      // Allow if it's explicitly set to valid hidden usage (rare), but typically we block it.
      // Vite hidden sourcemap should NOT emit the comment.
      console.error(`❌ Found sourceMappingURL in: ${path.relative(DIST_DIR, filePath)}`);
      // Print context
      const lines = content.split("\n");
      const lineIdx = lines.findIndex((l) => l.includes("sourceMappingURL="));
      if (lineIdx !== -1) {
        console.error(`   Line ${lineIdx + 1}: ${lines[lineIdx].substring(0, 100)}...`);
      }
      violations++;
    }
  }
}

console.log("🔍 Scanning dist/ directory for sourcemap leaks...");
scanDir(DIST_DIR);

if (violations > 0) {
  console.error(`\n❌ Validation Failed: ${violations} sourcemap violations found.`);
  process.exit(1);
} else {
  console.log("\n✅ Validation Passed: No exposed sourcemaps found.");
  process.exit(0);
}
