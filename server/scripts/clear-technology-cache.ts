import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";

async function clearTechnologyCache() {
  try {
    // 1. Invalidate via Strategy
    await CacheOperations.invalidateTechnology();

    // 2. Explicitly clear batch key just in case
    const batchKey = "technology:batch"; // From CacheKeys.technology.batch()
    await unifiedCache.delete(batchKey);
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

clearTechnologyCache();
