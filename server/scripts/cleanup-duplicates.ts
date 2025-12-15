import { appStorageService } from "../app-storage-service.js";
// import { getStorage } from "../lib/storage-singleton.js";
import crypto from "crypto";

async function cleanupDuplicates() {
  console.log("🧹 Starting duplicate files cleanup...\n");

  // const storage = getStorage();

  // Get all files from object storage
  console.log("📂 Fetching all object storage files...");
  const storageFiles = await appStorageService.listAssets();
  console.log(`   Found ${storageFiles.length} files in object storage\n`);

  // Calculate hashes for all files
  console.log("🔍 Calculating file hashes...");
  const fileHashes = new Map<string, string[]>();  // hash -> [paths]

  for (const path of storageFiles) {
    try {
      const buffer = await appStorageService.downloadAsset(path);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      if (!fileHashes.has(hash)) {
        fileHashes.set(hash, []);
      }
      fileHashes.get(hash)!.push(path);
    } catch (error) {
      console.error(`   ⚠️  Failed to hash ${path}:`, error);
    }
  }

  // Find duplicates (hashes with multiple files)
  const duplicateGroups = Array.from(fileHashes.entries())
    .filter(([_, paths]) => paths.length > 1);

  console.log(`\n🔍 Analysis Results:`);
  console.log(`   Total files: ${storageFiles.length}`);
  console.log(`   Unique hashes: ${fileHashes.size}`);
  console.log(`   Duplicate groups: ${duplicateGroups.length}`);

  if (duplicateGroups.length === 0) {
    console.log("\n✅ No duplicates found!");
    return;
  }

  // Calculate space savings
  let totalDuplicateSize = 0;
  let filesToDelete = 0;

  console.log("\n📋 Duplicate Groups:\n");
  for (const [hash, paths] of duplicateGroups) {
    const buffer = await appStorageService.downloadAsset(paths[0]!);
    const size = buffer.length;
    const duplicateSize = size * (paths.length - 1);
    totalDuplicateSize += duplicateSize;
    filesToDelete += paths.length - 1;

    console.log(`   Hash: ${hash.substring(0, 16)}...`);
    console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
    console.log(`   Files (${paths.length}):`);
    paths.forEach((p: string, i: number) => {
      const keep = i === 0 ? " [KEEP]" : " [DELETE]";
      console.log(`      ${i + 1}. ${p}${keep}`);
    });
    console.log(`   Savings: ${(duplicateSize / 1024 / 1024).toFixed(2)} MB\n`);
  }

  console.log(`\n💾 Total Potential Savings:`);
  console.log(`   Files to delete: ${filesToDelete}`);
  console.log(`   Space savings: ${(totalDuplicateSize / 1024 / 1024).toFixed(2)} MB`);

  console.log(`\n⚠️  Would delete ${filesToDelete} duplicate files`);
  console.log(`\n⚙️  DRY RUN MODE - No files will be deleted`);
  console.log(`   To actually delete, uncomment the deletion code below\n`);

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
    console.log("\n✅ Duplicate cleanup finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  });
