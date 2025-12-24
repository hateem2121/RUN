import { eq } from "drizzle-orm";
import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
	const assetId = 332; // Known problematic asset

	try {
		const asset = await db.query.mediaAssets.findFirst({
			where: eq(mediaAssets.id, assetId),
		});

		if (!asset) {
			process.exit(1);
		}

		if (asset.type === "image" && asset.imageVariants?.thumbnail) {
			const thumbnailPath = asset.imageVariants.thumbnail;

			const exists = await appStorageService.assetExists(thumbnailPath);
		} else {
		}

		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

main();
