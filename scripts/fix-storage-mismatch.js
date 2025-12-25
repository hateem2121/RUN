#!/usr/bin/env node

/**
 * Fix Storage Mismatch - Clean Orphaned Database Records
 *
 * This script identifies and removes database records for media files
 * that don't exist in object storage, preventing 404 errors.
 */

import { Client } from "@replit/object-storage";
import { storage } from "../server/storage.ts";

const objectStorageClient = new Client();

async function fixStorageMismatch() {
  try {
    // Get all media assets from database
    const mediaAssets = await storage.getMediaAssets();

    let checkedCount = 0;
    let deletedCount = 0;
    let existingCount = 0;

    for (const asset of mediaAssets) {
      checkedCount++;

      // Construct storage key
      const storageKey = `media/${asset.filename}`;

      try {
        // Check if file exists in object storage
        const result = await objectStorageClient.downloadAsBytes(storageKey);

        if (result.ok) {
          existingCount++;
        } else {
          await storage.deleteMediaAsset(asset.id);
          deletedCount++;
        }
      } catch (error) {
        await storage.deleteMediaAsset(asset.id);
        deletedCount++;
      }

      // Progress indicator
      if (checkedCount % 10 === 0) {
      }
    }

    if (deletedCount > 0) {
    } else {
    }
  } catch (error) {
    process.exit(1);
  }
}

// Execute the fix
fixStorageMismatch();
