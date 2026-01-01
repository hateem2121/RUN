#!/usr/bin/env node
/**
 * Z-Index Lint Script
 * Enforces usage of semantic z-index utilities (z-dock, z-modal, z-popover, z-toast, z-max)
 * Flags high z-index values that bypass the semantic system.
 *
 * Usage: node scripts/lint-z-index.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const SEMANTIC_Z_INDEX_CLASSES = [
  "z-below",
  "z-default",
  "z-dock",
  "z-modal-backdrop",
  "z-modal",
  "z-popover",
  "z-toast",
  "z-max",
];

// Allow Tailwind's low z-index utilities (z-0 to z-40)
const _ALLOWED_NUMERIC_Z = /z-(?:[0-4]?\d)(?!\d)/;

// Flag high numeric z-index that bypasses semantic system
// Allow low values (z-[1] to z-[40]) for local stacking contexts
const PROBLEMATIC_Z_PATTERNS = [
  /z-(?:50|100|1000|9999|\d{4,})/, // High Tailwind values
  /z-\[(?:[5-9]\d{1,}|\d{3,})\]/, // Arbitrary values >= 50 (z-[50], z-[200], etc)
  /zIndex:\s*[5-9]\d{2,}/, // Inline style high values (>=500)
];

const IGNORE_DIRS = ["node_modules", "dist", ".git", "__snapshots__"];

function walkDir(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(fullPath, fileList);
      }
    } else {
      const ext = extname(file);
      if ([".tsx", ".jsx", ".ts", ".js", ".css"].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function lintFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  lines.forEach((line, idx) => {
    for (const pattern of PROBLEMATIC_Z_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Skip if line contains a semantic class as well (likely a comment or documentation)
        const hasSemantic = SEMANTIC_Z_INDEX_CLASSES.some((sc) => line.includes(sc));
        if (!hasSemantic) {
          issues.push({
            file: filePath,
            line: idx + 1,
            matched: match[0],
            content: line.trim().substring(0, 100),
          });
        }
      }
    }
  });

  return issues;
}

function main() {
  const srcDir = `${process.cwd()}/client/src`;

  console.log("🔍 Z-Index Lint: Scanning for high z-index values...\n");

  const files = walkDir(srcDir);
  let allIssues = [];

  for (const file of files) {
    const issues = lintFile(file);
    allIssues = allIssues.concat(issues);
  }

  if (allIssues.length === 0) {
    console.log("✅ No problematic z-index values found!\n");
    console.log("ℹ️  Semantic z-index utilities are being used correctly:");
    SEMANTIC_Z_INDEX_CLASSES.forEach((c) => console.log(`   - ${c}`));
    process.exit(0);
  } else {
    console.log(`⚠️  Found ${allIssues.length} potential z-index issues:\n`);
    allIssues.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    Found: ${issue.matched}`);
      console.log(`    Line: ${issue.content}...\n`);
    });
    console.log("💡 Consider using semantic z-index utilities:");
    console.log("   z-dock (50), z-modal (100), z-popover (150), z-toast (200), z-max (10001)\n");
    process.exit(1);
  }
}

main();
