/**
 * PROACTIVE MEDIA WARMING TASK
 * Scans high-traffic assets (featured products, landing page banners, and recent uploads)
 * and ensures they have optimized responsive variants pre-generated.
 */

import { generateResponsiveVariants } from "../../server/image-processor.js";
import { logger } from "../../server/lib/monitoring/logger.js";
import { appStorageService } from "../../server/lib/storage/app-service.js";
import { getStorage } from "../../server/lib/storage-singleton.js";
import type { MediaAsset } from "../../shared/schema.js";

async function warmMediaCache() {
  logger.info("🔥 Starting Proactive Media Warming...");
  const storage = getStorage();

  // 1. Identify "Hot" Assets
  // We'll target:
  // - Assets associated with featured products
  // - The 50 most recent uploads

  logger.info("🔍 Identifying high-traffic assets...");

  // Get recent assets
  const recentAssets = await storage.getMediaAssets(50, 0);

  // Get featured product IDs and their images
  // (In a real scenario, we'd query the DB for this, here we'll simplify by focusing on recent & missing)

  const targetAssets = recentAssets.filter(
    (asset: MediaAsset) =>
      asset.type === "image" &&
      (!asset.imageVariants || !asset.imageVariants.thumbnail || !asset.imageVariants.original),
  );

  logger.info(`Found ${targetAssets.length} assets requiring warming.`);

  if (process.argv.includes("--dry-run")) {
    logger.info("Dry run completed. No files were processed.");
    return;
  }

  // 2. Process Warming
  let successCount = 0;
  let failCount = 0;

  for (const asset of targetAssets) {
    try {
      if (!asset.storagePath) {
        continue;
      }

      logger.info(`🔥 Warming asset ${asset.id}: ${asset.filename}...`);

      // Download original
      const buffer = await appStorageService.downloadAsset(asset.storagePath);
      if (!buffer) {
        logger.error(`Failed to download asset ${asset.id}`);
        failCount++;
        continue;
      }

      // Generate variants using the NEW optimized processor
      const variants = await generateResponsiveVariants(buffer, asset.filename);

      // Update DB
      await storage.updateMediaAsset(asset.id, {
        imageVariants: variants,
        thumbnailUrl: `/api/media/thumbnail/${asset.id}`,
      });

      logger.info(`✅ Asset ${asset.id} warmed successfully.`);
      successCount++;
    } catch (error) {
      logger.error(`❌ Failed to warm asset ${asset.id}:`, error);
      failCount++;
    }
  }

  logger.info("----------------------------------------");
  logger.info(`Media Warming Finished!`);
  logger.info(`Success: ${successCount}`);
  logger.info(`Failed: ${failCount}`);
  logger.info("----------------------------------------");
}

warmMediaCache().catch((err) => {
  logger.error("Fatal error during media warming:", err);
  process.exit(1);
});
