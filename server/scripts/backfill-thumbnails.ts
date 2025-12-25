#!/usr/bin/env tsx

/**
 * EMERGENCY THUMBNAIL BACKFILL SCRIPT
 *
 * This script generates thumbnails for existing assets that have NULL thumbnailFilename.
 * It will immediately fix the 4-7 second load times for ~110 assets.
 *
 * Usage: npm run backfill-thumbnails
 */

import type { MediaAsset } from "../../shared/schema.js";
import { processImage } from "../image-processor.js";
import { storage } from "../storage.js";

// Concurrency control
const BATCH_SIZE = 5; // Process 5 assets at a time to avoid overwhelming the system
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

class ThumbnailBackfillService {
  private processedCount = 0;
  private errorCount = 0;
  private skippedCount = 0;
  private totalCount = 0;

  async run() {
    try {
      // Get all assets needing thumbnails
      const assetsNeedingThumbnails = await storage.getAssetsNeedingThumbnails();

      this.totalCount = assetsNeedingThumbnails.length;

      if (this.totalCount === 0) {
        return;
      }

      // Process in batches
      for (let i = 0; i < assetsNeedingThumbnails.length; i += BATCH_SIZE) {
        const batch = assetsNeedingThumbnails.slice(i, i + BATCH_SIZE);

        // Process batch concurrently
        await Promise.allSettled(batch.map((asset) => this.processAsset(asset)));

        // Progress report
        const _remaining =
          this.totalCount - this.processedCount - this.errorCount - this.skippedCount;

        // Delay between batches to be system-friendly
        if (i + BATCH_SIZE < assetsNeedingThumbnails.length) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }
    } catch (_error) {
      process.exit(1);
    }
  }

  private async processAsset(asset: MediaAsset) {
    try {
      // Skip non-images or SVGs
      if (asset.type !== "image" || asset.mimeType === "image/svg+xml") {
        this.skippedCount++;
        return;
      }

      // Download original asset
      const assetBuffer = await storage.downloadAssetBuffer(asset.id);

      if (!assetBuffer) {
        this.errorCount++;
        return;
      }
      const imageResult = await processImage(assetBuffer, asset.filename);

      if (!imageResult || !imageResult.thumbnailFilename) {
        this.errorCount++;
        return;
      }

      // Update database with thumbnail filename
      await storage.updateAssetThumbnail(asset.id, imageResult.thumbnailFilename);
      this.processedCount++;
    } catch (_error) {
      this.errorCount++;
    }
  }
}

// Run the backfill if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const backfillService = new ThumbnailBackfillService();
  backfillService.run().catch(console.error);
}

export { ThumbnailBackfillService };
