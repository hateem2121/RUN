/**
 * HOMEPAGE BATCH ROUTES MODULE
 * Page-specific aggregated data endpoint for Homepage
 * Relocated from modules/ to resources/ for consistent architecture (October 15, 2025)
 *
 * Caching strategy (stale-while-revalidate):
 * - Cache hit:  Cache-Control: public, s-maxage=60, stale-while-revalidate=3600
 * - Cache miss: Cache-Control: public, s-maxage=0, stale-while-revalidate=60
 * - Visitor:    Cache-Control: public, s-maxage=60, stale-while-revalidate=3600
 *
 * Server-side two-tier batch cache (UnifiedCache) remains active for performance.
 */

import type { HomepageProcessCard } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { logger } from "../../lib/monitoring/logger.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { homepageRepository, productRepository } from "../../services/repositories/index.js";

const router = Router();

/**
 * CHUNK 5: Homepage Batch API - Optimized with two-tier cache + stale-while-revalidate
 * Returns all homepage data in a single request to reduce frontend API calls
 * Uses TwoTierBatchCache (L1: 3min, L2: 30min) for performance
 */
router.get("/homepage-batch", async (req, res) => {
  const startTime = performance.now();

  // Support forced refresh for authenticated admins only — unauthenticated bypass is a DoS vector
  const bypassCache = shouldBypassCache(req);

  if (bypassCache) {
    logger.debug("[Homepage Batch] Force refresh requested - invalidating all caches");
    await twoTierBatchCache.invalidate("homepage:batch");
    await CacheOperations.invalidateHomepage();
  }

  // CHUNK 5: Two-tier cache with benchmarking - fetch function for reuse
  const fetchHomepageData = async () => {
    const timestamp = new Date().toISOString();

    // PERFORMANCE: Fetch all data in parallel
    // Process cards now included in batch (Remediation Feb 15, 2026) to eliminate hydration waterfall
    const [hero, slogans, sections, featuredProductsSettings, products, categories, processCards] =
      await Promise.all([
        homepageRepository.getHomepageHero(),
        homepageRepository.getHomepageSlogans(),
        homepageRepository.getHomepageSections(),

        homepageRepository.getHomepageFeaturedProductsSettings(),
        productRepository.getProducts(20),
        productRepository.getCategories(),
        homepageRepository.getHomepageProcessCards(),
      ]);

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

  // PHASE 2A TASK 7: Get data with SWR-enabled two-tier cache
  // Set Cache-Control for visitors (stale-while-revalidate)
  // s-maxage=60: Shared cache (content delivery networks) should consider it fresh for 60 seconds
  // stale-while-revalidate=3600: Cache can serve stale content for up to 1 hour while fetching a fresh version
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    "homepage:batch",
    fetchHomepageData,
    {
      bypassCache,
      swrConfig: {
        ttl: 5 * 60 * 1000, // 5 minutes fresh TTL
        staleWhileRevalidate: 30 * 60 * 1000, // serve stale for 30min while revalidating
      },
    },
  )) || { data: null, benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  const responseTime = performance.now() - startTime;

  // CHUNK 5: Log performance metrics and benchmark results
  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", responseTime.toFixed(2));

  // Conditional Cache-Control: serve CDN-friendly headers on cache hits, origin-only on misses
  if (benchmark.hit !== "MISS") {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=0, stale-while-revalidate=60");
  }

  if (benchmark.hit !== "MISS") {
    const cacheTime = benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
    logger.info(`[Homepage Batch] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`);
    logger.debug(`[Homepage Batch] Total response time: ${responseTime.toFixed(1)}ms`);
  } else {
    const dbTime = benchmark.dbTime || 0;
    logger.info(`[Homepage Batch] ⬆️ MISS + CACHED (${dbTime.toFixed(2)}ms)`);

    // CHUNK 5: Validate <300ms target for batch queries
    if (dbTime < 300) {
      logger.info(`✅ SUCCESS: Homepage batch ${dbTime.toFixed(2)}ms < 300ms target`);
    } else if (dbTime < 500) {
      logger.debug(`[Homepage Batch] Response time ${dbTime.toFixed(1)}ms within acceptable range`);
    } else {
      logger.warn(`⚠️ WARN: Homepage batch ${dbTime.toFixed(2)}ms exceeds 500ms target`);
    }
  }

  if (!batchData) {
    return res.status(503).json({ error: "Homepage data temporarily unavailable" });
  }

  // ALIGNMENT: Provide defensive fallbacks and property aliases for process cards
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

// CHUNK 5: Cache Performance Monitoring
router.get("/performance-monitoring", async (_req, res) => {
  // Get TwoTierBatchCache metrics
  const batchCacheMetrics = twoTierBatchCache.getMetrics();

  const monitoring = {
    timestamp: new Date().toISOString(),
    cacheSystem: "TwoTierBatchCache (Chunk 5)",
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

// CHUNK 5: Separate process cards endpoint with two-tier cache
// DELIBERATE ARCHITECTURE CHOICE: Process cards are significantly heavier than other homepage components.
// They are split into this standalone endpoint intentionally for lazy loading and to prevent hydration waterfalls,
// not due to redundancy with the main /homepage-batch endpoint.
router.get("/homepage-process-cards", async (req, res) => {
  const startTime = performance.now();
  // Apply same admin-only bypass guard as /homepage-batch — unauthenticated refresh=1 is a DoS vector
  const isAdmin =
    (req as { session?: { user?: { role?: string } } }).session?.user?.role === "admin";
  const bypassCache =
    isAdmin && (req.query.refresh === "1" || req.headers["cache-control"] === "no-cache");

  // PHASE 2A TASK 7: Two-tier cache with SWR
  const { data, benchmark } = (await twoTierBatchCache.get(
    "homepage:process-cards",
    async () => {
      const processCards = await homepageRepository.getHomepageProcessCards();

      return {
        result: processCards,
        timestamp: new Date().toISOString(),
      };
    },
    {
      bypassCache,
    },
  )) || { data: null, benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  // CHUNK 5: Log performance metrics
  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  res.setHeader("Cache-Control", "public, max-age=600");

  if (benchmark.hit !== "MISS") {
    const cacheTime = benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
    logger.debug(`[Process Cards] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`);
  } else {
    logger.debug(`[Process Cards] ⬆️ MISS + CACHED (${benchmark.dbTime?.toFixed(2)}ms)`);
  }

  if (!data) {
    return res.status(503).json({ error: "Process cards temporarily unavailable" });
  }

  return res.json(data);
});

// Individual homepage endpoints are handled by homepage-management.routes.ts
// This module focuses specifically on the batch API for optimal performance

logger.debug("[Homepage Batch] ✅ Homepage batch routes loaded (resources/)");

export default router;
