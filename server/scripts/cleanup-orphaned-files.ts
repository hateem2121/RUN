import { appStorageService } from "../app-storage-service.js";
import { getStorage } from "../lib/storage-singleton.js";

async function cleanupOrphanedFiles() {
  console.log("🧹 Starting orphaned files cleanup...\n");
  
  const storage = getStorage();
  
  // Get all files from object storage
  console.log("📂 Fetching all object storage files...");
  const storageFiles = await appStorageService.listAssets();
  console.log(`   Found ${storageFiles.length} files in object storage\n`);
  
  // Get all media assets from database
  console.log("🗄️  Fetching all database media assets...");
  const mediaAssets = await storage.getMediaAssets();
  console.log(`   Found ${mediaAssets.length} records in database\n`);
  
  // Create set of known storage paths from database
  const knownPaths = new Set(mediaAssets.map((asset: any) => asset.storagePath));
  
  // Find orphaned files (in storage but not in DB)
  const orphanedFiles = storageFiles.filter((path: string) => !knownPaths.has(path));
  
  console.log(`\n🔍 Analysis Results:`);
  console.log(`   Total storage files: ${storageFiles.length}`);
  console.log(`   Database records: ${mediaAssets.length}`);
  console.log(`   Orphaned files: ${orphanedFiles.length}\n`);
  
  if (orphanedFiles.length === 0) {
    console.log("✅ No orphaned files found!");
    return;
  }
  
  // Show orphaned files
  console.log("📋 Orphaned Files:");
  orphanedFiles.forEach((path: string, i: number) => {
    console.log(`   ${i + 1}. ${path}`);
  });
  
  console.log(`\n⚠️  Would delete ${orphanedFiles.length} orphaned files`);
  console.log(`\n⚙️  DRY RUN MODE - No files will be deleted`);
  console.log(`   To actually delete, uncomment the deletion code below\n`);
  
  // UNCOMMENT TO ACTUALLY DELETE:
  /*
  let deleted = 0;
  let failed = 0;
  
  for (const path of orphanedFiles) {
    try {
      await appStorageService.deleteAsset(path);
      console.log(`   ✅ Deleted: ${path}`);
      deleted++;
    } catch (error) {
      console.error(`   ❌ Failed to delete ${path}:`, error);
      failed++;
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  */
}

// Run cleanup
cleanupOrphanedFiles()
  .then(() => {
    console.log("\n✅ Orphaned files cleanup finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  });
