/**
 * 🚀 UNLIMITED MEDIA CAPACITY TEST
 *
 * Demonstrates the unlimited media storage capability
 */

import { unlimitedMediaManager } from "./server/lib/unlimited-media-manager.js";

async function testUnlimitedCapacity() {
  const testAssets = [
    {
      name: "Product Image 1.jpg",
      type: "image",
      size: 2048576, // 2MB
      storageKey: "media/test-product-1.jpg",
      thumbnailUrl: "https://example.com/thumb1.jpg",
      tags: ["product", "apparel"],
    },
    {
      name: "Demo Video.mp4",
      type: "video",
      size: 15728640, // 15MB
      storageKey: "media/test-video-1.mp4",
      tags: ["video", "demo"],
    },
    {
      name: "3D Model.glb",
      type: "3d-model",
      size: 5242880, // 5MB
      storageKey: "media/test-model-1.glb",
      tags: ["3d", "model"],
    },
  ];

  for (const asset of testAssets) {
    const _result = await unlimitedMediaManager.addMediaAsset(asset);
  }
  const { assets, total } = await unlimitedMediaManager.getAllMediaAssets();

  assets.forEach((_asset) => {});
  const _stats = await unlimitedMediaManager.getStorageStats();
  const _videoAssets = await unlimitedMediaManager.getAllMediaAssets({
    type: "video",
  });

  const _taggedAssets = await unlimitedMediaManager.getAllMediaAssets({
    tags: ["product"],
  });
  if (assets.length > 0) {
    const firstAsset = assets[0];
    const _retrieved = await unlimitedMediaManager.getMediaAsset(firstAsset.id);
  }
}

// Run the test
// biome-ignore lint/suspicious/noConsole: allowed in script
testUnlimitedCapacity().catch(console.error);
