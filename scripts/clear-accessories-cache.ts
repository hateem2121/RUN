#!/usr/bin/env tsx

/**
 * Clear accessories cache to show newly added data
 */

import { UnifiedCache } from "../server/lib/unified-cache.js";

const cache = UnifiedCache.getInstance();

async function clearAccessoriesCache() {
  try {
    console.log("🧹 Clearing accessories cache...\n");

    // Clear all accessories-related cache keys
    await cache.clearPattern("accessories:");
    await cache.clearPattern("accessory:");

    console.log("✅ Accessories cache cleared successfully!");
    console.log("\n📝 The admin UI should now show fresh data.");
    console.log("   Refresh the page to see all accessories.\n");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

try {
  await clearAccessoriesCache();
} catch (error) {
  console.error("❌ Script failed:", error);
  process.exit(1);
}
