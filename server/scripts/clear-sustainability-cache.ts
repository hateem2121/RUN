import { twoTierBatchCache } from "../lib/cache/two-tier-batch.js";
import { UnifiedCache } from "../lib/cache/unified-cache.js";
import { logger } from "../lib/monitoring/logger.js";

async function clearSustainabilityCache() {
  try {
    const unifiedCache = UnifiedCache.getInstance();

    logger.info("[CacheFix] Clearing sustainability caches...");

    // Clear unified table cache
    await unifiedCache.del("sustainability:unified");

    // Clear batch API cache
    await twoTierBatchCache.invalidate("sustainability:batch");

    logger.info("[CacheFix] ✅ Sustainability caches cleared successfully.");
  } catch (error) {
    logger.error("[CacheFix] ❌ Failed to clear sustainability caches:", error);
  } finally {
    process.exit(0);
  }
}

clearSustainabilityCache();
