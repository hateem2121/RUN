
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";

async function clearAboutCache() {
  console.log("🧹 Clearing About Page Cache...");

  try {
    await CacheOperations.invalidateAbout();
    // Also clear specific batch key just in case pattern matching is tricky
    // CacheKeys.about.batch() -> "about:batch"
    await unifiedCache.delete("about:batch");
    
    console.log("✅ About Page Cache Cleared!");
  } catch (error) {
    console.error("❌ Cache clear failed:", error);
  }
  process.exit(0);
}

clearAboutCache();
