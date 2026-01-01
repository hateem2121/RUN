import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "", 10) : undefined;
  if (limit)
    try {
      const allAssets = await db
        .select({
          storagePath: mediaAssets.storagePath,
          imageVariants: mediaAssets.imageVariants,
        })
        .from(mediaAssets);

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
      // We'll list all assets. Note: This might be slow for huge buckets, but for now it's fine.
      // Ideally we'd stream or paginate, but listAssets returns all.
      const allStorageFiles = await appStorageService.listAssets();
      const orphans: string[] = [];

      for (const file of allStorageFiles) {
        // Skip folders or empty paths if any
        if (!file || file.endsWith("/")) continue;

        if (!knownPaths.has(file)) {
          orphans.push(file);
        }
      }

      // 4. CLEANUP
      if (orphans.length > 0) {
        const filesToDelete = limit ? orphans.slice(0, limit) : orphans;

        if (force) {
          let _deletedCount = 0;
          let _errorCount = 0;

          for (const file of filesToDelete) {
            try {
              const success = await appStorageService.deleteAsset(file);
              if (success) {
                _deletedCount++;
              } else {
                _errorCount++;
              }
            } catch (_err) {
              _errorCount++;
            }
          }
        } else {
          filesToDelete.forEach((_f) => {});
        }
      } else {
      }

      process.exit(0);
    } catch (_error) {
      process.exit(1);
    }
}

main();
