/**
 * MEDIA VARIANT GENERATOR
 * Scans the media library and generates missing optimized variants for images.
 * This ensures 100/100 performance scores for all historically uploaded assets.
 */

import { generateResponsiveVariants } from "../../server/image-processor.js";
import { logger } from "../../server/lib/monitoring/logger.js";
import { appStorageService } from "../../server/lib/storage/app-service.js";
import { getStorage } from "../../server/lib/storage-singleton.js";
import type { MediaAsset } from "../../shared/schema.js";

async function runOptimization() {
  logger.info("🚀 Starting Media Library Optimization...");
  const storage = getStorage();

  // 1. Fetch all assets recursively
  const allAssets: MediaAsset[] = [];
  const pageSize = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await storage.getMediaAssets(pageSize, offset);
    allAssets.push(...batch);
    if (batch.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  logger.info(`Found ${allAssets.length} total assets. Scanning for unoptimized images...`);

  // 2. Identify unoptimized images
  const unoptimized = allAssets.filter(
    (asset) =>
      asset.type === "image" &&
      (!asset.imageVariants || !asset.imageVariants.thumbnail || !asset.imageVariants.original),
  );

  logger.info(`Found ${unoptimized.length} unoptimized images.`);

  if (process.argv.includes("--dry-run")) {
    logger.info("Dry run completed. No files were processed.");
    return;
  }

  // 3. Process each unoptimized image
  let successCount = 0;
  let failCount = 0;

  for (const asset of unoptimized) {
    try {
      if (!asset.storagePath) {
        logger.warn(`Skipping asset ${asset.id}: No storage path.`);
        continue;
      }

      logger.info(`Processing asset ${asset.id}: ${asset.filename}...`);

      // Download original buffer
      const buffer = await appStorageService.downloadAsset(asset.storagePath);

      if (!buffer) {
        logger.error(`Failed to download asset ${asset.id}`);
        failCount++;
        continue;
      }

      // Generate variants
      const variants = await generateResponsiveVariants(buffer, asset.filename);

      // Update DB
      await storage.updateMediaAsset(asset.id, {
        imageVariants: variants,
        thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
      });

      logger.info(`✅ Asset ${asset.id} optimized successfully.`);
      successCount++;
    } catch (error) {
      logger.error(`❌ Failed to optimize asset ${asset.id}:`, error);
      failCount++;
    }
  }

  logger.info("----------------------------------------");
  logger.info(`Optimization Finished!`);
  logger.info(`Success: ${successCount}`);
  logger.info(`Failed: ${failCount}`);
  logger.info("----------------------------------------");
}

runOptimization().catch((err) => {
  logger.error("Fatal error during optimization:", err);
  process.exit(1);
});
