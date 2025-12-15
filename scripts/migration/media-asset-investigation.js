#!/usr/bin/env node

/**
 * PHASE 1: Non-Destructive Database Investigation
 * Investigating missing media assets referenced in homepage
 */

import fetch from 'node-fetch';

async function investigateMediaAssets() {
  console.log('🔍 MEDIA ASSET INVESTIGATION REPORT');
  console.log('===================================\n');
  
  try {
    const baseUrl = 'http://localhost:3000/api';
    
    // Get all media assets via API
    console.log('📊 Fetching all media assets from API...');
    const mediaResponse = await fetch(`${baseUrl}/media`);
    const mediaData = await mediaResponse.json();
    const allAssets = mediaData.success ? mediaData.data.data : [];
    console.log(`✅ Found ${allAssets.length} total media assets in database\n`);
    
    // Get homepage data to check references via batch API
    console.log('🏠 Fetching homepage data...');
    const batchResponse = await fetch(`${baseUrl}/homepage-batch`);
    const batchData = await batchResponse.json();
    
    const {
      hero,
      processCards,
      sections,
      products,
      categories
    } = batchData;
    
    // Extract asset IDs mentioned in console logs as missing
    const suspectedMissingIds = [
      184, 185, 186, 187,  // Process card assets
      336, 331, 335, 334, 333, 332, 337, 338, 339, 343, 342, 341, 340, 309  // Product media
    ];
    
    console.log('🎯 INVESTIGATION TARGET ASSETS:');
    console.log('Assets mentioned as missing in console logs:', suspectedMissingIds.join(', '));
    console.log('');
    
    // Create lookup map for quick existence checks
    const assetMap = new Map();
    allAssets.forEach(asset => {
      assetMap.set(asset.id, asset);
    });
    
    // Check which suspected missing assets actually exist
    console.log('🔎 ASSET EXISTENCE ANALYSIS:');
    console.log('=========================');
    
    const existingAssets = [];
    const actuallyMissingAssets = [];
    
    suspectedMissingIds.forEach(id => {
      if (assetMap.has(id)) {
        existingAssets.push(id);
        const asset = assetMap.get(id);
        console.log(`✅ Asset ${id}: EXISTS - ${asset.filename} (${asset.type})`);
      } else {
        actuallyMissingAssets.push(id);
        console.log(`❌ Asset ${id}: MISSING`);
      }
    });
    
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`   • Assets that exist: ${existingAssets.length} (${existingAssets.join(', ')})`);
    console.log(`   • Assets actually missing: ${actuallyMissingAssets.length} (${actuallyMissingAssets.join(', ')})`);
    console.log('');
    
    // Check homepage references
    console.log('🏠 HOMEPAGE REFERENCE ANALYSIS:');
    console.log('==============================');
    
    // Hero background
    if (hero?.backgroundMediaId) {
      const exists = assetMap.has(hero.backgroundMediaId);
      console.log(`Hero background (${hero.backgroundMediaId}): ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    // Process cards
    console.log('\n📋 Process Cards:');
    processCards?.forEach((card, index) => {
      if (card.iconMediaId) {
        const exists = assetMap.has(card.iconMediaId);
        console.log(`  Card ${index} iconMediaId (${card.iconMediaId}): ${exists ? '✅ EXISTS' : '❌ MISSING'} - "${card.title}"`);
      }
      if (card.mediaId) {
        const exists = assetMap.has(card.mediaId);
        console.log(`  Card ${index} mediaId (${card.mediaId}): ${exists ? '✅ EXISTS' : '❌ MISSING'} - "${card.title}"`);
      }
    });
    
    // Products
    console.log('\n🛍️ Products:');
    products?.forEach((product, index) => {
      let hasIssues = false;
      
      // Check primary image
      if (product.primaryImageId) {
        const exists = assetMap.has(product.primaryImageId);
        if (!exists) {
          console.log(`  Product "${product.name}" primaryImageId (${product.primaryImageId}): ❌ MISSING`);
          hasIssues = true;
        }
      }
      
      // Check primary video
      if (product.primaryVideoId) {
        const exists = assetMap.has(product.primaryVideoId);
        if (!exists) {
          console.log(`  Product "${product.name}" primaryVideoId (${product.primaryVideoId}): ❌ MISSING`);
          hasIssues = true;
        }
      }
      
      // Check image arrays
      if (product.imageIds && Array.isArray(product.imageIds)) {
        const missingImages = product.imageIds.filter(id => !assetMap.has(id));
        if (missingImages.length > 0) {
          console.log(`  Product "${product.name}" missing imageIds: ${missingImages.join(', ')}`);
          hasIssues = true;
        }
      }
      
      // Check video arrays
      if (product.videos && Array.isArray(product.videos)) {
        const missingVideos = product.videos.filter(id => !assetMap.has(id));
        if (missingVideos.length > 0) {
          console.log(`  Product "${product.name}" missing videoIds: ${missingVideos.join(', ')}`);
          hasIssues = true;
        }
      }
      
      if (!hasIssues && (product.imageIds?.length || product.videos?.length)) {
        console.log(`  Product "${product.name}": ✅ All media references valid`);
      }
    });
    
    // Asset ID ranges
    console.log('\n📊 ASSET ID DISTRIBUTION:');
    console.log('=========================');
    const assetIds = allAssets.map(a => a.id).sort((a, b) => a - b);
    console.log(`Lowest ID: ${Math.min(...assetIds)}`);
    console.log(`Highest ID: ${Math.max(...assetIds)}`);
    console.log(`ID gaps in suspected range (180-350):`);
    
    for (let id = 180; id <= 350; id++) {
      if (!assetMap.has(id) && suspectedMissingIds.includes(id)) {
        console.log(`  Gap: ${id} (referenced in homepage)`);
      }
    }
    
    // File recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    
    if (actuallyMissingAssets.length > 0) {
      console.log('1. IMMEDIATE ACTION REQUIRED:');
      console.log(`   • Remove orphaned references to missing assets: ${actuallyMissingAssets.join(', ')}`);
      console.log('   • Update homepage process cards and product media arrays');
      console.log('   • Implement reference validation in admin forms');
    } else {
      console.log('1. ✅ No missing assets detected - issue may be URL/caching related');
      console.log('   • Check URL resolution and media proxy functionality');
      console.log('   • Verify object storage connectivity');
    }
    
    console.log('\n2. PREVENTIVE MEASURES:');
    console.log('   • Add asset existence validation before saving references');
    console.log('   • Implement orphaned asset detection in admin interface');
    console.log('   • Create automated cleanup maintenance task');
    
    console.log('\n🎯 INVESTIGATION COMPLETE');
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run investigation
investigateMediaAssets()
  .then(() => {
    console.log('\n✅ Investigation script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Investigation script failed:', error);
    process.exit(1);
  });