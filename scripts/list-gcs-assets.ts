import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";

// import { mediaAssets } from '../shared/schema.js';
// import { inArray } from 'drizzle-orm';

async function listGCSAssets() {
  try {
    const bucketName = appStorageService.getBucketName();
    if (!bucketName) {
      process.exit(1);
    }

    // List all files in the bucket
    const allFiles = await appStorageService.listAssets();

    if (allFiles.length === 0) {
      return;
    }

    // Get all known storage paths from the database
    const dbAssets = await db.query.mediaAssets.findMany({
      columns: {
        storagePath: true,
      },
    });
    const knownPaths = new Set(dbAssets.map((a) => a.storagePath));

    // Identify orphaned files
    const orphanedFiles = allFiles.filter((file) => !knownPaths.has(file));
    if (orphanedFiles.length > 0) {
      orphanedFiles.forEach((file) => {});
    } else {
    }
  } catch (error) {
  } finally {
    process.exit(0);
  }
}

listGCSAssets();
