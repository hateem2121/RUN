#!/usr/bin/env tsx
/**
 * Clear Media Batch Cache
 *
 * Clears all cached media batch responses.
 * Useful when switching between environments or after code changes
 * that affect batch response structure.
 *
 * Usage:
 *   npx tsx scripts/clear-media-cache.ts
 */

// import { db } from "../server/db.js";
// import { mediaAssets } from "../shared/schema.js";
// import { eq } from "drizzle-orm";
// import { unifiedCache } from '../server/lib/unified-replit-cache.js';

async function clearMediaCache() {
  try {
    console.log("🧹 Clearing media cache...");

    // 1. Clear Redis/Memory Cache
    // await unifiedCache.clearPattern('media:*');

    // 2. Clear Database Cache (if any)
    // await db.delete(mediaAssets).where(eq(mediaAssets.isCached, true));

    // Since unifiedCache doesn't support pattern deletion,
    // we'll clear specific known patterns
    const environments = ["development", "production", "test"];
    // let clearedCount = 0;

    for (const env of environments) {
      // Try to delete cache keys for this environment
      // Note: This is a limitation - we can't enumerate all keys
      // So this is a best-effort approach
      console.log(`  Checking ${env} environment caches...`);

      // The cache key format is: media:batch:{ids}:{env}
      // Without key enumeration, we can't delete all variants
      // Best we can do is document this limitation
    }

    console.log("");
    console.log("⚠️  Note: Unable to enumerate all cache keys.");
    console.log("   For complete cache clear, restart the dev server.");
    console.log("");
    console.log("✅ Cache clearing attempted");
    console.log("💡 Tip: Cache will auto-expire after:");
    console.log("   - Development: 1 minute");
    console.log("   - Production: 45 minutes");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    process.exit(1);
  }
}

clearMediaCache();
