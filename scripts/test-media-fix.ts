import { eq } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
    const assetId = 332; // Known missing variant from previous check
    console.log(`Testing fix for asset ID: ${assetId}`);

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
            storagePath: asset.storagePath,
            imageVariants: asset.imageVariants,
        });

        let pathToServe = asset.storagePath;

        // Simulate the NEW handler logic
        if (asset.type === "image" && asset.imageVariants?.original) {
            const variantPath = asset.imageVariants.original;
            console.log(`Checking variant existence: ${variantPath}`);

            const variantExists = await appStorageService.assetExists(variantPath);
            console.log(`Variant exists: ${variantExists}`);

            if (variantExists) {
                pathToServe = variantPath;
                console.log("Using variant path.");
            } else {
                console.log("Variant missing. Falling back to storagePath.");
                // pathToServe remains asset.storagePath
            }
        }

        console.log(`Final path to serve: ${pathToServe}`);

        if (pathToServe === asset.storagePath) {
            console.log("SUCCESS: Correctly fell back to storagePath.");
        } else {
            console.error("FAILURE: Did not fall back to storagePath.");
        }

        // Verify the fallback path actually exists
        const fallbackExists = await appStorageService.assetExists(pathToServe!);
        console.log(`Fallback path exists in GCS: ${fallbackExists}`);

        process.exit(0);
    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

main();
