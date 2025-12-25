#!/usr/bin/env node

/**
 * PHASE 1: Non-Destructive Database Investigation
 * Investigating missing media assets referenced in homepage
 */

import fetch from "node-fetch";

async function investigateMediaAssets() {
  try {
    const baseUrl = "http://localhost:3000/api";
    const mediaResponse = await fetch(`${baseUrl}/media`);
    const mediaData = await mediaResponse.json();
    const allAssets = mediaData.success ? mediaData.data.data : [];
    const batchResponse = await fetch(`${baseUrl}/homepage-batch`);
    const batchData = await batchResponse.json();

    const { hero, processCards, sections, products, categories } = batchData;

    // Extract asset IDs mentioned in console logs as missing
    const suspectedMissingIds = [
      184,
      185,
      186,
      187, // Process card assets
      336,
      331,
      335,
      334,
      333,
      332,
      337,
      338,
      339,
      343,
      342,
      341,
      340,
      309, // Product media
    ];

    // Create lookup map for quick existence checks
    const assetMap = new Map();
    allAssets.forEach((asset) => {
      assetMap.set(asset.id, asset);
    });

    const existingAssets = [];
    const actuallyMissingAssets = [];

    suspectedMissingIds.forEach((id) => {
      if (assetMap.has(id)) {
        existingAssets.push(id);
        const asset = assetMap.get(id);
      } else {
        actuallyMissingAssets.push(id);
      }
    });

    // Hero background
    if (hero?.backgroundMediaId) {
      const exists = assetMap.has(hero.backgroundMediaId);
    }
    processCards?.forEach((card, index) => {
      if (card.iconMediaId) {
        const exists = assetMap.has(card.iconMediaId);
      }
      if (card.mediaId) {
        const exists = assetMap.has(card.mediaId);
      }
    });
    products?.forEach((product, index) => {
      let hasIssues = false;

      // Check primary image
      if (product.primaryImageId) {
        const exists = assetMap.has(product.primaryImageId);
        if (!exists) {
          hasIssues = true;
        }
      }

      // Check primary video
      if (product.primaryVideoId) {
        const exists = assetMap.has(product.primaryVideoId);
        if (!exists) {
          hasIssues = true;
        }
      }

      // Check image arrays
      if (product.imageIds && Array.isArray(product.imageIds)) {
        const missingImages = product.imageIds.filter((id) => !assetMap.has(id));
        if (missingImages.length > 0) {
          hasIssues = true;
        }
      }

      // Check video arrays
      if (product.videos && Array.isArray(product.videos)) {
        const missingVideos = product.videos.filter((id) => !assetMap.has(id));
        if (missingVideos.length > 0) {
          hasIssues = true;
        }
      }

      if (!hasIssues && (product.imageIds?.length || product.videos?.length)) {
      }
    });
    const assetIds = allAssets.map((a) => a.id).sort((a, b) => a - b);

    for (let id = 180; id <= 350; id++) {
      if (!assetMap.has(id) && suspectedMissingIds.includes(id)) {
      }
    }

    if (actuallyMissingAssets.length > 0) {
    } else {
    }
  } catch (error) {}
}

// Run investigation
investigateMediaAssets()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
