#!/usr/bin/env tsx
// @ts-nocheck
/**
 * Media Migration Script
 * Migrates legacy media assets to the new media-v2 system
 * Usage: tsx scripts/migrate-media.ts [--dry]
 */

import { getStorage } from "../server/lib/storage-singleton.js";
import type { MediaAsset } from "../shared/schema.js";

const isDryRun = process.argv.includes("--dry");

async function migrateMedia() {
  const storage = getStorage();

  try {
    // Get all media assets
    const allMedia = (await storage.getAllByType("mediaAssets")) as MediaAsset[];

    let _migrationCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const asset of allMedia) {
      try {
        // Check if asset needs migration
        let needsMigration = false;
        const updates: Partial<MediaAsset> = {};

        // Check for missing required fields
        if (!asset.filename) {
          needsMigration = true;
          errors.push(`Asset ${asset.id}: Missing filename`);
          errorCount++;
          continue;
        }

        if (!asset.originalName) {
          needsMigration = true;
          updates.originalName = asset.filename;
        }

        if (!asset.mimeType) {
          needsMigration = true;
          // Infer from filename
          const ext = asset.filename.split(".").pop()?.toLowerCase();
          if (ext) {
            const mimeMap: Record<string, string> = {
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              png: "image/png",
              gif: "image/gif",
              webp: "image/webp",
              svg: "image/svg+xml",
              mp4: "video/mp4",
              webm: "video/webm",
              pdf: "application/pdf",
            };
            updates.mimeType = mimeMap[ext] || "application/octet-stream";
          }
        }

        if (!asset.type) {
          needsMigration = true;
          // Infer from mimeType
          if (updates.mimeType || asset.mimeType) {
            const mimeType = updates.mimeType || asset.mimeType;
            if (mimeType.startsWith("image/")) updates.type = "image";
            else if (mimeType.startsWith("video/")) updates.type = "video";
            else if (mimeType === "application/pdf") updates.type = "document";
            else updates.type = "other";
          }
        }

        if (!asset.size && asset.size !== 0) {
          needsMigration = true;
          updates.size = 0; // Will be updated on next access
        }

        if (!asset.tags) {
          needsMigration = true;
          updates.tags = [];
        }

        if (!asset.metadata) {
          needsMigration = true;
          updates.metadata = {};
        }

        if (!asset.createdAt) {
          needsMigration = true;
          updates.createdAt = new Date().toISOString();
        }

        if (!asset.updatedAt) {
          needsMigration = true;
          updates.updatedAt = new Date().toISOString();
        }

        // Apply migration if needed
        if (needsMigration) {
          if (!isDryRun) {
            const migratedAsset = { ...asset, ...updates };
            await storage.update("mediaAssets", asset.id, migratedAsset);
          }

          _migrationCount++;
        }
      } catch (error) {
        errors.push(`Asset ${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
        errorCount++;
      }
    }

    if (errors.length > 0) {
      errors.forEach((_err) => {});
    }

    if (isDryRun) {
      if (errorCount === 0) {
      } else {
      }
    } else {
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (_error) {
    process.exit(1);
  }
}

// Run migration
migrateMedia();
