
import { appStorageService } from '../server/app-storage-service.js';

async function wipeGCSBucket() {
    console.log('🔥 STARTING GCS BUCKET WIPE...');
    console.log('⚠️  This will delete ALL files in the bucket.');

    try {
        const bucketName = appStorageService.getBucketName();
        if (!bucketName) {
            console.error('❌ GCS_BUCKET_NAME is not set.');
            process.exit(1);
        }
        console.log(`📦 Target Bucket: ${bucketName}`);

        // List all files
        console.log('🔍 Listing files...');
        const allFiles = await appStorageService.listAssets();
        console.log(`found ${allFiles.length} files.`);

        if (allFiles.length === 0) {
            console.log('✅ Bucket is already empty.');
            return;
        }

        // Delete in batches
        console.log('🗑️  Deleting files...');
        let deletedCount = 0;
        const batchSize = 20;

        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            await Promise.all(batch.map(file => appStorageService.deleteAsset(file)));
            deletedCount += batch.length;
            console.log(`   - Deleted ${deletedCount}/${allFiles.length} files`);
        }

        // Verify
        console.log('🔍 Verifying empty state...');
        const remainingFiles = await appStorageService.listAssets();
        if (remainingFiles.length === 0) {
            console.log('✅ WIPE COMPLETE. Bucket is empty.');
        } else {
            console.error(`❌ Wipe failed. ${remainingFiles.length} files remain.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Wipe failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

wipeGCSBucket();
