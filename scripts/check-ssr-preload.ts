/**
 * SSR CSS Preload Sanity Check
 *
 * Validates that the server-rendered HTML contains:
 * 1. CSS preload links (rel="preload" as="style")
 * 2. CSS stylesheet links (rel="stylesheet")
 * 3. Preloads appear before stylesheets
 *
 * This prevents FOUC regressions if someone accidentally removes
 * the preload hints from ssr-handler.ts.
 *
 * Run: npx tsx scripts/check-ssr-preload.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";

interface CheckResult {
  valid: boolean;
  preloads: string[];
  stylesheets: string[];
  issues: string[];
}

async function checkSsrCssPreload(): Promise<CheckResult> {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();

  const issues: string[] = [];

  // Extract preload links
  const preloadRegex = /<link[^>]*rel="preload"[^>]*as="style"[^>]*>/gi;
  const preloads = html.match(preloadRegex) || [];

  // Extract stylesheet links
  const stylesheetRegex = /<link[^>]*rel="stylesheet"[^>]*>/gi;
  const stylesheets = html.match(stylesheetRegex) || [];

  // Check 1: Preloads exist
  if (preloads.length === 0) {
    issues.push("❌ No CSS preload hints found in SSR HTML");
  }

  // Check 2: Stylesheets exist
  if (stylesheets.length === 0) {
    issues.push("❌ No CSS stylesheet links found in SSR HTML");
  }

  // Check 3: Preloads appear before stylesheets (by checking positions in HTML)
  if (preloads.length > 0 && stylesheets.length > 0) {
    const firstPreloadPos = html.indexOf(preloads[0] || "");
    const firstStylesheetPos = html.indexOf(stylesheets[0] || "");

    if (firstPreloadPos > firstStylesheetPos) {
      issues.push("❌ CSS preload appears AFTER stylesheet (should be before for priority)");
    }
  }

  return {
    valid: issues.length === 0,
    preloads,
    stylesheets,
    issues,
  };
}

// Run check
async function main() {
  const strictMode = process.env.SSR_PRELOAD_STRICT === "1";

  console.log("🔍 Checking SSR CSS preload configuration...");
  console.log(`   Mode: ${strictMode ? "STRICT" : "Informational"}\n`);

  try {
    const result = await checkSsrCssPreload();

    console.log(`Found ${result.preloads.length} CSS preload(s)`);
    console.log(`Found ${result.stylesheets.length} CSS stylesheet(s)\n`);

    const hasStylesheets = result.stylesheets.length > 0;
    const hasPreloads = result.preloads.length > 0;

    if (strictMode) {
      if (result.valid) {
        console.log("✅ SSR CSS preload configuration is correct (strict).");
        process.exit(0);
      } else {
        console.error("SSR CSS Preload Issues (strict mode):");
        result.issues.forEach((issue) => console.error(`  ${issue}`));
        process.exit(1);
      }
    } else {
      if (hasStylesheets) {
        console.log("✅ SSR CSS configuration is functional.");
        if (!hasPreloads) {
          console.warn("⚠️  No preload hints (run with SSR_PRELOAD_STRICT=1 to enforce).");
        }
        process.exit(0);
      } else {
        console.error("❌ No CSS stylesheets found - FOUC risk!");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Failed to fetch SSR HTML:", error);
    process.exit(1);
  }
}

main();
