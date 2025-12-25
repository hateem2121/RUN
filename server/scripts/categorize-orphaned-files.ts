import fs from "node:fs";

// import path from 'path';

// interface OrphanedFile {
//   path: string;
//   size?: number;
//   concern?: string;
//   reason?: string;
// }

interface VerifiedResult {
  path: string;
  status: "FALSE_POSITIVE" | "TRUE_ORPHAN" | "NEEDS_MANUAL_REVIEW";
  reason: string;
  size?: number;
}

interface CategorizedFiles {
  false_positives: VerifiedResult[];
  true_orphans_high_confidence: VerifiedResult[];
  true_orphans_medium_confidence: VerifiedResult[];
  needs_manual_review: VerifiedResult[];
  stats: {
    total: number;
    false_positives: number;
    true_orphans_high: number;
    true_orphans_medium: number;
    needs_review: number;
  };
}

async function categorizeOrphanedFiles() {
  // Read the verified JSON
  const verifiedData = JSON.parse(
    fs.readFileSync("server/docs/orphaned-files-verified.json", "utf-8"),
  );

  const result: CategorizedFiles = {
    false_positives: [],
    true_orphans_high_confidence: [],
    true_orphans_medium_confidence: [],
    needs_manual_review: [],
    stats: {
      total: 0,
      false_positives: 0,
      true_orphans_high: 0,
      true_orphans_medium: 0,
      needs_review: 0,
    },
  };

  // === PHASE 1: Add existing false positives ===
  result.false_positives = verifiedData.false_positives.map((fp: any) => ({
    path: fp.path,
    status: "FALSE_POSITIVE" as const,
    reason: `Imported via dynamic import: ${fp.imported_by.slice(0, 2).join(", ")}`,
  }));

  // === PHASE 2: Verify routes that were flagged as "needs_review" ===
  // These routes are KNOWN to be actively used (verified via grep on routes.ts and index.ts)
  const knownActiveRoutes = [
    "routes/accessories.ts",
    "routes/certificates.ts",
    "routes/fabrics.ts",
    "routes/folders.ts",
    "routes/materials.ts",
    "routes/size-charts.ts",
    "routes/content-management-routes.ts",
    "routes/page-content-routes.ts",
    "routes/operational-excellence.ts",
    "routes/api-utilities.ts",
    "middleware/production-error-handler.ts",
    "middleware/production-security.ts",
  ];

  // Extract from needs_review and mark as FALSE POSITIVES
  for (const file of verifiedData.needs_review) {
    if (knownActiveRoutes.includes(file.path)) {
      result.false_positives.push({
        path: file.path,
        status: "FALSE_POSITIVE",
        reason:
          "Registered via dynamic import in routes.ts or imported in index.ts (verified manually)",
      });
    } else {
      result.needs_manual_review.push({
        path: file.path,
        status: "NEEDS_MANUAL_REVIEW",
        reason: file.concern || "Requires manual verification",
      });
    }
  }

  // === PHASE 3: Categorize true orphans by confidence level ===
  const highConfidencePatterns = [
    /^components\/admin\/contact-management\//, // Old contact management UI (replaced)
    /^components\/admin\/sustainability\//, // Old sustainability UI (replaced)
    /^components\/contact\//, // Old contact components (replaced)
    /^components\/debug\//, // Debug utilities
    /^components\/performance\//, // Old performance trackers
    /^components\/data-comparison-tool\.tsx$/, // Utility tools
    /^components\/interactive-data-filter\.tsx$/,
    /^components\/BatchedMediaDemo\.tsx$/, // Demo files
    /^pages\/WebPDemo\.tsx$/,
    /^hooks\/resources\//, // Unused hook utilities
    /^hooks\/use-analytics\.ts$/,
    /^hooks\/use-bulk-download\.ts$/,
    /^hooks\/use-cloudinary-image\.ts$/,
    /^hooks\/use-local-storage\.ts$/,
    /^hooks\/use-media-operations\.ts$/,
    /^hooks\/use-memory-monitor\.ts$/,
    /^hooks\/use-theme\.ts$/,
    /^hooks\/useAdminNavigation\.ts$/,
    /^hooks\/useApiCache\.ts$/,
    /^hooks\/useGridDimensions\.ts$/,
    /^hooks\/usePerformanceOptimization\.ts$/,
    /^hooks\/useUnsavedChanges\.ts$/,
    /^hooks\/useUrlState\.ts$/,
    /^lib\/composition\.ts$/,
    /^lib\/final-certification-system\.ts$/,
    /^lib\/frontend-performance\.tsx$/,
    /^lib\/homepage-media-extractor\.ts$/,
    /^lib\/media-api-schemas\.ts$/,
    /^lib\/media-service\.ts$/,
    /^lib\/resolution-utils\.ts$/,
    /^lib\/scroll-progress-manager\.ts$/,
    /^lib\/three-singleton\.ts$/,
    /^utils\/resource-utils\.ts$/,
  ];

  const mediumConfidencePatterns = [
    /^components\/ui\/bento-cards\//, // Might be used in future
    /^components\/ui\/calendar\.tsx$/,
    /^components\/ui\/carousel\.tsx$/,
    /^components\/ui\/command\.tsx$/,
    /^components\/ui\/drawer\.tsx$/,
    /^components\/ui\/pagination\.tsx$/,
    /^components\/homepage\/.*-text\.tsx$/, // Alternative text animations
    /^components\/lazy-load-wrapper\.tsx$/,
    /^components\/skeleton-loaders\.tsx$/,
  ];

  for (const file of verifiedData.true_orphans) {
    const clientPath = `client/src/${file.path}`;
    const serverPath = `server/${file.path}`;

    // Check if file exists
    const fileExists = fs.existsSync(clientPath) || fs.existsSync(serverPath);

    if (!fileExists) {
      result.needs_manual_review.push({
        path: file.path,
        status: "NEEDS_MANUAL_REVIEW",
        reason: "File does not exist in filesystem (already deleted or path mismatch)",
        size: file.size,
      });
      continue;
    }

    // Categorize by confidence
    const isHighConfidence = highConfidencePatterns.some((pattern) => pattern.test(file.path));
    const isMediumConfidence = mediumConfidencePatterns.some((pattern) => pattern.test(file.path));

    if (isHighConfidence) {
      result.true_orphans_high_confidence.push({
        path: file.path,
        status: "TRUE_ORPHAN",
        reason: "HIGH confidence - Component/hook/lib replaced or never used",
        size: file.size,
      });
    } else if (isMediumConfidence) {
      result.true_orphans_medium_confidence.push({
        path: file.path,
        status: "TRUE_ORPHAN",
        reason: "MEDIUM confidence - UI component or utility potentially reusable",
        size: file.size,
      });
    } else {
      result.true_orphans_medium_confidence.push({
        path: file.path,
        status: "TRUE_ORPHAN",
        reason: "MEDIUM confidence - No clear pattern match",
        size: file.size,
      });
    }
  }

  // Calculate stats
  result.stats.total =
    verifiedData.false_positives.length +
    verifiedData.true_orphans.length +
    verifiedData.needs_review.length;
  result.stats.false_positives = result.false_positives.length;
  result.stats.true_orphans_high = result.true_orphans_high_confidence.length;
  result.stats.true_orphans_medium = result.true_orphans_medium_confidence.length;
  result.stats.needs_review = result.needs_manual_review.length;

  // Export results
  fs.writeFileSync("server/docs/orphaned-files-categorized.json", JSON.stringify(result, null, 2));

  // Calculate total size of safe-to-remove files
  const _highConfidenceSize = result.true_orphans_high_confidence.reduce(
    (sum, f) => sum + (f.size || 0),
    0,
  );
  const _mediumConfidenceSize = result.true_orphans_medium_confidence.reduce(
    (sum, f) => sum + (f.size || 0),
    0,
  );

  return result;
}

// Run categorization
categorizeOrphanedFiles()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
