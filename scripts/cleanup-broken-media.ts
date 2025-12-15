import { db } from "../server/db.js";
import { mediaAssets, products } from "../shared/schema.js";
import { inArray } from "drizzle-orm";

async function cleanupBrokenMedia() {
  console.log("🧹 Starting cleanup of broken media records...");

  try {
    // 1. Identify broken records (created by seed script on Nov 22)
    // We'll target records with specific filenames used in the seed script
    const seedFilenames = [
      "pro-running-shirt-navy.jpg",
      "elite-training-shorts-black.jpg",
      "compression-leggings-black.jpg",
      "premium-cotton-polo-white.jpg",
      "eco-fleece-hoodie-gray.jpg",
      "team-soccer-jersey.jpg",
      "basketball-practice-jersey.jpg",
      "all-weather-windbreaker.jpg",
      "corporate-polo-navy.jpg",
      "product-002.jpg",
      "product-003.jpg",
      "product-004.jpg",
      "product-005.jpg",
      "product-006.jpg",
      "product-007.jpg",
      "product-008.jpg",
      "product-009.jpg",
      "product-010.jpg",
      "product-001.jpg",
      "equipment-1.jpg",
      "equipment-2.jpg",
      "equipment-3.jpg",
      "equipment-4.jpg",
      "equipment-5.jpg",
      "sustainability-recycling.jpg",
    ];

    // Find IDs of assets to delete
    const assetsToDelete = await db.query.mediaAssets.findMany({
      where: inArray(mediaAssets.filename, seedFilenames),
      columns: {
        id: true,
        filename: true,
      },
    });

    if (assetsToDelete.length === 0) {
      console.log("✅ No broken seed records found.");
      return;
    }

    const idsToDelete = assetsToDelete.map((a) => a.id);
    console.log(`found ${idsToDelete.length} broken assets to delete.`);

    // 2. Unlink from products first to avoid foreign key constraint violations
    console.log("🔗 Unlinking products from broken media...");
    await db
      .update(products)
      .set({ primaryImageId: null })
      .where(inArray(products.primaryImageId, idsToDelete));

    // 3. Delete the media records
    console.log("🗑️ Deleting media records...");
    await db.delete(mediaAssets).where(inArray(mediaAssets.id, idsToDelete));

    console.log("✅ Cleanup complete. Broken records removed.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    process.exit(0);
  }
}

cleanupBrokenMedia();
