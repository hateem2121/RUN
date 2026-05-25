import { Router } from "express";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY BATCH RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Batch management.
 * PC-403: Standardized to use TwoTierBatchCache for SWR and stampede protection.
 */
const router = Router();

router.get("/", async (req, res) => {
  const startTime = performance.now();
  const cacheKey = CacheKeys.sustainability.batch();

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    cacheKey,
    async () => {
      const result = await sustainabilityService.getBatch();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    {
      bypassCache: shouldBypassCache(req),
      swrConfig: {
        ttl: 120 * 60 * 1000, // 120 min fresh (matches previous TTL)
        staleWhileRevalidate: 240 * 60 * 1000, // 240 min stale
      },
    },
  )) || { data: null, benchmark: { hit: "MISS" } };

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));

  return res.json(batchData);
});

export default router;
