import { db } from "../server/db.js";
import { mediaAssets, products } from "../shared/schema.js";

async function resetMediaDB() {
  console.log("🔥 STARTING MEDIA DATABASE RESET...");
  console.log("⚠️  This will delete ALL media records and unlink products.");

  try {
    // 1. Unlink products
    console.log("🔗 Unlinking products from media...");
    await db.update(products).set({ primaryImageId: null });
    console.log("✅ Products unlinked.");

    // 2. Delete all media assets
    console.log("🗑️  Deleting media records...");
    await db.delete(mediaAssets);
    console.log("✅ Media assets table truncated.");

    // 3. Verify
    const count = await db.query.mediaAssets.findMany();
    if (count.length === 0) {
      console.log("✅ RESET COMPLETE. Database is clean.");
    } else {
      console.error(`❌ Reset failed. ${count.length} records remain.`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetMediaDB();
