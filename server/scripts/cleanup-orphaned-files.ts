import { appStorageService } from "../app-storage-service.js";
import { getStorage } from "../lib/storage-singleton.js";

async function cleanupOrphanedFiles() {
	const storage = getStorage();
	const storageFiles = await appStorageService.listAssets();
	const mediaAssets = await storage.getMediaAssets();

	// Create set of known storage paths from database
	const knownPaths = new Set(
		mediaAssets.map((asset: any) => asset.storagePath),
	);

	// Find orphaned files (in storage but not in DB)
	const orphanedFiles = storageFiles.filter(
		(path: string) => !knownPaths.has(path),
	);

	if (orphanedFiles.length === 0) {
		return;
	}
	orphanedFiles.forEach((path: string, i: number) => {});

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
		process.exit(0);
	})
	.catch((error) => {
		process.exit(1);
	});
