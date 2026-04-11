import { CacheOperations } from "../server/lib/cache/cache-strategies.js";
import { logger } from "../server/lib/monitoring/logger.js";

async function clearCaches() {
  logger.info("🧹 Starting Cache Invalidation...");

  try {
    await CacheOperations.invalidateAbout();
    await CacheOperations.invalidateSustainability();
    await CacheOperations.invalidateManufacturing();
    await CacheOperations.invalidateTechnology();
    await CacheOperations.invalidateFabrics();
    await CacheOperations.invalidateFibers();
    await CacheOperations.invalidateCertificates();
    await CacheOperations.invalidateSizeCharts();
    await CacheOperations.invalidateAccessories();
    await CacheOperations.invalidateNavigation();
    await CacheOperations.invalidateHomepage();

    logger.info("✅ All relevant caches invalidated!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Cache invalidation failed:", error);
    process.exit(1);
  }
}

clearCaches();
