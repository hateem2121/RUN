/**
 * Tailwind v4 CSS Import Order Guardrail
 *
 * Validates that @import "tailwindcss" appears BEFORE any legacy CSS imports
 * in index.css. This prevents cascade layer regressions where legacy styles
 * would have higher priority than Tailwind utilities.
 *
 * Run: node scripts/lint-css-import-order.js
 * Exit code 0 = pass, 1 = fail
 */

import * as fs from "node:fs";
import * as path from "node:path";

const INDEX_CSS_PATH = path.resolve(process.cwd(), "client/src/index.css");

const LEGACY_IMPORTS = [
  "./styles/unified-media-theater.css",
  "./styles/map-animations.css",
  "./styles/media-library-optimized.css",
  "./styles/performance-optimizations.css",
  "./styles/responsive-media-library.css",
  "./styles/webgl-pointer-events.css",
  "./styles/mobile-optimizations.css",
];

function validateCssImportOrder(): { valid: boolean; issues: string[] } {
  const content = fs.readFileSync(INDEX_CSS_PATH, "utf-8");
  const lines = content.split("\n");
  const issues: string[] = [];

  let tailwindImportLine = -1;
  const legacyImportLines: { file: string; line: number }[] = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Find @import "tailwindcss"
    if (trimmed.includes('@import "tailwindcss"') || trimmed.includes("@import 'tailwindcss'")) {
      tailwindImportLine = lineNum;
    }

    // Find legacy imports
    for (const legacy of LEGACY_IMPORTS) {
      if (trimmed.includes(legacy)) {
        legacyImportLines.push({ file: legacy, line: lineNum });
      }
    }
  });

  // Check 1: Tailwind import must exist
  if (tailwindImportLine === -1) {
    issues.push('❌ @import "tailwindcss" not found in index.css');
  }

  // Check 2: No legacy imports before Tailwind
  for (const legacy of legacyImportLines) {
    if (legacy.line < tailwindImportLine) {
      issues.push(
        `❌ Legacy import "${legacy.file}" (line ${legacy.line}) appears BEFORE @import "tailwindcss" (line ${tailwindImportLine})`,
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Run validation
console.log("🔍 Validating CSS import order for Tailwind v4...\n");
const result = validateCssImportOrder();

if (result.valid) {
  console.log("✅ CSS import order is correct.");
  console.log('   @import "tailwindcss" appears before all legacy imports.');
  process.exit(0);
} else {
  console.error("CSS Import Order Violations:");
  result.issues.forEach((issue) => console.error(`  ${issue}`));
  console.error('\n💡 Fix: Move @import "tailwindcss" to the top of index.css');
  process.exit(1);
}
