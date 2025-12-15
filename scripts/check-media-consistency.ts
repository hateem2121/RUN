import { appStorageService } from '../server/app-storage-service.js';
import { db } from '../server/db.js';
import { mediaAssets } from '../shared/schema.js';
import { desc, sql } from "drizzle-orm";

async function main() {
    console.log("Checking consistency for last 50 media assets...");

    try {
        const assets = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.id)).limit(50);

        if (assets.length === 0) {
            console.log("No assets found in DB.");
            process.exit(0);
        }

        let missingCount = 0;
        let successCount = 0;
        let mismatchCount = 0;

        for (const asset of assets) {
            if (!asset.storagePath) {
                console.warn(`[ID: ${asset.id}] No storagePath defined.`);
                continue;
            }

            // Check for metadata mismatches
            const isImageMime = asset.mimeType?.startsWith('image/');
            const isVideoMime = asset.mimeType?.startsWith('video/');
            const isModelMime = asset.mimeType?.includes('gltf') || asset.mimeType?.includes('glb') || asset.mimeType?.includes('model');

            let suspectedType = 'unknown';
            if (isImageMime) suspectedType = 'image';
            else if (isVideoMime) suspectedType = 'video';
            else if (isModelMime) suspectedType = 'model';

            if (asset.type !== suspectedType && suspectedType !== 'unknown') {
                console.warn(`[ID: ${asset.id}] TYPE MISMATCH: DB type = '${asset.type}', Mime = '${asset.mimeType}'(Should be '${suspectedType}')`);
                mismatchCount++;
            }

            // Check URL pattern consistency
            const expectedUrl = `/api/media/${asset.id}/content`;
            if (asset.url !== expectedUrl) {
                console.warn(`[ID: ${asset.id}] URL MISMATCH: DB='${asset.url}' (Should be '${expectedUrl}')`);
                mismatchCount++;

                // Auto-fix URL
                await db.update(mediaAssets)
                    .set({ url: expectedUrl })
                    .where(sql`${mediaAssets.id} = ${asset.id}`);
                console.log(`[ID: ${asset.id}] FIXED: URL updated to ${expectedUrl}`);
            }

            // Check Thumbnail URL pattern
            if (asset.thumbnailUrl) {
                // Expecting /api/media/{id}/thumbnail or similar? 
                // Actually, let's just check if it starts with /api/media
                if (!asset.thumbnailUrl.startsWith('/api/media/')) {
                    console.warn(`[ID: ${asset.id}] THUMBNAIL URL WEIRD: '${asset.thumbnailUrl}'`);
                }
            }

            // Check file existence (Storage Path)
            const storagePathExists = await appStorageService.assetExists(asset.storagePath);

            if (!storagePathExists) {
                missingCount++;
                console.error(`[ID: ${asset.id}] MISSING STORAGE PATH: ${asset.storagePath}`);
            }

            // Check file existence (Image Variants - Original)
            // The handler prefers this over storagePath for images
            // Check file existence (Image Variants - Original)
            // The handler prefers this over storagePath for images
            if (asset.type === 'image' && asset.imageVariants?.original) {
                const variantPath = asset.imageVariants.original;
                // Check if variant path exists in storage
                const variantExists = await appStorageService.assetExists(variantPath);

                if (!variantExists) {
                    missingCount++;
                    console.error(`[ID: ${asset.id}] MISSING VARIANT (Original): ${variantPath}`);

                    // Auto-fix: Remove the invalid variant reference
                    const newVariants = { ...asset.imageVariants };
                    delete newVariants.original;

                    await db.update(mediaAssets)
                        .set({ imageVariants: newVariants })
                        .where(sql`${mediaAssets.id} = ${asset.id}`);

                    console.log(`[ID: ${asset.id}] FIXED: Removed invalid 'original' variant reference from DB.`);
                }
            }

            if (storagePathExists && (asset.type !== 'image' || !asset.imageVariants?.original || (await appStorageService.assetExists(asset.imageVariants.original)))) {
                successCount++;
            }
        }

        console.log("\n--- Summary ---");
        console.log(`Total Checked: ${assets.length}`);
        console.log(`Found: ${successCount}`);
        console.log(`Missing: ${missingCount}`);
        console.log(`Metadata/URL Mismatches: ${mismatchCount}`);

        if (missingCount > 0) {
            console.log("Conclusion: Some assets are missing from GCS.");
        } else if (mismatchCount > 0) {
            console.log("Conclusion: Metadata or URL mismatches found (and some fixed).");
        } else {
            console.log("Conclusion: No obvious data issues found. URLs are consistent.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

main();
