// import { getStorage } from "../lib/storage-singleton.js";
import crypto from "crypto";
import { appStorageService } from "../app-storage-service.js";

async function cleanupDuplicates() {
	const storageFiles = await appStorageService.listAssets();
	const fileHashes = new Map<string, string[]>(); // hash -> [paths]

	for (const path of storageFiles) {
		try {
			const buffer = await appStorageService.downloadAsset(path);
			const hash = crypto.createHash("sha256").update(buffer).digest("hex");

			if (!fileHashes.has(hash)) {
				fileHashes.set(hash, []);
			}
			fileHashes.get(hash)!.push(path);
		} catch (error) {}
	}

	// Find duplicates (hashes with multiple files)
	const duplicateGroups = Array.from(fileHashes.entries()).filter(
		([_, paths]) => paths.length > 1,
	);

	if (duplicateGroups.length === 0) {
		return;
	}

	// Calculate space savings
	let totalDuplicateSize = 0;
	let filesToDelete = 0;
	for (const [hash, paths] of duplicateGroups) {
		const buffer = await appStorageService.downloadAsset(paths[0]!);
		const size = buffer.length;
		const duplicateSize = size * (paths.length - 1);
		totalDuplicateSize += duplicateSize;
		filesToDelete += paths.length - 1;
		paths.forEach((p: string, i: number) => {
			const keep = i === 0 ? " [KEEP]" : " [DELETE]";
		});
	}

	// UNCOMMENT TO ACTUALLY DELETE:
	/*
  let deleted = 0;
  let failed = 0;
  
  for (const [hash, paths] of duplicateGroups) {
    // Keep first file, delete rest
    for (let i = 1; i < paths.length; i++) {
      try {
        await appStorageService.deleteAsset(paths[i]);
        console.log(`   ✅ Deleted: ${paths[i]}`);
        deleted++;
      } catch (error) {
        console.error(`   ❌ Failed to delete ${paths[i]}:`, error);
        failed++;
      }
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Space saved: ${(totalDuplicateSize / 1024 / 1024).toFixed(2)} MB`);
  */
}

// Run cleanup
cleanupDuplicates()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		process.exit(1);
	});
