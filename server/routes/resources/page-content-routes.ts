import { Router } from "express";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * PAGE CONTENT RESOURCE ROUTER
 *
 * Modular Express Router for Page Content Batch management.
 * PC-403: Standardized to use TwoTierBatchCache for SWR and stampede protection.
 */
const router = Router();

// ============================================================================
// BATCH ROUTES
// ============================================================================

router.get("/about-batch", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.about.batch();

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    cacheKey,
    async () => {
      const result = await aboutService.getBatch();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    {
      bypassCache: shouldBypassCache(req),
      swrConfig: {
        ttl: 120 * 60 * 1000,
        staleWhileRevalidate: 240 * 60 * 1000,
      },
    }
  )) || { data: null, benchmark: { hit: "MISS" } };

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(batchData);
});

router.get("/technology-batch", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.technology.batch();

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    cacheKey,
    async () => {
      const result = await technologyService.getBatch();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    {
      bypassCache: shouldBypassCache(req),
      swrConfig: {
        ttl: 120 * 60 * 1000,
        staleWhileRevalidate: 240 * 60 * 1000,
      },
    }
  )) || { data: null, benchmark: { hit: "MISS" } };

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));
  return res.json(batchData);
});

export default router;
