#!/usr/bin/env node

/**
 * Fix Storage Mismatch - Clean Orphaned Database Records
 * 
 * This script identifies and removes database records for media files
 * that don't exist in object storage, preventing 404 errors.
 */

import { storage } from '../server/storage.ts';
import { Client } from '@replit/object-storage';

const objectStorageClient = new Client();

async function fixStorageMismatch() {
  console.log('🔧 Starting Storage Mismatch Fix...\n');
  
  try {
    // Get all media assets from database
    const mediaAssets = await storage.getMediaAssets();
    console.log(`📊 Found ${mediaAssets.length} media assets in database`);
    
    let checkedCount = 0;
    let deletedCount = 0;
    let existingCount = 0;
    
    console.log('🔍 Checking storage existence for each asset...\n');
    
    for (const asset of mediaAssets) {
      checkedCount++;
      
      // Construct storage key
      const storageKey = `media/${asset.filename}`;
      
      try {
        // Check if file exists in object storage
        const result = await objectStorageClient.downloadAsBytes(storageKey);
        
        if (result.ok) {
          existingCount++;
          console.log(`✅ EXISTS: ${asset.filename} (${asset.originalName})`);
        } else {
          // File doesn't exist in storage - remove from database
          console.log(`❌ MISSING: ${asset.filename} (${asset.originalName}) - DELETING`);
          await storage.deleteMediaAsset(asset.id);
          deletedCount++;
        }
      } catch (error) {
        // Error accessing storage - consider it missing
        console.log(`❌ ERROR: ${asset.filename} (${asset.originalName}) - DELETING`);
        await storage.deleteMediaAsset(asset.id);
        deletedCount++;
      }
      
      // Progress indicator
      if (checkedCount % 10 === 0) {
        console.log(`📈 Progress: ${checkedCount}/${mediaAssets.length} checked`);
      }
    }
    
    console.log('\n📋 Storage Mismatch Fix Complete!');
    console.log(`✅ Existing files: ${existingCount}`);
    console.log(`❌ Deleted orphaned records: ${deletedCount}`);
    console.log(`📊 Total checked: ${checkedCount}`);
    
    if (deletedCount > 0) {
      console.log(`\n🎉 Cleaned up ${deletedCount} orphaned database records`);
      console.log('💡 These records were pointing to missing storage files');
    } else {
      console.log('\n✅ No orphaned records found - database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error during storage mismatch fix:', error);
    process.exit(1);
  }
}

// Execute the fix
fixStorageMismatch();