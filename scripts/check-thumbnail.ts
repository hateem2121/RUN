import { appStorageService } from '../server/app-storage-service.js';
import { db } from '../server/db.js';
import { mediaAssets } from '../shared/schema.js';
import { eq } from "drizzle-orm";

async function main() {
    const assetId = 332; // Known problematic asset
    console.log(`Checking thumbnail variant for asset ID: ${assetId} `);

    try {
        const asset = await db.query.mediaAssets.findFirst({
            where: eq(mediaAssets.id, assetId),
        });

        if (!asset) {
            console.error("Asset not found in DB");
            process.exit(1);
        }

        console.log("Asset found:", {
            id: asset.id,
            imageVariants: asset.imageVariants,
        });

        if (asset.type === "image" && asset.imageVariants?.thumbnail) {
            const thumbnailPath = asset.imageVariants.thumbnail;
            console.log(`Checking thumbnail existence: ${thumbnailPath} `);

            const exists = await appStorageService.assetExists(thumbnailPath);
            console.log(`Thumbnail exists: ${exists} `);
        } else {
            console.log("No thumbnail variant defined in DB.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

main();
