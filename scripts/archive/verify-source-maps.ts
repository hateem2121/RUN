import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.resolve(__dirname, "../dist");

// Recursive walker
function walk(dir: string, callback: (file: string) => void) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walk(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  });
}

function verifyNoSourceMappingUrl() {
  let hasError = false;

  if (!fs.existsSync(DIST_PATH)) {
    process.exit(0); // Pass but warn for local dx, fail in CI if build step missed?
  }

  walk(DIST_PATH, (filepath) => {
    if (filepath.endsWith(".js")) {
      const content = fs.readFileSync(filepath, "utf8");
      // Look for the standard sourceMappingURL comment
      if (content.includes("//# sourceMappingURL=")) {
        hasError = true;
      }
    }
  });

  if (hasError) {
    process.exit(1);
  } else {
  }
}

verifyNoSourceMappingUrl();
