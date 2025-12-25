import { eq } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
  const assetId = 377; // Using the ID we found

  try {
    const asset = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset) {
      process.exit(1);
    }

    let pathToServe = asset.storagePath;
    if (asset.type === "image" && asset.imageVariants?.original) {
      pathToServe = asset.imageVariants.original;
    }

    try {
      // Check if file exists in GCS
      const exists = await appStorageService.assetExists(pathToServe!);

      if (!exists) {
      }

      const signedUrl = await appStorageService.generateSignedUrl(pathToServe!, 300);
      const response = await fetch(signedUrl);

      if (!response.ok) {
        const text = await response.text();
      } else {
      }
    } catch (err) {}

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
