import { appStorageService } from "../server/app-storage-service.js";

async function wipeGCSBucket() {
	try {
		const bucketName = appStorageService.getBucketName();
		if (!bucketName) {
			process.exit(1);
		}
		const allFiles = await appStorageService.listAssets();

		if (allFiles.length === 0) {
			return;
		}
		let deletedCount = 0;
		const batchSize = 20;

		for (let i = 0; i < allFiles.length; i += batchSize) {
			const batch = allFiles.slice(i, i + batchSize);
			await Promise.all(
				batch.map((file) => appStorageService.deleteAsset(file)),
			);
			deletedCount += batch.length;
		}
		const remainingFiles = await appStorageService.listAssets();
		if (remainingFiles.length === 0) {
		} else {
			process.exit(1);
		}
	} catch (error) {
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

wipeGCSBucket();
