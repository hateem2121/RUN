/**
 * RESOURCE BATCH ROUTES
 * Aggregated endpoint for modular content resources
 */

import { type Request, Router } from "express";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { accessoryRepository, miscRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";

const router = Router();

/**
 * GET /api/resources/batch
 * Aggregated endpoint for Certifications, Accessories, Size Charts, Fabrics, and Fibers
 * Query Params: ?types=accessory,certificate,size_chart,fabric,fiber
 */
router.get("/batch", async (req: Request, res) => {
  const startTime = performance.now();
  const typesQuery = (req.query.types as string) || "";
  const types = typesQuery.split(",").map((t) => t.trim().toLowerCase());

  if (!typesQuery) {
    return res.status(400).json({ error: "Missing types query parameter" });
  }

  const cacheKey = `resource-batch:${types.sort().join(",")}`;

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    cacheKey,
    async () => {
      const promises: Promise<any>[] = [];
      const labels: string[] = [];

      if (types.includes("accessory")) {
        promises.push(withTimeout(accessoryRepository.getAccessories(), 5000, "Fetch accessories"));
        labels.push("accessories");
      }
      if (types.includes("certificate")) {
        promises.push(withTimeout(miscRepository.getCertificates(), 5000, "Fetch certificates"));
        labels.push("certificates");
      }
      if (types.includes("size_chart") || types.includes("sizechart")) {
        promises.push(withTimeout(miscRepository.getSizeCharts(), 5000, "Fetch size charts"));
        labels.push("sizeCharts");
      }
      if (types.includes("fabric")) {
        promises.push(withTimeout(miscRepository.getFabrics(), 5000, "Fetch fabrics"));
        labels.push("fabrics");
      }
      if (types.includes("fiber")) {
        promises.push(withTimeout(miscRepository.getFibers(), 5000, "Fetch fibers"));
        labels.push("fibers");
      }

      const results = await Promise.all(promises);
      const data: Record<string, any> = {};
      labels.forEach((label, index) => {
        data[label] = results[index];
      });

      return data;
    },
    {
      swrConfig: {
        ttl: 15 * 60 * 1000, // 15 min fresh
        staleWhileRevalidate: 60 * 60 * 1000, // 1 hr stale
      },
    },
  )) || { data: null, benchmark: { hit: "MISS" } };

  res.setHeader("X-Cache-Hit", benchmark.hit);
  res.setHeader("X-Response-Time", (performance.now() - startTime).toFixed(2));

  return res.json(batchData);
});

export default router;
