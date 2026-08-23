/**
 * CI Guard: Seed & Content Sanitization Verifier
 * Scans seed scripts, population utilities, and database content files
 * to ensure no test artifacts (TEST-*, QA-AUTO-*) are committed.
 *
 * Exit code 0 on success, 1 on failure.
 */

import fs from "node:fs";
import path from "node:path";

const filesToGuard = [
  "scripts/seed.ts",
  "server/db/seed-premium-content.sql",
  "server/routes/utilities/direct-postgres-population.ts",
  "server/routes/utilities/api-based-population.ts",
  "server/services/homepage.service.ts",
  "server/services/about.service.ts",
  "server/services/manufacturing.service.ts",
  "server/services/sustainability.service.ts",
  "server/services/technology.service.ts",
];

const FORBIDDEN_PATTERNS = [
  /TEST-UI-SYNC/i,
  /\[QA-AUTO/i,
  /QA-AUTO-\d+/i,
  /E2E-[A-Z]+-\d+/i,
  /TEST-[A-Z]+-\d+/i,
];

let violationsFound = 0;

for (const relPath of filesToGuard) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Ignore comments or regex definitions checking for patterns
    if (
      line.includes("FORBIDDEN_PATTERNS") ||
      line.includes("replace(") ||
      line.includes("cleanContent")
    ) {
      return;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        console.error(
          `❌ [CI Guard] Forbidden test pattern ${pattern} found in ${relPath}:${index + 1}`,
        );
        console.error(`   Line: ${line.trim()}`);
        violationsFound++;
      }
    }
  });
}

if (violationsFound > 0) {
  console.error(`\n❌ [CI Guard] Found ${violationsFound} seed fixture violations! Build failed.`);
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
} else {
  console.log(
    `✅ [CI Guard] All seed scripts & content fixtures are 100% clean of test artifacts.`,
  );
}
