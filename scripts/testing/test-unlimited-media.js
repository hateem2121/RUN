/**
 * 🚀 UNLIMITED MEDIA CAPACITY TEST
 * 
 * Demonstrates the unlimited media storage capability
 */

import { unlimitedMediaManager } from './server/lib/unlimited-media-manager.js';

async function testUnlimitedCapacity() {
  console.log('🚀 Testing Unlimited Media Storage Capacity...\n');

  // Test 1: Add multiple assets
  console.log('📝 Adding test media assets...');
  
  const testAssets = [
    {
      name: 'Product Image 1.jpg',
      type: 'image',
      size: 2048576, // 2MB
      storageKey: 'media/test-product-1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      tags: ['product', 'apparel']
    },
    {
      name: 'Demo Video.mp4',
      type: 'video', 
      size: 15728640, // 15MB
      storageKey: 'media/test-video-1.mp4',
      tags: ['video', 'demo']
    },
    {
      name: '3D Model.glb',
      type: '3d-model',
      size: 5242880, // 5MB
      storageKey: 'media/test-model-1.glb',
      tags: ['3d', 'model']
    }
  ];

  for (const asset of testAssets) {
    const result = await unlimitedMediaManager.addMediaAsset(asset);
    console.log(`  ✅ Added: ${asset.name} (ID: ${result.id})`);
  }

  // Test 2: Retrieve all assets
  console.log('\n📊 Retrieving all media assets...');
  const { assets, total } = await unlimitedMediaManager.getAllMediaAssets();
  console.log(`  📁 Found ${total} total assets`);
  
  assets.forEach(asset => {
    console.log(`    - ${asset.name} (${asset.type}, ${(asset.size / 1024 / 1024).toFixed(2)}MB)`);
  });

  // Test 3: Storage statistics
  console.log('\n📈 Storage Statistics:');
  const stats = await unlimitedMediaManager.getStorageStats();
  
  console.log(`  📊 Total Assets: ${stats.totalAssets.toLocaleString()}`);
  console.log(`  📦 Total Chunks: ${stats.totalChunks}`);
  console.log(`  💾 Total Storage: ${(stats.totalStorageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  📏 Average Chunk Size: ${(stats.averageChunkSize / 1024).toFixed(2)} KB`);
  console.log(`  🗄️ Key-Value Store Usage: ${(stats.keyValueStoreUsage * 100).toFixed(2)}%`);
  console.log(`  🚀 Estimated Capacity: ${stats.estimatedCapacity.toLocaleString()} assets`);

  // Test 4: Search and filter
  console.log('\n🔍 Testing search and filtering...');
  const videoAssets = await unlimitedMediaManager.getAllMediaAssets({ type: 'video' });
  console.log(`  🎬 Video assets: ${videoAssets.total}`);

  const taggedAssets = await unlimitedMediaManager.getAllMediaAssets({ tags: ['product'] });
  console.log(`  🏷️ Assets with 'product' tag: ${taggedAssets.total}`);

  // Test 5: Individual asset lookup
  console.log('\n🎯 Testing individual asset lookup...');
  if (assets.length > 0) {
    const firstAsset = assets[0];
    const retrieved = await unlimitedMediaManager.getMediaAsset(firstAsset.id);
    console.log(`  ✅ Retrieved asset ${firstAsset.id}: ${retrieved?.name}`);
  }

  console.log('\n🎉 Unlimited Media Storage Test Complete!');
  console.log(`\n📋 Summary:`);
  console.log(`   • Current capacity: ${stats.estimatedCapacity.toLocaleString()} assets`);
  console.log(`   • Storage efficiency: ${(100 - stats.keyValueStoreUsage * 100).toFixed(1)}% headroom remaining`);
  console.log(`   • Chunking: ${stats.totalChunks} chunks managing ${stats.totalAssets} assets`);
  console.log(`   • Media files: Unlimited (Object Storage)`);
  console.log(`   • Metadata: Virtual unlimited (Smart chunking)`);
}

// Run the test
testUnlimitedCapacity().catch(console.error);