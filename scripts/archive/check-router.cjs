/**
 * scripts/check-router.js
 *
 * Guardrail to prevent re-introduction of dual router artifacts.
 * Scans codebase for forbidden imports from @tanstack/react-router.
 */

const fs = require("node:fs");
const path = require("node:path");

const FORBIDDEN_IMPORTS = [
  "@tanstack/react-router",
  "@tanstack/router-devtools",
  "@tanstack/router-plugin",
];

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const EXCLUDE_DIRS = ["node_modules", "dist", ".git", "coverage"];

function scanDirectory(dir) {
  let errors = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        errors = errors.concat(scanDirectory(fullPath));
      }
    } else if (ALLOWED_EXTENSIONS.includes(path.extname(file))) {
      const content = fs.readFileSync(fullPath, "utf8");

      FORBIDDEN_IMPORTS.forEach((imp) => {
        if (content.includes(imp)) {
          // Double check it's an import statement
          if (
            content.match(new RegExp(`import.*from.*['"]${imp}['"]`)) ||
            content.match(new RegExp(`require\\(['"]${imp}['"]\\)`))
          ) {
            errors.push(`FORBIDDEN IMPORT found in ${fullPath}: ${imp}`);
          }
        }
      });
    }
  }
  return errors;
}
const rootDir = path.resolve(__dirname, "../client/src");
const errors = scanDirectory(rootDir);

if (errors.length > 0) {
  errors.forEach((_err) => {});
  process.exit(1);
} else {
  process.exit(0);
}
