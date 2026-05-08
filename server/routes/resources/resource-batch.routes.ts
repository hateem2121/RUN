/**
 * RESOURCE BATCH ROUTES
 * Aggregated endpoint for modular content resources
 */

import { type Request, Router } from "express";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { ValidationError } from "../../lib/errors.js";
import { accessoryService } from "../../services/accessory.service.js";
import { miscService } from "../../services/misc.service.js";

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
    throw new ValidationError("Missing types query parameter");
  }

  const cacheKey = `resource-batch:${types.sort().join(",")}`;

  const { data: batchData, benchmark } = (await twoTierBatchCache.get(
    cacheKey,
    async () => {
      const promises: Promise<any>[] = [];
      const labels: string[] = [];

      if (types.includes("accessory")) {
        promises.push(accessoryService.getAccessories());
        labels.push("accessories");
      }
      if (types.includes("certificate")) {
        promises.push(miscService.getCertificates());
        labels.push("certificates");
      }
      if (types.includes("size_chart") || types.includes("sizechart")) {
        promises.push(miscService.getSizeCharts());
        labels.push("sizeCharts");
      }
      if (types.includes("fabric")) {
        promises.push(miscService.getFabrics());
        labels.push("fabrics");
      }
      if (types.includes("fiber")) {
        promises.push(miscService.getFibers());
        labels.push("fibers");
      }

      const results = await Promise.all(promises);
      const data: Record<string, any> = {};

      labels.forEach((label, index) => {
        const result = results[index];
        if (result.isOk()) {
          // accessoryService returns { accessories, total }
          if (label === "accessories") {
            data[label] = result.value.accessories;
          } else {
            data[label] = result.value;
          }
        } else {
          data[label] = []; // Fallback for specific failures in batch
        }
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
