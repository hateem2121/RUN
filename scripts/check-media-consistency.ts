import { desc, sql } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
  try {
    const assets = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.id)).limit(50);

    if (assets.length === 0) {
      process.exit(0);
    }

    let missingCount = 0;
    let successCount = 0;
    let mismatchCount = 0;

    for (const asset of assets) {
      if (!asset.storagePath) {
        continue;
      }

      // Check for metadata mismatches
      const isImageMime = asset.mimeType?.startsWith("image/");
      const isVideoMime = asset.mimeType?.startsWith("video/");
      const isModelMime =
        asset.mimeType?.includes("gltf") ||
        asset.mimeType?.includes("glb") ||
        asset.mimeType?.includes("model");

      let suspectedType = "unknown";
      if (isImageMime) suspectedType = "image";
      else if (isVideoMime) suspectedType = "video";
      else if (isModelMime) suspectedType = "model";

      if (asset.type !== suspectedType && suspectedType !== "unknown") {
        mismatchCount++;
      }

      // Check URL pattern consistency
      const expectedUrl = `/api/media/${asset.id}/content`;
      if (asset.url !== expectedUrl) {
        mismatchCount++;

        // Auto-fix URL
        await db
          .update(mediaAssets)
          .set({ url: expectedUrl })
          .where(sql`${mediaAssets.id} = ${asset.id}`);
      }

      // Check Thumbnail URL pattern
      if (asset.thumbnailUrl) {
        // Expecting /api/media/{id}/thumbnail or similar?
        // Actually, let's just check if it starts with /api/media
        if (!asset.thumbnailUrl.startsWith("/api/media/")) {
        }
      }

      // Check file existence (Storage Path)
      const storagePathExists = await appStorageService.assetExists(asset.storagePath);

      if (!storagePathExists) {
        missingCount++;
      }

      // Check file existence (Image Variants - Original)
      // The handler prefers this over storagePath for images
      // Check file existence (Image Variants - Original)
      // The handler prefers this over storagePath for images
      if (asset.type === "image" && asset.imageVariants?.original) {
        const variantPath = asset.imageVariants.original;
        // Check if variant path exists in storage
        const variantExists = await appStorageService.assetExists(variantPath);

        if (!variantExists) {
          missingCount++;

          // Auto-fix: Remove the invalid variant reference
          const newVariants = { ...asset.imageVariants };
          delete newVariants.original;

          await db
            .update(mediaAssets)
            .set({ imageVariants: newVariants })
            .where(sql`${mediaAssets.id} = ${asset.id}`);
        }
      }

      if (
        storagePathExists &&
        (asset.type !== "image" ||
          !asset.imageVariants?.original ||
          (await appStorageService.assetExists(asset.imageVariants.original)))
      ) {
        successCount++;
      }
    }

    if (missingCount > 0) {
    } else if (mismatchCount > 0) {
    } else {
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
