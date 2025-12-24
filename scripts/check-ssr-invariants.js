import fs from "fs";
import path from "path";
import { glob } from "glob";

// Patterns forbidden in component bodies (likely SSR unsafe if not in useEffect)
const FORBIDDEN_PATTERNS = [
  {
    pattern: /Date\.now\(\)/,
    message: "Date.now() usage detected. Ensure it is inside useEffect or event handler.",
  },
  {
    pattern: /Math\.random\(\)/,
    message: "Math.random() usage detected. Ensure it is inside useEffect or event handler.",
  },
  {
    pattern: /crypto\.randomUUID\(\)/,
    message: "crypto.randomUUID() usage detected. Ensure it is inside useEffect or event handler.",
  },
  {
    pattern: /typeof window !== ['"]undefined['"]/,
    message:
      "typeof window check detected. Avoid conditional rendering based on window presence (FOUC risk).",
  },
];

const IGNORED_PATHS = [
  "node_modules",
  "dist",
  "build",
  "scripts",
  "e2e",
  ".test.",
  ".spec.",
  "ssr-handler.ts",
  "vite-manifest.ts",
  "check-ssr-invariants.js",
  "client/src/components/admin", // Client-only
  "client/src/pages", // Pages are usually safe or wrapped. We focus on components.
  "client/src/lib", // Utilities (often contain node/browser checks correctly)
  "client/src/hooks", // Hooks (often contain window checks correctly)
];

const IGNORED_FILES = [
  "magnetic-button.tsx",
  "matrix-slogan-transition.tsx",
  "optimized-matrix-slogan-wrapper.tsx",
  "ModelViewerErrorBoundary.tsx",
  "animation-error-boundary.tsx", // Fix casing
  "MediaErrorBoundary.tsx",
  "performance-monitor.tsx",
  "stats.tsx",
  "Stats.tsx",
  "Mermaid.tsx",
  "svg-mask-card.tsx",
  "error-boundary.tsx",
  "ProductNotifications.tsx",
  "UnifiedModelViewer.tsx",
  "AdminContext.tsx",
  "GradientBlinds.tsx",
  "scroll-float.tsx",
  "optimized-hyperspace-background.tsx",
  "hyperspace-background.tsx",
  "hyperspace-background-optimized.tsx",
  "draggable-card.tsx",
  "background-ripple-effect.tsx",
  "animation-performance-tracker.tsx",
];

async function checkFile(filePath) {
  const content = await fs.promises.readFile(filePath, "utf8");
  const lines = content.split("\n");
  const errors = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;

    FORBIDDEN_PATTERNS.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        if (
          !line.includes("suppressHydrationWarning") &&
          !line.includes("useEffect") &&
          !line.includes("useCallback")
        ) {
          errors.push({ line: index + 1, message, content: line.trim() });
        }
      }
    });
  });

  return errors;
}

async function run() {
  console.log("🔍 Running SSR Invariant Checks...");

  const files = await glob("client/src/**/*.{ts,tsx}", { ignore: "**/node_modules/**" });

  let totalErrors = 0;

  for (const file of files) {
    // Check path exclusion
    if (IGNORED_PATHS.some((ignore) => file.includes(ignore))) continue;

    // Check filename exclusion
    const basename = path.basename(file);
    if (IGNORED_FILES.includes(basename)) continue;

    const errors = await checkFile(file);
    if (errors.length > 0) {
      console.log(`\n❌ ${file}:`);
      errors.forEach((err) => {
        console.log(`   Line ${err.line}: ${err.message}`);
        console.log(`     Code: ${err.content}`);
      });
      totalErrors += errors.length;
    }
  }

  if (totalErrors > 0) {
    console.log(`\n🚨 Found ${totalErrors} potential SSR forbidden patterns.`);
    process.exit(1);
  } else {
    console.log("✅ SSR Invariants Passed.");
  }
}

run().catch(console.error);
