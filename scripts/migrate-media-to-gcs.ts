/**
 * MEDIA MIGRATION SCRIPT: Replit Object Storage → Google Cloud Storage
 *
 * This script migrates all media assets from Replit to GCS:
 * 1. Fetches all media assets from database
 * 2. Downloads each asset from Replit Object Storage
 * 3. Uploads to GCS with the same storage path
 * 4. Updates database record with new bucket name
 */

import "dotenv/config";
import { eq } from "drizzle-orm";

import { appStorageService } from "../server/app-storage-service.js";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

// Configuration
const REPLIT_BUCKET = "replit-objstore-2436cf8b-8132-4f53-a980-803c1b411db6";
const GCS_BUCKET = "run-media";
const API_BASE = process.env.REPLIT_URL || "http://localhost:5001";

interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: number; filename: string; error: string }>;
}

async function migrateAsset(asset: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip if already migrated
    if (asset.bucketName === GCS_BUCKET) {
      return { success: true };
    }

    // Try to download from Replit via API endpoint
    const downloadUrl = `${API_BASE}/api/media/${asset.id}/content`;

    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Migration Script",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await appStorageService.uploadAsset(asset.storagePath, buffer, {
      contentType: asset.mimeType,
    });
    await db
      .update(mediaAssets)
      .set({ bucketName: GCS_BUCKET })
      .where(eq(mediaAssets.id, asset.id));

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

async function main() {
  const stats: MigrationStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const assets = await db.select().from(mediaAssets).orderBy(mediaAssets.id);

    stats.total = assets.length;

    // Migrate each asset
    for (const asset of assets) {
      const result = await migrateAsset(asset);

      if (result.success) {
        if (asset.bucketName === GCS_BUCKET) {
          stats.skipped++;
        } else {
          stats.successful++;
        }
      } else {
        stats.failed++;
        stats.errors.push({
          id: asset.id,
          filename: asset.filename,
          error: result.error || "Unknown error",
        });
      }

      // Progress update
      const completed = stats.successful + stats.failed + stats.skipped;
    }

    if (stats.errors.length > 0) {
      stats.errors.forEach((err) => {});
    }

    if (stats.failed === 0) {
    } else {
    }
  } catch (error) {
    process.exit(1);
  }
}

// Run migration
main().catch(console.error);
