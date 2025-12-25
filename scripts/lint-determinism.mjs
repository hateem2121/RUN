import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "../client/src");

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const errors = [];

  // Simple heuristic: check for new Date() or Math.random() usage that looks like it's in render
  // This is not a full AST parser, just a quick check for obvious violations

  lines.forEach((line, idx) => {
    if (line.includes("// IGNORE_DETERMINISM")) return;

    const lineNum = idx + 1;

    // Check for Math.random()
    if (line.includes("Math.random()")) {
      // Allow if mapped to state/effect/event handler (heuristic: has 'useEffect' or 'Handler' or inside function definition usually indented)
      // But purely inside JSX or top level render is bad.
      // We'll stricter warn.
      if (
        !line.includes("useEffect") &&
        !line.includes("useCallback") &&
        !line.includes("onClick")
      ) {
        errors.push(`Line ${lineNum}: Potential non-deterministic Math.random() usage.`);
      }
    }

    // Check for new Date() without restriction
    // new Date().toISOString() in render causes mismatches
    if (line.includes("new Date(") && !line.includes("useEffect")) {
      if (line.match(/new Date\(\s*\)/)) {
        errors.push(`Line ${lineNum}: Potential non-deterministic new Date() usage.`);
      }
    }

    // Check for Date.now() / performance.now()
    if (
      (line.includes("Date.now()") || line.includes("performance.now()")) &&
      !line.match(/useEffect|useCallback|Handler|console\./)
    ) {
      errors.push(
        `Line ${lineNum}: Potential non-deterministic time access (Date.now/performance.now).`,
      );
    }

    // Check for window/document access in render (SSR unsafe)
    // Heuristic: if line has 'window.' or 'document.' but not in useEffect/event handler
    if (
      (line.includes("window.") || line.includes("document.")) &&
      !line.match(
        /useEffect|useLayoutEffect|useCallback|Handler|typeof window|typeof document|if \(window|if \(document/,
      )
    ) {
      // Exclude common safe patterns
      if (!line.includes("window.location.href") && !line.includes("open(")) {
        errors.push(`Line ${lineNum}: Potential unsafe window/document access in render.`);
      }
    }
  });

  return errors;
}

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat?.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
        files.push(fullPath);
      }
    }
  });
  return files;
}
const files = walk(ROOT_DIR);
let foundIssues = false;

files.forEach((f) => {
  const errors = scanFile(f);
  if (errors.length > 0) {
    foundIssues = true;
    errors.forEach((_e) => {});
  }
});

if (foundIssues) {
  process.exit(1);
} else {
  process.exit(0);
}
