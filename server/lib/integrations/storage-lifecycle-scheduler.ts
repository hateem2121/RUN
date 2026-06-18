/**
 * ============================================================================
 * STORAGE LIFECYCLE SCHEDULER
 * ============================================================================
 *
 * Implements application-level lifecycle policies for object storage.
 *
 * LIFECYCLE RULES (see config/storage-lifecycle-policy.yaml):
 * 1. Auto-delete temp uploads older than 24 hours
 * 2. (Optional) Transition old media to cold storage after 180 days
 * 3. (Optional) Clean up orphaned thumbnails
 *
 * WHY APPLICATION-LEVEL:
 * - Replit Object Storage doesn't currently support native lifecycle policies
 * - Application-level implementation provides fine-grained control
 * - Can integrate with database for validation (e.g., orphaned file detection)
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Runs in background thread (doesn't block main application)
 * - Batched operations to prevent memory issues
 * - Configurable intervals and batch sizes
 * - Metrics and monitoring built-in
 *
 * ============================================================================
 */

import { logger, serializeError } from "../monitoring/logger.js";
import { appStorageService } from "../storage/app-service.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

interface LifecycleConfig {
  enabled: boolean;
  interval: number; // milliseconds
  batchSize: number;
  maxDeletionsPerRun: number;
  dryRun: boolean;
  rules: {
    tempUploadsCleanup: {
      enabled: boolean;
      maxAgeHours: number;
    };
    orphanedFilesCleanup: {
      enabled: boolean;
      mediaDirectories: string[]; // Directories to scan for orphaned files
    };
  };
}

const DEFAULT_CONFIG: LifecycleConfig = {
  enabled: true,
  interval: 60 * 60 * 1000, // 1 hour
  batchSize: 100,
  maxDeletionsPerRun: 1000,
  dryRun: false,
  rules: {
    tempUploadsCleanup: {
      enabled: true,
      maxAgeHours: 24, // Delete temp files older than 24 hours
    },
    orphanedFilesCleanup: {
      enabled: true,
      mediaDirectories: ["public/media/", "public/thumbnails/"], // Scan both media and thumbnail directories with correct prefix
    },
  },
};

// ============================================================================
// METRICS
// ============================================================================

interface CleanupMetrics {
  totalRuns: number;
  totalFilesDeleted: number;
  totalStorageFreed: number; // bytes
  lastRunAt: Date | null;
  lastRunDuration: number; // milliseconds
  errors: number;
  runsInProgress: number;
}

const metrics: CleanupMetrics = {
  totalRuns: 0,
  totalFilesDeleted: 0,
  totalStorageFreed: 0,
  lastRunAt: null,
  lastRunDuration: 0,
  errors: 0,
  runsInProgress: 0,
};

// Report interface for API responses
interface CleanupReport {
  timestamp: string;
  orphanedFiles: string[]; // Files found but not deleted (if dryRun)
  brokenReferences: number[]; // Not implemented yet, placeholder
  cleanedFiles: string[]; // Files actually deleted
  cleanedReferences: number[]; // Not implemented yet, placeholder
  totalFilesScanned: number;
  totalReferencesChecked: number;
  spaceSaved: number;
  errors: string[];
}

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

/**
 * Clean up temporary upload chunks older than the specified age
 *
 * RULE: private/temp/uploads/* -> delete if age > 24 hours
 *
 * This prevents storage bloat from:
 * - Abandoned uploads (user closed browser)
 * - Failed chunked uploads (network errors)
 * - Orphaned chunks (finalization failed)
 *
 * NOTE: Temp uploads are in PRIVATE partition (never exposed to CDN)
 */
async function cleanupTempUploads(
  maxAgeHours: number,
  batchSize: number,
  maxDeletions: number,
  dryRun: boolean,
): Promise<{ deleted: number; freed: number; errors: number; filePaths: string[] }> {
  const PREFIX = "private/temp/uploads/";
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const cutoffTime = Date.now() - maxAgeMs;

  logger.info(
    `[Lifecycle] Starting temp uploads cleanup (maxAge: ${maxAgeHours}h, dryRun: ${dryRun})`,
  );

  let deleted = 0;
  let freed = 0;
  let errors = 0;

  try {
    // List all files with metadata in temp/uploads directory
    const allFiles = await appStorageService.listAssetsWithMetadata(PREFIX);

    if (allFiles.length === 0) {
      logger.info(`[Lifecycle] No temp upload files found`);
      return { deleted, freed, errors, filePaths: [] };
    }

    logger.info(`[Lifecycle] Found ${allFiles.length} temp upload files to check`);

    // Filter files older than cutoff time
    // Note: We parse the uploadId timestamp from the path
    // Format: media/temp/uploads/{timestamp}{random}/chunk-{n}
    const filesToDelete: { name: string; size: number }[] = [];

    for (const file of allFiles) {
      const filePath = file.name;
      // Extract upload ID from path: media/temp/uploads/{uploadId}/chunk-{n}
      const pathParts = filePath.split("/");
      if (pathParts.length >= 4 && pathParts[2] === "uploads") {
        const uploadId = pathParts[3];
        if (!uploadId) {
          continue;
        }

        // Upload IDs start with timestamp (see services.ts:initializeChunkedUpload)
        // Format: {timestamp}{random}
        const timestampStr = uploadId.substring(0, 13); // First 13 chars are millisecond timestamp
        const uploadTimestamp = parseInt(timestampStr, 10);

        if (!Number.isNaN(uploadTimestamp) && uploadTimestamp < cutoffTime) {
          filesToDelete.push({ name: filePath, size: file.size });

          // Respect batch size and max deletions limit
          if (filesToDelete.length >= Math.min(batchSize, maxDeletions)) {
            break;
          }
        }
      }
    }

    if (filesToDelete.length === 0) {
      logger.info(`[Lifecycle] No temp files older than ${maxAgeHours}h found`);
      return { deleted, freed, errors, filePaths: [] };
    }

    logger.info(`[Lifecycle] ${filesToDelete.length} temp files eligible for deletion`);

    // Delete files in batches
    for (const fileToDelete of filesToDelete) {
      const filePath = fileToDelete.name;
      try {
        if (dryRun) {
          logger.info(`[Lifecycle] [DRY RUN] Would delete: ${filePath}`);
        } else {
          deleted++;
          freed += fileToDelete.size; // FIXED [MD-113]: Use size from object

          if (deleted % 10 === 0) {
            logger.debug(`[Lifecycle] Deleted ${deleted}/${filesToDelete.length} files`);
          }
          await appStorageService.deleteAsset(filePath);
        }
      } catch (error) {
        errors++;
        logger.error(`[Lifecycle] Failed to delete ${filePath}:`, serializeError(error));
      }
    }

    return { deleted, freed, errors, filePaths: filesToDelete.map((f) => f.name) };
  } catch (error) {
    logger.error(`[Lifecycle] Temp uploads cleanup failed:`, serializeError(error));
    errors++;
    return { deleted, freed, errors, filePaths: [] };
  }
}

/**
 * Clean up orphaned files in Object Storage
 *
 * RULE: Delete files in Object Storage that don't have corresponding database records
 *
 * This prevents storage bloat from:
 * - Deleted database records (file not cleaned up)
 * - Failed upload operations (file uploaded but DB insert failed)
 * - Manual database deletions (file orphaned in storage)
 *
 * PROCESS:
 * 1. List all files in specified media directories (media/, thumbnails/)
 * 2. Query database for all storagePath values
 * 3. Find files that exist in storage but not in database
 * 4. Delete orphaned files with logging
 */
async function cleanupOrphanedFiles(
  directories: string[],
  maxDeletions: number,
  dryRun: boolean,
): Promise<{
  deleted: number;
  freed: number;
  errors: number;
  checked: number;
  orphanedFiles: string[];
}> {
  logger.info(
    `[Lifecycle] Starting orphaned files cleanup (directories: ${directories.join(", ")}, dryRun: ${dryRun})`,
  );

  let deleted = 0;
  let freed = 0;
  let errors = 0;
  let checked = 0;
  const orphanedFiles: string[] = [];

  try {
    // Import database access
    const { db } = await import("../../db.js");
    const { mediaAssets } = await import("../../../shared/index.js");
    const { sql } = await import("drizzle-orm");

    // 1. Get all storagePath values from database (including deleted records to be safe)
    const dbRecords = await db
      .select({ storagePath: mediaAssets.storagePath })
      .from(mediaAssets)
      .where(sql`${mediaAssets.storagePath} IS NOT NULL`);

    const dbStoragePaths = new Set(dbRecords.map((r) => r.storagePath));
    logger.info(`[Lifecycle] Found ${dbStoragePaths.size} storage paths in database`);

    // 2. Check each directory for orphaned files
    for (const directory of directories) {
      try {
        const allFiles = await appStorageService.listAssetsWithMetadata(directory);
        logger.info(`[Lifecycle] Found ${allFiles.length} files in ${directory}`);

        // 3. Find and delete orphaned files (exist in storage but not in database)
        // Process files in batches, continuing until we've checked all files or hit max deletions
        for (const file of allFiles) {
          const filePath = file.name;
          checked++;

          // Check if this file has a corresponding database record
          if (!dbStoragePaths.has(filePath)) {
            // Found an orphaned file
            orphanedFiles.push(filePath);
            try {
              if (dryRun) {
                logger.info(`[Lifecycle] [DRY RUN] Would delete orphaned file: ${filePath}`);
                deleted++; // Count dry-run deletions for limit enforcement
              } else {
                await appStorageService.deleteAsset(filePath);
                deleted++;
                freed += file.size; // FIXED [MD-113]: Use actual file size from metadata

                if (deleted % 10 === 0) {
                  logger.debug(`[Lifecycle] Deleted ${deleted} orphaned files`);
                }
              }
            } catch (error) {
              errors++;
              logger.error(
                `[Lifecycle] Failed to delete orphaned file ${filePath}:`,
                serializeError(error),
              );
            }

            // Stop if we've reached max deletions
            if (deleted >= maxDeletions) {
              logger.info(`[Lifecycle] Reached max deletions limit (${maxDeletions})`);
              break;
            }
          }
        }

        logger.info(
          `[Lifecycle] Processed ${directory}: ${deleted} orphaned files deleted (${checked} files checked)`,
        );
      } catch (error) {
        errors++;
        logger.error(
          `[Lifecycle] Failed to process directory ${directory}:`,
          serializeError(error),
        );
      }

      // Stop if we've reached max deletions
      if (deleted >= maxDeletions) {
        break;
      }
    }

    return { deleted, freed, errors, checked, orphanedFiles };
  } catch (error) {
    logger.error(`[Lifecycle] Orphaned files cleanup failed:`, serializeError(error));
    errors++;
    return { deleted, freed, errors, checked, orphanedFiles: [] };
  }
}

/**
 * Clean up orphaned upload sessions
 *
 * This complements the file cleanup by removing session metadata
 * for uploads that were never completed.
 */
async function cleanupOrphanedSessions(): Promise<void> {
  try {
    // The legacy uploadSessions Map has been deprecated.
    // Session management is now handled internally by MediaUploadService.
    // This function is kept for compatibility but is now a no-op.
    // MediaUploadService handles its own session cleanup via TTL-based expiry.
    logger.debug("[Lifecycle] Session cleanup delegated to MediaUploadService (no-op)");
  } catch (error) {
    logger.error(`[Lifecycle] Failed to cleanup orphaned sessions:`, serializeError(error));
  }
}

// ============================================================================
// SCHEDULER
// ============================================================================

class StorageLifecycleScheduler {
  private config: LifecycleConfig;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<LifecycleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info(`[Lifecycle] Scheduler initialized`, {
      enabled: this.config.enabled,
      interval: `${this.config.interval / 1000}s`,
      dryRun: this.config.dryRun,
    });
  }

  /**
   * Start the lifecycle scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      logger.info(`[Lifecycle] Scheduler disabled via configuration`);
      return;
    }

    if (this.timer) {
      logger.warn(`[Lifecycle] Scheduler already running`);
      return;
    }

    logger.info(`[Lifecycle] Starting scheduler (interval: ${this.config.interval}ms)`);

    // Run immediately on startup
    this.runCleanup().catch((error) => {
      logger.error(`[Lifecycle] Initial cleanup failed:`, serializeError(error));
    });

    // Then run periodically
    this.timer = setInterval(() => {
      this.runCleanup().catch((error) => {
        logger.error(`[Lifecycle] Scheduled cleanup failed:`, serializeError(error));
      });
    }, this.config.interval);

    logger.info(`[Lifecycle] Scheduler started successfully`);
  }

  /**
   * Stop the lifecycle scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info(`[Lifecycle] Scheduler stopped`);
    }
  }

  /**
   * Run cleanup tasks immediately
   */
  async runCleanup(overrideDryRun?: boolean): Promise<CleanupReport> {
    if (this.isRunning) {
      logger.warn(`[Lifecycle] Cleanup already in progress, skipping run`);
      return {
        timestamp: new Date().toISOString(),
        orphanedFiles: [],
        brokenReferences: [],
        cleanedFiles: [],
        cleanedReferences: [],
        totalFilesScanned: 0,
        totalReferencesChecked: 0,
        spaceSaved: 0,
        errors: ["Cleanup already in progress"],
      };
    }

    this.isRunning = true;
    metrics.runsInProgress++;
    const startTime = Date.now();
    const dryRun = overrideDryRun !== undefined ? overrideDryRun : this.config.dryRun;

    const report: CleanupReport = {
      timestamp: new Date().toISOString(),
      orphanedFiles: [],
      brokenReferences: [],
      cleanedFiles: [],
      cleanedReferences: [],
      totalFilesScanned: 0,
      totalReferencesChecked: 0,
      spaceSaved: 0,
      errors: [],
    };

    try {
      logger.info(`[Lifecycle] Starting cleanup run #${metrics.totalRuns + 1} (dryRun: ${dryRun})`);

      // Rule 1: Clean up temp uploads older than 24 hours
      if (this.config.rules.tempUploadsCleanup.enabled) {
        const result = await cleanupTempUploads(
          this.config.rules.tempUploadsCleanup.maxAgeHours,
          this.config.batchSize,
          this.config.maxDeletionsPerRun,
          dryRun,
        );

        metrics.totalFilesDeleted += dryRun ? 0 : result.deleted;
        metrics.totalStorageFreed += dryRun ? 0 : result.freed;
        metrics.errors += result.errors;

        if (dryRun) {
          report.orphanedFiles.push(...result.filePaths);
        } else {
          report.cleanedFiles.push(...result.filePaths);
          report.spaceSaved += result.freed;
        }
      }

      // Rule 2: Clean up orphaned files (files in storage without database records)
      if (this.config.rules.orphanedFilesCleanup.enabled) {
        const result = await cleanupOrphanedFiles(
          this.config.rules.orphanedFilesCleanup.mediaDirectories,
          this.config.maxDeletionsPerRun,
          dryRun,
        );

        metrics.totalFilesDeleted += dryRun ? 0 : result.deleted;
        metrics.totalStorageFreed += dryRun ? 0 : result.freed;
        metrics.errors += result.errors;

        report.totalFilesScanned += result.checked;
        if (dryRun) {
          report.orphanedFiles.push(...result.orphanedFiles);
        } else {
          report.cleanedFiles.push(...result.orphanedFiles);
          report.spaceSaved += result.freed;
        }
      }

      // Clean up orphaned session metadata
      await cleanupOrphanedSessions();

      // Update metrics
      metrics.totalRuns++;
      metrics.lastRunAt = new Date();
      metrics.lastRunDuration = Date.now() - startTime;

      logger.info(`[Lifecycle] Cleanup run complete`, {
        duration: `${metrics.lastRunDuration}ms`,
        totalFilesDeleted: dryRun ? 0 : metrics.totalFilesDeleted,
        totalStorageFreedMB: (metrics.totalStorageFreed / (1024 * 1024)).toFixed(2),
      });

      return report;
    } catch (error) {
      metrics.errors++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[Lifecycle] Cleanup run failed:`, serializeError(error));
      report.errors.push(errorMsg);
      return report;
    } finally {
      this.isRunning = false;
      metrics.runsInProgress--;
    }
  }

  /**
   * Get cleanup metrics
   */
  getMetrics(): CleanupMetrics {
    return { ...metrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LifecycleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info(`[Lifecycle] Configuration updated`, newConfig);

    // Restart if interval changed
    if (newConfig.interval && this.timer) {
      this.stop();
      this.start();
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let schedulerInstance: StorageLifecycleScheduler | null = null;

export function getLifecycleScheduler(
  config?: Partial<LifecycleConfig>,
): StorageLifecycleScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new StorageLifecycleScheduler(config);
  }
  return schedulerInstance;
}
