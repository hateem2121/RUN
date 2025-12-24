import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  console.log(`[Security] 🔍 Scanning ${DIST_PATH} for exposed source maps...`);

  if (!fs.existsSync(DIST_PATH)) {
    console.warn(`[Security] ⚠️  Dist folder not found. Run build first.`);
    process.exit(0); // Pass but warn for local dx, fail in CI if build step missed?
  }

  walk(DIST_PATH, (filepath) => {
    if (filepath.endsWith(".js")) {
      const content = fs.readFileSync(filepath, "utf8");
      // Look for the standard sourceMappingURL comment
      if (content.includes("//# sourceMappingURL=")) {
        console.error(
          `[Security] ❌ Fail: Found visible source map reference in ${path.relative(
            process.cwd(),
            filepath,
          )}`,
        );
        hasError = true;
      }
    }
  });

  if (hasError) {
    console.error(
      `[Security] ❌ Source map verification failed. 'vite.config.ts' must use 'sourcemap: "hidden"'.`,
    );
    process.exit(1);
  } else {
    console.log(`[Security] ✅ Pass: No source map references found in build output.`);
  }
}

verifyNoSourceMappingUrl();
