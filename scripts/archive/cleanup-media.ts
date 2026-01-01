import { eq, sql } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { logger } from "../server/lib/smart-logger.js";
import {
  aboutHero,
  aboutTimelineEntries,
  categories,
  fabrics,
  homepageHero,
  homepageSections,
  mediaAssets,
  products,
} from "../shared/schema.js";

async function cleanupMedia() {
  logger.info("🗑️ Starting complete media cleanup...");

  try {
    // 1. Nullify references in related tables
    logger.info("1️⃣ Nullifying references in related tables...");

    // Categories
    await db.update(categories).set({ primaryImageId: null });
    logger.info("   - Cleared categories.primaryImageId");

    // Products
    await db.update(products).set({
      primaryImageId: null,
      primaryVideoId: null,
      modelFileId: null,
      imageIds: [],
      videos: [],
    });
    logger.info("   - Cleared products media references");

    // Fabrics
    await db.update(fabrics).set({ visualSwatchId: null });
    logger.info("   - Cleared fabrics.visualSwatchId");

    // Homepage Hero
    await db.update(homepageHero).set({
      backgroundImageId: null,
    });
    logger.info("   - Cleared homepageHero media references");

    // Unified sustainability references
    await db
      .update(homepageSections)
      .set({
        data: sql`jsonb_set(data, '{mediaIds}', '[]'::jsonb)`,
      })
      .where(eq(homepageSections.sectionType, "sustainability"));
    logger.info("   - Cleared homepageSustainability.imageId");

    // About Hero
    await db.update(aboutHero).set({
      imageId: null,
      videoId: null,
      backgroundMediaId: null,
    });
    logger.info("   - Cleared aboutHero media references");

    // About Timeline Entries
    await db.update(aboutTimelineEntries).set({ imageId: null });
    logger.info("   - Cleared aboutTimelineEntries.imageId");

    // 2. Delete all media assets from database
    logger.info("2️⃣ Deleting all media assets from database...");
    await db.delete(mediaAssets);
    logger.info("   - Deleted all records from media_assets table");

    // 3. Delete all files from GCS
    logger.info("3️⃣ Deleting all files from GCS bucket...");
    const bucketName = appStorageService.getBucketName();
    if (!bucketName) {
      logger.warn("   ⚠️ GCS_BUCKET_NAME not set, skipping bucket cleanup");
    } else {
      try {
        const files = await appStorageService.listAssets();
        logger.info(`   - Found ${files.length} files in bucket ${bucketName}`);

        if (files.length > 0) {
          let deletedCount = 0;
          // Delete in batches of 10 to avoid overwhelming
          const batchSize = 10;
          for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            await Promise.all(batch.map((file: string) => appStorageService.deleteAsset(file)));
            deletedCount += batch.length;
            if (deletedCount % 50 === 0) {
              logger.info(`   - Deleted ${deletedCount}/${files.length} files...`);
            }
          }
          logger.info(`   - Successfully deleted ${deletedCount} files from GCS`);
        }
      } catch (err) {
        logger.error("   ❌ Failed to clean up GCS bucket:", err);
      }
    }

    logger.info("✅ Media cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Media cleanup failed:", error);
    process.exit(1);
  }
}

cleanupMedia();
