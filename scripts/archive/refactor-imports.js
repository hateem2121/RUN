const fs = require("fs");
const path = require("path");

// Map of old file paths (relative to server root) to new file paths
const moveMap = {
  // DB
  "migration-service.ts": "lib/db/migration-service.ts",
  "migration-utilities.ts": "lib/db/migration-utilities.ts",
  "relationship-queries.ts": "lib/db/relationship-queries.ts",
  "lib/database-keep-alive.ts": "lib/db/keep-alive.ts",
  "lib/db-circuit-breaker.ts": "lib/db/circuit-breaker.ts",
  "lib/db-retry.ts": "lib/db/retry.ts",
  "lib/db-schema-validator.ts": "lib/db/schema-validator.ts",
  "lib/db-with-timeout.ts": "lib/db/with-timeout.ts",
  "lib/query-performance-monitor.ts": "lib/db/query-performance.ts",

  // Auth
  "googleAuth.ts": "lib/auth/google.ts",

  // Storage
  "storage.ts": "lib/storage/core.ts",
  "app-storage-service.ts": "lib/storage/app-service.ts",
  "multer-optimized.ts": "lib/storage/multer.ts",
  "image-processor.ts": "lib/storage/image-processor.ts",
  "lib/postgresql-direct-storage.ts": "lib/storage/postgresql-direct.ts",
  "lib/storage-lifecycle-scheduler.ts": "lib/storage/lifecycle-scheduler.ts",
  "lib/storage-singleton.ts": "lib/storage/singleton.ts",
  "lib/upload-config.ts": "lib/storage/upload-config.ts",
  "lib/gltf-processor.ts": "lib/storage/processing/gltf.ts",
  "lib/image-optimizer.ts": "lib/storage/processing/image.ts",
  "lib/media-utils.ts": "lib/storage/processing/media-utils.ts",

  // Cache
  "lib/cache-events.ts": "lib/cache/events.ts",
  "lib/cache-keys.ts": "lib/cache/keys.ts",
  "lib/cache-strategies.ts": "lib/cache/strategies.ts",
  "lib/cache-warmup-registry.ts": "lib/cache/warmup-registry.ts",
  "lib/unified-cache.ts": "lib/cache/unified.ts",
  "lib/unified-memory-cache.ts": "lib/cache/unified-memory.ts",
  "lib/two-tier-batch-cache.ts": "lib/cache/two-tier-batch.ts",
  "lib/upstash-client.ts": "lib/cache/upstash-client.ts",
  "lib/admin-cache.ts": "lib/cache/admin-cache.ts",

  // Monitoring
  "security-scanner.ts": "lib/monitoring/security-scanner.ts",
  "lib/smart-logger.ts": "lib/monitoring/logger.ts",
  "lib/alert-manager.ts": "lib/monitoring/alert-manager.ts",
  "lib/error-aggregator.ts": "lib/monitoring/error-aggregator.ts",
  "lib/http-metrics-tracker.ts": "lib/monitoring/http-metrics.ts",
  "lib/performance-monitor.ts": "lib/monitoring/performance.ts",
  "lib/prometheus.ts": "lib/monitoring/prometheus.ts",
  "lib/sentry.ts": "lib/monitoring/sentry.ts",
  "lib/otel.ts": "lib/monitoring/otel.ts",

  // Email
  "lib/email-service.ts": "lib/email/service.ts",
  "lib/admin-notifier.ts": "lib/email/admin-notifier.ts",

  // Core
  "utils.ts": "lib/core/utils.ts",
  "lib/slug-utils.ts": "lib/core/slug.ts",
  "lib/version.ts": "lib/core/version.ts",
  "lib/vite-manifest.ts": "lib/core/vite-manifest.ts",
  "lib/workflow-automation.ts": "lib/core/workflow.ts",

  // API
  "lib/api-rate-limiter.ts": "lib/api/rate-limiter.ts",
  "lib/rate-limiter.ts": "lib/api/rate-limiter-base.ts",
  "lib/request-queue-manager.ts": "lib/api/request-queue-manager.ts",
  "lib/request-timeout.ts": "lib/api/request-timeout.ts",
  "lib/response.ts": "lib/api/response.ts",
};

// Configuration
const rootDir = path.resolve(__dirname, "../server");
const USE_ESM_EXTENSIONS = true; // Force .js extensions for imports

console.log(`Starting import refactor in: ${rootDir}`);

// Helper: Get all files
function getAllFiles(dir, extns) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (
          file !== "node_modules" &&
          file !== ".git" &&
          file !== "dist" &&
          file !== "build" &&
          file !== "coverage"
        ) {
          results = results.concat(getAllFiles(filePath, extns));
        }
      } else {
        if (extns.some((ext) => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    });
  } catch (err) {
    console.error(`Error reading ${dir}: ${err.message}`);
  }
  return results;
}

// 1. Build Source -> Target Map
const sourceToTargetMap = {}; // oldAbsolutePath (resolved) -> newAbsolutePath (resolved)
const repoDirOld = path.resolve(rootDir, "lib/repositories");
const repoDirNew = path.resolve(rootDir, "lib/db/repositories");

Object.keys(moveMap).forEach((key) => {
  // Key is relative to server root
  // IMPORTANT: dealing with files that MIGHT HAVE MOVED already.
  // However, the import string in code refers to the OLD location (or relative to it).
  // We strictly map "Where it WAS" -> "Where it IS NOW".

  // For 'storage.ts', it was at server/storage.ts.
  // If I import "./storage" from server/index.ts, I resolve index.ts dir + ./storage -> server/storage.ts.
  // That matches sourceToTargetMap key.

  const oldAbs = path.resolve(rootDir, key);
  const newAbs = path.resolve(rootDir, moveMap[key]);
  sourceToTargetMap[oldAbs] = newAbs;
});

// 2. Scan and Replace
const files = getAllFiles(rootDir, [".ts", ".tsx", ".js"]);
console.log(`Scanning ${files.length} files...`);

let updatedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  // Regex must handle: import ... from 'source'
  const importRegex =
    /(import\s+.*?from\s+['"])(.*?)(['"])|(export\s+.*?from\s+['"])(.*?)(['"])|(require\(['"])(.*?)(['"])/g;

  content = content.replace(importRegex, (match, ...args) => {
    // args structure depends on which group matched
    // p1, p2, p3 for import
    // p4, p5, p6 for export
    // p7, p8, p9 for require
    const prefix = args[0] || args[3] || args[6];
    const importPath = args[1] || args[4] || args[7];
    const quote = args[2] || args[5] || args[8];

    if (!importPath || !prefix) return match;
    if (!importPath.startsWith(".")) return match; // Only relative imports

    // Resolve import path to absolute based on CURRENT file location
    // Note: The file we are reading IS at its new location if it was moved.
    // So 'path.dirname(file)' is the correct base for resolution.

    // However, the import path string is outdated. It points to where the file USED TO BE (relative to where the file USED TO BE).
    // WAIT. If I moved 'server/utils.ts' to 'server/lib/core/utils.ts'.
    // And 'server/utils.ts' had 'import ./storage'.
    // Now 'server/lib/core/utils.ts' still has 'import ./storage'.
    // Resolution: 'server/lib/core/storage'. This doesn't exist and never did.
    // The original meant 'server/storage'.

    // CORRECT LOGIC:
    // We need to know where the current file 'file' WAS before the move to correctly resolve the old relative import.
    // OR, simpler approach:
    // We assume the code imports are pointing to the OLD structure.
    // But since we moved the file itself, the relative path is now nonsense if resolved against new location.

    // To fix this correctly without tracking every file's old location:
    // We can rely on the fact that we know the unique filenames or specific known import patterns.
    // BUT generically?

    // Let's invert the map for "Target -> Source" to find where 'file' came from.
    // Then resolve the import against that old source location.
    // Then checks if the resolved target matches a moved file.

    const targetToSourceMap = {};
    Object.keys(sourceToTargetMap).forEach((k) => (targetToSourceMap[sourceToTargetMap[k]] = k));

    // Did 'file' move?
    const oldFileLoc = targetToSourceMap[file] || file;
    const oldFileDir = path.dirname(oldFileLoc);

    // Now resolve the import string against the OLD file directory
    const resolvedOldImport = path.resolve(oldFileDir, importPath);

    // Now check if 'resolvedOldImport' is one of the files that moved
    let newAbsTarget = sourceToTargetMap[resolvedOldImport];

    // Try extensions
    if (!newAbsTarget) newAbsTarget = sourceToTargetMap[resolvedOldImport + ".ts"];
    if (!newAbsTarget) newAbsTarget = sourceToTargetMap[resolvedOldImport + ".js"];
    if (!newAbsTarget) newAbsTarget = sourceToTargetMap[resolvedOldImport + "/index.ts"];

    // Function moved to subdir? (Repositories special case)
    if (!newAbsTarget && resolvedOldImport.startsWith(repoDirOld)) {
      const rel = path.relative(repoDirOld, resolvedOldImport);
      newAbsTarget = path.join(repoDirNew, rel);
    }

    // If we didn't find a move record, verify if it's a valid file that DIDN'T move but we need to update relative path because WE moved.
    // Case: Moved 'server/utils.ts' -> 'server/lib/core/utils.ts'.
    // Import 'import { db } from "./db.ts"' (referring to server/db.ts which didn't move... wait, db.ts IS moving in plan? No 'server/db.ts' is NOT in move list).
    // 'server/db.ts' stays? Let's check plan.
    // Plan: "Move server/lib/db-*.ts", but "server/db.ts" is the connection file.
    // "server/db.ts" is NOT in moveMap.

    // So if utils.ts moved deeper, it needs to update imports to things that stayed put.
    const fileMoved = file !== oldFileLoc;
    let finalTargetParams = null; // The absolute path of the thing being imported (in its NEW location)

    if (newAbsTarget) {
      // The import target MOVED.
      finalTargetParams = newAbsTarget;
    } else {
      // The import target DID NOT move, but maybe WE moved.
      // If we moved, we must re-calculate path to the (static) target.
      if (fileMoved) {
        finalTargetParams = resolvedOldImport;
      }
    }

    if (finalTargetParams) {
      // Calculate new relative path from CURRENT file ('file') to 'finalTargetParams'
      let newRel = path.relative(path.dirname(file), finalTargetParams);
      if (!newRel.startsWith(".")) newRel = "./" + newRel;

      // Fix extension for ESM
      // If it ended in .ts, strip it. If USE_ESM_EXTENSIONS, add .js
      // If it was directory, add /index.js or keep as is?
      // Safest: match original style or enforce .js

      // Remove .ts extension if present in the calculated path
      if (newRel.endsWith(".ts")) newRel = newRel.substring(0, newRel.length - 3);

      // Add .js if enabled and not present
      if (USE_ESM_EXTENSIONS && !newRel.endsWith(".js")) {
        newRel += ".js";
      }

      if (importPath !== newRel) {
        changed = true;
        return `${prefix}${newRel}${quote}`;
      }
    }

    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
    updatedCount++;
    console.log(`Updated: ${path.relative(rootDir, file)}`);
  }
});

console.log(`Refactor complete. Updated ${updatedCount} files.`);
