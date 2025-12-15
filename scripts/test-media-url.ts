import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const assetId = 377; // Using the ID we found
    console.log(`Testing URL generation for asset ID: ${assetId}`);

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
            bucket: appStorageService.getBucketName()
        });

        let pathToServe = asset.storagePath;
        if (asset.type === "image" && asset.imageVariants?.original) {
            pathToServe = asset.imageVariants.original;
            console.log(`Using compressed variant: ${pathToServe}`);
        }

        console.log(`Generating signed URL for path: ${pathToServe}`);

        try {
            // Check if file exists in GCS
            const exists = await appStorageService.assetExists(pathToServe!);
            console.log(`File exists in GCS: ${exists}`);

            if (!exists) {
                console.error("CRITICAL: File is missing from GCS bucket!");
            }

            const signedUrl = await appStorageService.generateSignedUrl(pathToServe!, 300);
            console.log("Generated URL:", signedUrl);

            // Verify accessibility
            console.log("Attempting to fetch signed URL...");
            const response = await fetch(signedUrl);
            console.log(`Fetch Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                console.error("Failed to fetch signed URL. Response body:");
                const text = await response.text();
                console.error(text);
            } else {
                console.log("Success: Signed URL is accessible.");
            }

        } catch (err) {
            console.error("Error generating/fetching signed URL:", err);
        }

        process.exit(0);
    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

main();
