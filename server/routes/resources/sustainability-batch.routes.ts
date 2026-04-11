/**
 * SUSTAINABILITY BATCH RESOURCE ROUTER
 *
 * Optimized batch endpoint to reduce NEON active time
 * Combines multiple sustainability queries into a single API call
 *
 * Routes:
 * - GET /api/sustainability/batch - Get all sustainability data in parallel
 */

import { type Request, Router } from "express";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { miscRepository, pageContentRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";

const router = Router();

/**
 * Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

/**
 * GET /api/sustainability/batch
 * Returns all sustainability data in a single request
 * Reduces NEON connection active time by using Promise.all for parallel fetching
 */
router.get("/", async (req, res) => {
  // PHASE 2A TASK 7: Two-tier cache with SWR
  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    "sustainability:batch",
    async () => {
      // Fetch all sustainability data in parallel to minimize NEON connection time
      const [hero, metrics, initiatives, goals, certificates, fabrics] = await Promise.all([
        withTimeout(
          pageContentRepository.getUnifiedSustainability(),
          10000,
          "Get unified sustainability",
        ),
        withTimeout(
          pageContentRepository.getSustainabilityMetrics(),
          10000,
          "Get sustainability metrics",
        ),
        withTimeout(
          pageContentRepository.getSustainabilityInitiatives(),
          10000,
          "Get sustainability initiatives",
        ),
        withTimeout(
          pageContentRepository.getSustainabilityGoals(),
          10000,
          "Get sustainability goals",
        ),
        withTimeout(miscRepository.getCertificates(), 10000, "Get certificates"),
        withTimeout(miscRepository.getFabrics(), 10000, "Get fabrics"),
      ]);

      // Construct batch response
      return {
        hero: hero || null,
        metrics: metrics || [],
        initiatives: initiatives || [],
        goals: goals || [],
        certificates: certificates || [],
        fabrics: fabrics || [],
      };
    },
    {
      bypassCache: shouldBypassCache(req),
      swrConfig: {
        ttl: 60 * 60 * 1000, // 1 hour TTL
        // fresh: 60 * 60 * 1000,  // Fresh for 1 hour
        // stale: 6 * 60 * 60 * 1000, // Serve stale for 6 hours while revalidating
        // expire: 24 * 60 * 60 * 1000 // Hard expiry at 24 hours
      },
    },
  )) || { data: null, benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  // CHUNK 5: Log performance metrics and benchmark results
  res.setHeader("X-Cache-Hit", benchmark.hit);

  if (benchmark.hit !== "MISS") {
    const cacheTime = benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
    logger.info(`[SustainabilityBatch] ✅ ${benchmark.hit} HIT (${cacheTime?.toFixed(2)}ms)`);
  } else {
    const dbTime = benchmark.dbTime || 0;
    logger.info(`[SustainabilityBatch] ⬆️ MISS + CACHED (${dbTime.toFixed(2)}ms)`);

    // CHUNK 5: Validate <300ms target for batch queries
    if (dbTime < 300) {
      logger.info(`✅ SUCCESS: Batch query ${dbTime.toFixed(2)}ms < 300ms target`);
    } else {
      logger.warn(`⚠️ WARN: Batch query ${dbTime.toFixed(2)}ms exceeds 300ms target`);
    }
  }

  return res.json({
    hero: batchData?.hero || null,
    metrics: (batchData?.metrics || []).map((m) => ({
      ...m,
      title: (m as any).title || m.name || "Untitled Metric",
    })),
    initiatives: (batchData?.initiatives || []).map((i) => ({
      ...i,
      title: i.title || (i as any).name || "Untitled Initiative",
    })),
    goals: (batchData?.goals || []).map((g) => ({
      ...g,
      title: g.title || (g as any).name || "Untitled Goal",
    })),
    certificates: batchData?.certificates || [],
    fabrics: batchData?.fabrics || [],
  });
});

export default router;
