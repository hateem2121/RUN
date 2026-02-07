
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";

async function clearTechnologyCache() {
  console.log("🧹 Clearing Technology Page cache...");

  try {
    // 1. Invalidate via Strategy
    await CacheOperations.invalidateTechnology();
    console.log("✅ Invalidated via CacheOperations strategy");

    // 2. Explicitly clear batch key just in case
    const batchKey = "technology:batch"; // From CacheKeys.technology.batch()
    await unifiedCache.delete(batchKey);
    console.log(`✅ Explicitly deleted key: ${batchKey}`);

    console.log("✨ Cache cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear cache:", error);
    process.exit(1);
  }
}

clearTechnologyCache();
