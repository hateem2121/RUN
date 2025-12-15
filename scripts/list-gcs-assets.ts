import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
// import { mediaAssets } from '../shared/schema.js';
// import { inArray } from 'drizzle-orm';

async function listGCSAssets() {
  console.log("🔍 Listing assets in GCS bucket...");

  try {
    const bucketName = appStorageService.getBucketName();
    if (!bucketName) {
      console.error("❌ GCS_BUCKET_NAME is not set.");
      process.exit(1);
    }
    console.log(`📦 Bucket: ${bucketName}`);

    // List all files in the bucket
    const allFiles = await appStorageService.listAssets();
    console.log(`✅ Found ${allFiles.length} files in GCS.`);

    if (allFiles.length === 0) {
      console.log("⚠️ Bucket is empty.");
      return;
    }

    // Get all known storage paths from the database
    const dbAssets = await db.query.mediaAssets.findMany({
      columns: {
        storagePath: true,
      },
    });
    const knownPaths = new Set(dbAssets.map((a) => a.storagePath));
    console.log(`📊 Database has ${knownPaths.size} known media records.`);

    // Identify orphaned files
    const orphanedFiles = allFiles.filter((file) => !knownPaths.has(file));

    console.log(`\n👻 Found ${orphanedFiles.length} orphaned files (in GCS but not in DB):`);
    if (orphanedFiles.length > 0) {
      orphanedFiles.forEach((file) => console.log(` - ${file}`));
      console.log("\n💡 These files can be recovered.");
    } else {
      console.log("✅ No orphaned files found. Database and GCS are in sync.");
    }
  } catch (error) {
    console.error("❌ Failed to list assets:", error);
  } finally {
    process.exit(0);
  }
}

listGCSAssets();
