
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";



async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1] ?? '') : undefined;

    console.log("🧹 Starting Orphaned Media Cleanup...");
    console.log(`   Mode: ${force ? "LIVE (Files WILL be deleted)" : "DRY RUN (No files will be deleted)"}`);
    if (limit) console.log(`   Limit: ${limit} files to check`);

    try {
        // 1. FETCH ALL KNOWN PATHS FROM DB
        console.log("\n📥 Phase 1: Fetching known paths from Database...");
        const allAssets = await db.select({
            storagePath: mediaAssets.storagePath,
            imageVariants: mediaAssets.imageVariants
        }).from(mediaAssets);

        const knownPaths = new Set<string>();

        for (const asset of allAssets) {
            if (asset.storagePath) knownPaths.add(asset.storagePath);

            if (asset.imageVariants) {
                const variants = asset.imageVariants as Record<string, string>;
                for (const path of Object.values(variants)) {
                    if (path) knownPaths.add(path);
                }
            }
        }
        console.log(`   ✅ Loaded ${knownPaths.size} valid file paths from DB.`);

        // 2. LIST ALL FILES IN STORAGE
        console.log("\n☁️ Phase 2: Listing all files in Storage (GCS)...");
        // We'll list all assets. Note: This might be slow for huge buckets, but for now it's fine.
        // Ideally we'd stream or paginate, but listAssets returns all.
        const allStorageFiles = await appStorageService.listAssets();
        console.log(`   ✅ Found ${allStorageFiles.length} total files in storage.`);

        // 3. IDENTIFY ORPHANS
        console.log("\n🔍 Phase 3: Identifying Orphans...");
        const orphans: string[] = [];

        for (const file of allStorageFiles) {
            // Skip folders or empty paths if any
            if (!file || file.endsWith('/')) continue;

            if (!knownPaths.has(file)) {
                orphans.push(file);
            }
        }

        console.log(`   ⚠️ Found ${orphans.length} orphaned files.`);

        // 4. CLEANUP
        if (orphans.length > 0) {
            console.log("\n🗑️ Phase 4: Cleanup");

            const filesToDelete = limit ? orphans.slice(0, limit) : orphans;

            if (force) {
                console.log(`   Deleting ${filesToDelete.length} files...`);
                let deletedCount = 0;
                let errorCount = 0;

                for (const file of filesToDelete) {
                    try {
                        const success = await appStorageService.deleteAsset(file);
                        if (success) {
                            console.log(`   ✅ Deleted: ${file}`);
                            deletedCount++;
                        } else {
                            console.error(`   ❌ Failed to delete: ${file}`);
                            errorCount++;
                        }
                    } catch (err) {
                        console.error(`   ❌ Error deleting ${file}:`, err);
                        errorCount++;
                    }
                }
                console.log(`\n   ✅ Cleanup Complete. Deleted: ${deletedCount}, Errors: ${errorCount}`);
            } else {
                console.log("   [DRY RUN] The following files would be deleted:");
                filesToDelete.forEach(f => console.log(`   - ${f}`));
                console.log(`\n   To actually delete these files, run with --force`);
            }
        } else {
            console.log("\n   ✅ No orphans found. Storage is clean.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

main();
