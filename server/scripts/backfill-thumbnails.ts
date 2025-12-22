#!/usr/bin/env tsx

/**
 * EMERGENCY THUMBNAIL BACKFILL SCRIPT
 * 
 * This script generates thumbnails for existing assets that have NULL thumbnailFilename.
 * It will immediately fix the 4-7 second load times for ~110 assets.
 * 
 * Usage: npm run backfill-thumbnails
 */

import type { MediaAsset } from '../../shared/schema.js';
import { processImage } from '../image-processor.js';
import { storage } from '../storage.js';

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
      console.log('🚀 Starting thumbnail backfill process...');
      
      // Get all assets needing thumbnails
      const assetsNeedingThumbnails = await storage.getAssetsNeedingThumbnails();
      
      this.totalCount = assetsNeedingThumbnails.length;
      console.log(`📊 Found ${this.totalCount} assets needing thumbnails`);
      
      if (this.totalCount === 0) {
        console.log('✅ No assets need thumbnail generation');
        return;
      }

      // Process in batches
      for (let i = 0; i < assetsNeedingThumbnails.length; i += BATCH_SIZE) {
        const batch = assetsNeedingThumbnails.slice(i, i + BATCH_SIZE);
        
        console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(this.totalCount / BATCH_SIZE)} (${batch.length} assets)`);
        
        // Process batch concurrently
        await Promise.allSettled(
          batch.map(asset => this.processAsset(asset))
        );
        
        // Progress report
        const remaining = this.totalCount - this.processedCount - this.errorCount - this.skippedCount;
        console.log(`📈 Progress: ${this.processedCount} processed, ${this.errorCount} errors, ${this.skippedCount} skipped, ${remaining} remaining`);
        
        // Delay between batches to be system-friendly
        if (i + BATCH_SIZE < assetsNeedingThumbnails.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      // Final report
      console.log('\n🎉 Thumbnail backfill complete!');
      console.log(`✅ Successfully processed: ${this.processedCount}`);
      console.log(`❌ Errors: ${this.errorCount}`);
      console.log(`⏭️ Skipped: ${this.skippedCount}`);
      console.log(`📊 Total: ${this.totalCount}`);
      
    } catch (error) {
      console.error('💥 Backfill process failed:', error);
      process.exit(1);
    }
  }

  private async processAsset(asset: MediaAsset) {
    try {
      console.log(`🖼️ Processing asset ${asset.id}: ${asset.filename}`);
      
      // Skip non-images or SVGs
      if (asset.type !== 'image' || asset.mimeType === 'image/svg+xml') {
        console.log(`⏭️ Skipping ${asset.filename} (${asset.type}/${asset.mimeType})`);
        this.skippedCount++;
        return;
      }

      // Download original asset
      const assetBuffer = await storage.downloadAssetBuffer(asset.id);
      
      if (!assetBuffer) {
        console.log(`❌ Could not download ${asset.filename}`);
        this.errorCount++;
        return;
      }

      // Generate thumbnail using existing processImage function
      console.log(`📸 Generating thumbnail for ${asset.filename}...`);
      const imageResult = await processImage(assetBuffer, asset.filename);
      
      if (!imageResult || !imageResult.thumbnailFilename) {
        console.log(`❌ Thumbnail generation failed for ${asset.filename}`);
        this.errorCount++;
        return;
      }

      // Update database with thumbnail filename
      await storage.updateAssetThumbnail(asset.id, imageResult.thumbnailFilename);
      
      console.log(`✅ Generated thumbnail for ${asset.filename}: ${imageResult.thumbnailFilename}`);
      this.processedCount++;
      
    } catch (error) {
      console.error(`💥 Error processing asset ${asset.id} (${asset.filename}):`, error);
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