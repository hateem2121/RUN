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
import fetch from "node-fetch";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";
import { appStorageService } from "../server/app-storage-service.js";
import { eq } from "drizzle-orm";

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
        console.log(`\n📦 Migrating asset ${asset.id}: ${asset.filename}`);
        console.log(`   Storage path: ${asset.storagePath}`);

        // Skip if already migrated
        if (asset.bucketName === GCS_BUCKET) {
            console.log(`   ⏭️  Already migrated, skipping`);
            return { success: true };
        }

        // Try to download from Replit via API endpoint
        const downloadUrl = `${API_BASE}/api/media/${asset.id}/content`;
        console.log(`   ⬇️  Downloading from: ${downloadUrl}`);

        const response = await fetch(downloadUrl, {
            headers: {
                'User-Agent': 'Migration Script'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Download failed: HTTP ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`   ✅ Downloaded ${buffer.length} bytes`);

        // Upload to GCS
        console.log(`   ⬆️  Uploading to GCS: ${asset.storagePath}`);
        await appStorageService.uploadAsset(
            asset.storagePath,
            buffer,
            { contentType: asset.mimeType }
        );
        console.log(`   ✅ Uploaded to GCS`);

        // Update database record
        console.log(`   💾 Updating database record...`);
        await db
            .update(mediaAssets)
            .set({ bucketName: GCS_BUCKET })
            .where(eq(mediaAssets.id, asset.id));
        console.log(`   ✅ Database updated`);

        return { success: true };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
    }
}

async function main() {
    console.log("🚀 Starting Media Migration: Replit → GCS\n");
    console.log(`📊 Configuration:`);
    console.log(`   Source: ${REPLIT_BUCKET}`);
    console.log(`   Destination: ${GCS_BUCKET}`);
    console.log(`   API: ${API_BASE}\n`);

    const stats: MigrationStats = {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    try {
        // Fetch all media assets
        console.log("📋 Fetching all media assets from database...");
        const assets = await db
            .select()
            .from(mediaAssets)
            .orderBy(mediaAssets.id);

        stats.total = assets.length;
        console.log(`✅ Found ${stats.total} assets\n`);

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
                    error: result.error || 'Unknown error'
                });
            }

            // Progress update
            const completed = stats.successful + stats.failed + stats.skipped;
            console.log(`\n📈 Progress: ${completed}/${stats.total} (${Math.round(completed / stats.total * 100)}%)`);
        }

        // Final summary
        console.log("\n\n═══════════════════════════════════════");
        console.log("📊 MIGRATION SUMMARY");
        console.log("═══════════════════════════════════════");
        console.log(`Total assets:      ${stats.total}`);
        console.log(`✅ Successful:      ${stats.successful}`);
        console.log(`⏭️  Already migrated: ${stats.skipped}`);
        console.log(`❌ Failed:          ${stats.failed}`);
        console.log("═══════════════════════════════════════");

        if (stats.errors.length > 0) {
            console.log("\n❌ Failed Assets:");
            stats.errors.forEach(err => {
                console.log(`   - ID ${err.id} (${err.filename}): ${err.error}`);
            });
        }

        if (stats.failed === 0) {
            console.log("\n🎉 All assets migrated successfully!");
        } else {
            console.log(`\n⚠️  ${stats.failed} assets failed to migrate. Check errors above.`);
        }

    } catch (error) {
        console.error("\n💥 Migration failed:", error);
        process.exit(1);
    }
}

// Run migration
main().catch(console.error);
