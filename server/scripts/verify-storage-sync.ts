// @ts-nocheck
/**
 * Phase 5B Task 3: Database-Storage Sync Verification
 * Verifies all MediaAsset DB records have corresponding files in object storage
 */

import { isNull } from "drizzle-orm";
import { mediaAssets } from "../../shared/schemas";
import { appStorageService } from "../app-storage-service";
import { db } from "../db";
import { logger } from "../lib/smart-logger";

interface SyncResult {
  totalAssets: number;
  verified: number;
  missing: number;
  errors: number;
  missingFiles: Array<{
    id: number;
    filename: string;
    storagePath: string;
    bucketName: string;
    error?: string | undefined;
  }>;
}

async function verifyDatabaseStorageSync(): Promise<SyncResult> {
  logger.info("[Storage Sync] Starting database-storage verification...");

  const result: SyncResult = {
    totalAssets: 0,
    verified: 0,
    missing: 0,
    errors: 0,
    missingFiles: [],
  };

  try {
    // Query all active media assets
    const assets = await db
      .select({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        storagePath: mediaAssets.storagePath,
        bucketName: mediaAssets.bucketName,
        type: mediaAssets.type,
        fileSize: mediaAssets.fileSize,
      })
      .from(mediaAssets)
      .where(isNull(mediaAssets.deletedAt))
      .orderBy(mediaAssets.id);

    result.totalAssets = assets.length;
    logger.info(`[Storage Sync] Found ${assets.length} active media assets in database`);

    // Verify each asset exists in object storage
    for (const asset of assets) {
      try {
        logger.debug(`[Storage Sync] Checking: ${asset.storagePath}`);

        // Use fileExists to check if file exists in object storage
        const exists = await appStorageService.fileExists(asset.storagePath);

        if (exists) {
          result.verified++;
          logger.info(`✅ [Storage Sync] Verified: ${asset.storagePath} (ID: ${asset.id})`);
        } else {
          result.missing++;
          result.missingFiles.push({
            id: asset.id,
            filename: asset.filename,
            storagePath: asset.storagePath,
            bucketName: asset.bucketName,
          });
          logger.warn(`❌ [Storage Sync] MISSING: ${asset.storagePath} (ID: ${asset.id})`);
        }
      } catch (error) {
        result.errors++;
        result.missingFiles.push({
          id: asset.id,
          filename: asset.filename,
          storagePath: asset.storagePath,
          bucketName: asset.bucketName,
          error: (error as Error).message,
        });
        logger.error(
          `🚨 [Storage Sync] ERROR checking ${asset.storagePath} (ID: ${asset.id}):`,
          error,
        );
      }
    }

    // Log summary
    logger.info("[Storage Sync] ========================================");
    logger.info(`[Storage Sync] SUMMARY:`);
    logger.info(`[Storage Sync]   Total Assets: ${result.totalAssets}`);
    logger.info(`[Storage Sync]   Verified: ${result.verified}`);
    logger.info(`[Storage Sync]   Missing: ${result.missing}`);
    logger.info(`[Storage Sync]   Errors: ${result.errors}`);
    logger.info("[Storage Sync] ========================================");

    if (result.missingFiles.length > 0) {
      logger.warn("[Storage Sync] Missing/Error Files:");
      result.missingFiles.forEach((file) => {
        logger.warn(
          `  - ID ${file.id}: ${file.storagePath} ${file.error ? `(${file.error})` : ""}`,
        );
      });
    }

    return result;
  } catch (error) {
    logger.error("[Storage Sync] Fatal error during verification:", error);
    throw error;
  }
}

// Execute verification
verifyDatabaseStorageSync()
  .then((result) => {
    if (result.missing > 0 || result.errors > 0) {
      process.exit(1); // Exit with error code
    } else {
      process.exit(0);
    }
  })
  .catch((_error) => {
    process.exit(1);
  });
