import { eq } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
  const assetId = 332; // Known missing variant from previous check

  try {
    const asset = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset) {
      process.exit(1);
    }

    let pathToServe = asset.storagePath;

    // Simulate the NEW handler logic
    if (asset.type === "image" && asset.imageVariants?.original) {
      const variantPath = asset.imageVariants.original;

      const variantExists = await appStorageService.assetExists(variantPath);

      if (variantExists) {
        pathToServe = variantPath;
      } else {
        // pathToServe remains asset.storagePath
      }
    }

    if (pathToServe === asset.storagePath) {
    } else {
    }

    // Verify the fallback path actually exists
    const _fallbackExists = await appStorageService.assetExists(pathToServe!);

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

main();
