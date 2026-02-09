#!/usr/bin/env tsx
/**
 * Verify Documentation Structure Integrity
 *
 * Checks for deprecated path references (e.g., client/src) in documentation.
 * Scans docs/ and Markdown files in client/app/.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../../");
const DOCS_DIR = join(ROOT, "docs");
const CLIENT_APP_DIR = join(ROOT, "client/app");

const INVALID_PATTERNS = [
  { pattern: /client\/src/, message: "Use client/app instead of client/src" },
];

function getAllFiles(dir: string, extension: string): string[] {
  let results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat?.isDirectory()) {
        results = results.concat(getAllFiles(fullPath, extension));
      } else {
        if (file.endsWith(extension)) {
          results.push(fullPath);
        }
      }
    }
  } catch {
    // Error suppressed
  }
  return results;
}

function checkFile(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  let hasError = false;
  const lines = content.split("\n");

  lines.forEach((line, _index) => {
    for (const { pattern } of INVALID_PATTERNS) {
      if (pattern.test(line)) {
        hasError = true;
      }
    }
  });
  return hasError;
}

function main() {
  const docs = getAllFiles(DOCS_DIR, ".md").filter((path) => !path.includes("docs/archive"));
  const clientDocs = getAllFiles(CLIENT_APP_DIR, ".md");
  const allFiles = [...docs, ...clientDocs];

  let failed = false;
  for (const doc of allFiles) {
    if (checkFile(doc)) {
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
