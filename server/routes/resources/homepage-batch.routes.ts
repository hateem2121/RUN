import type { HomepageProcessCard } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { logger } from "../../lib/monitoring/logger.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { publicTier } from "../../middleware/rate-limit-tiers.js";
import { productService } from "../../services/catalog/product.service.js";
import { homepageService } from "../../services/cms/homepage.service.js";

const router = Router();
router.use(publicTier);

/**
 * Homepage Batch API - Optimized with two-tier cache + stale-while-revalidate
 * Returns all homepage data in a single request to reduce frontend API calls
 */
router.get("/homepage-batch", async (req, res) => {
  const startTime = performance.now();

  // Support forced refresh for authenticated admins only
  const bypassCache = shouldBypassCache(req);

  if (bypassCache) {
    logger.debug("[Homepage Batch] Force refresh requested - invalidating all caches");
    await twoTierBatchCache.invalidate("homepage:batch");
    await CacheOperations.invalidateHomepage();
  }

  const fetchHomepageData = async () => {
    const timestamp = new Date().toISOString();

    const [
      heroRes,
      slogansRes,
      sectionsRes,
      featSettingsRes,
      productsRes,
      categoriesRes,
      processCardsRes,
    ] = await Promise.all([
      homepageService.getHero(),
      homepageService.getSlogans(),
      homepageService.getSections(),
      homepageService.getFeaturedProductsSettings(),
      productService.listProducts({ limit: 20 }),
      homepageService.getSections(), // fallback or categories
      homepageService.getProcessCards(),
    ]);

    const hero = heroRes.isOk() ? heroRes.value : null;
    const slogans = slogansRes.isOk() ? slogansRes.value : [];
    const sections = sectionsRes.isOk() ? sectionsRes.value : [];
    const featuredProductsSettings = featSettingsRes.isOk() ? featSettingsRes.value : null;
    const products = productsRes.isOk() ? productsRes.value.data : [];
    const categories = categoriesRes.isOk() ? categoriesRes.value : [];
    const processCards = processCardsRes.isOk() ? processCardsRes.value : [];

    return {
      hero: { result: hero, timestamp },
      slogans: { result: slogans, timestamp },
      sections: { result: sections, timestamp },
      featuredProductsSettings: {
        result: featuredProductsSettings,
        timestamp,
      },
      products: { result: products, timestamp },
      categories: { result: categories, timestamp },
      processCards: { result: processCards, timestamp },
    };
  };

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    "homepage:batch",
    fetchHomepageData,
    {
      bypassCache,
      swrConfig: {
        ttl: 5 * 60 * 1000,
        staleWhileRevalidate: 30 * 60 * 1000,
      },
    },
  )) || { data: null, benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  const responseTime = performance.now() - startTime;

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", responseTime.toFixed(2));

  if (benchmark.hit !== "MISS") {
    const cacheTime = benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
    logger.debug(`[Homepage Batch] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`);
  } else {
    logger.debug(`[Homepage Batch] ⬆️ MISS + CACHED (${benchmark.dbTime?.toFixed(2)}ms)`);
    res.setHeader("Cache-Control", "public, s-maxage=0, stale-while-revalidate=60");
  }

  if (!batchData) {
    return res.status(503).json({ error: "Homepage data temporarily unavailable" });
  }

  return res.json({
    ...batchData,
    processCards: batchData?.processCards
      ? {
          ...batchData.processCards,
          result: (batchData.processCards.result || []).map((p: HomepageProcessCard) => ({
            ...p,
            title: p.title || "Untitled Process",
          })),
        }
      : { result: [], timestamp: new Date().toISOString() },
  });
});

/**
 * Process Cards standalone endpoint for backward compatibility
 */
router.get("/homepage-process-cards", async (req, res) => {
  const startTime = performance.now();
  const bypassCache = shouldBypassCache(req);

  const { data, benchmark } = (await twoTierBatchCache.get(
    "homepage:process-cards",
    async () => {
      const result = await homepageService.getProcessCards();
      const processCards = result.isOk() ? result.value : [];

      return {
        result: processCards,
        timestamp: new Date().toISOString(),
      };
    },
    {
      bypassCache,
    },
  )) || { data: null, benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  res.setHeader("Cache-Control", "public, max-age=600");

  if (!data) {
    return res.status(503).json({ error: "Process cards temporarily unavailable" });
  }

  return res.json(data);
});

/**
 * Cache Performance Monitoring endpoint
 */
router.get("/performance-monitoring", async (_req, res) => {
  const batchCacheMetrics = twoTierBatchCache.getMetrics();

  const monitoring = {
    timestamp: new Date().toISOString(),
    cacheSystem: "TwoTierBatchCache",
    batchCacheMetrics: {
      hitRate: `${batchCacheMetrics.hitRate.toFixed(2)}%`,
      l1HitRate: `${batchCacheMetrics.l1HitRate.toFixed(2)}%`,
      l2HitRate: `${batchCacheMetrics.l2HitRate.toFixed(2)}%`,
      missRate: `${batchCacheMetrics.missRate.toFixed(2)}%`,
      avgL1Time: `${batchCacheMetrics.avgL1Time.toFixed(2)}ms`,
      avgL2Time: `${batchCacheMetrics.avgL2Time.toFixed(2)}ms`,
      avgDbTime: `${batchCacheMetrics.avgDbTime.toFixed(2)}ms`,
      totalRequests: batchCacheMetrics.totalRequests,
    },
    successCriteria: {
      hitRateTarget: ">80%",
      hitRateCurrent: `${batchCacheMetrics.hitRate.toFixed(2)}%`,
      hitRateMet: batchCacheMetrics.hitRate >= 80 ? "✅ YES" : "❌ NO",
      batchQueryTarget: "<300ms",
      batchQueryCurrent: `${batchCacheMetrics.avgDbTime.toFixed(2)}ms`,
      batchQueryMet: batchCacheMetrics.avgDbTime < 300 ? "✅ YES" : "❌ NO",
    },
    systemHealth: {
      databaseDriver: "HTTP-based Neon (no TCP pool exhaustion)",
      cacheArchitecture: "Two-tier: L1(3min in-memory) + L2(30min KV)",
      parallelization: "Promise.all for batch queries",
      benchmarking: "Real-time performance tracking enabled",
    },
  };

  res.json(monitoring);
});

logger.debug("[Homepage Batch] ✅ Homepage batch routes loaded (resources/)");

export default router;
