import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";

async function clearAboutCache() {
  try {
    await CacheOperations.invalidateAbout();
    // Also clear specific batch key just in case pattern matching is tricky
    // CacheKeys.about.batch() -> "about:batch"
    await unifiedCache.delete("about:batch");
  } catch (_error) {}
  process.exit(0);
}

clearAboutCache();
