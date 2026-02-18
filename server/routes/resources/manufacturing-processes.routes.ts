import { removeUndefined } from "../../utils.js";

/**
 * MANUFACTURING PROCESSES RESOURCE ROUTER
 *
 * Modular Express Router for Manufacturing Processes management
 * Handles full CRUD + reorder operations for manufacturing processes
 *
 * Routes:
 * - GET    /api/v1/manufacturing-processes           - List all processes
 * - GET    /api/v1/manufacturing-processes/:id       - Get single process
 * - POST   /api/v1/manufacturing-processes           - Create new process
 * - PATCH  /api/v1/manufacturing-processes/:id       - Update process
 * - DELETE /api/v1/manufacturing-processes/:id       - Delete process
 * - PATCH  /api/v1/manufacturing-processes/reorder   - Reorder processes
 */

import { type Request, Router } from "express";
import { z } from "zod";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { pageContentRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import {
  validateManufacturingProcess,
  validateManufacturingProcessPartial,
  validateReorderProcesses,
} from "../../validation/manufacturing.js";

const router = Router();

/**
 * CHUNK 7: Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

router.get("/", async (req, res) => {
  try {
    // CHUNK 5: Two-tier cache with benchmarking
    const { data: processes, benchmark } = await twoTierBatchCache.get(
      "manufacturing:processes",
      async () => {
        return await withTimeout(
          pageContentRepository.getManufacturingProcesses(),
          10000,
          "Get manufacturing processes",
        );
      },
      { bypassCache: shouldBypassCache(req) },
    );

    // Log performance metrics
    res.setHeader("X-Cache-Hit", benchmark.hit);
    if (benchmark.hit !== "MISS") {
      const cacheTime = benchmark.hit === "L1" ? benchmark.l1Time : benchmark.l2Time;
      logger.info(
        `[ManufacturingProcesses] ✅ ${benchmark.hit} HIT: ${
          processes.length
        } processes (${cacheTime?.toFixed(2)}ms)`,
      );
    } else {
      logger.info(
        `[ManufacturingProcesses] ⬆️ MISS + CACHED: ${
          processes.length
        } processes (${benchmark.dbTime?.toFixed(2)}ms)`,
      );
    }

    return res.json(processes);
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error getting processes:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to get processes",
      },
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const process = await withTimeout(
      pageContentRepository.getManufacturingProcess(id),
      10000,
      "Get manufacturing process",
    );

    if (!process) {
      return res.status(404).json({ error: "Process not found" });
    }

    logger.info(`[ManufacturingProcesses] Retrieved process ${id}`);
    return res.json(process);
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error getting process:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get process",
    });
  }
});

router.post("/", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateManufacturingProcess(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingProcesses] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const newProcess = await withTimeout(
      pageContentRepository.createManufacturingProcess(removeUndefined(validation.data)),
      10000,
      "Create manufacturing process",
    );

    try {
      await twoTierBatchCache.invalidate("manufacturing:processes");
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingProcesses] ✅ Cache invalidated after creation");
    } catch (cacheError) {
      logger.error("[ManufacturingProcesses] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingProcesses] Created process ${newProcess.id}`);
    return res.status(201).json(newProcess);
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error creating process:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create process",
    });
  }
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validation = validateManufacturingProcessPartial(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingProcesses] Validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updated = await withTimeout(
      pageContentRepository.updateManufacturingProcess(id, removeUndefined(validation.data)),
      10000,
      "Update manufacturing process",
    );

    if (!updated) {
      return res.status(404).json({ error: "Process not found" });
    }

    try {
      await twoTierBatchCache.invalidate("manufacturing:processes");
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingProcesses] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[ManufacturingProcesses] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingProcesses] Updated process ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error updating process:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update process",
    });
  }
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      pageContentRepository.deleteManufacturingProcess(id),
      10000,
      "Delete manufacturing process",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Process not found" });
    }

    try {
      await twoTierBatchCache.invalidate("manufacturing:processes");
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingProcesses] ✅ Cache invalidated after deletion");
    } catch (cacheError) {
      logger.error("[ManufacturingProcesses] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingProcesses] Deleted process ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error deleting process:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete process",
    });
  }
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = validateReorderProcesses(req.body);

    if (!validation.success) {
      logger.warn("[ManufacturingProcesses] Reorder validation failed:", validation.error);
      return res.status(400).json(validation.error);
    }

    const updates = await Promise.all(
      removeUndefined(validation.data).processes.map(
        ({ id, position }: { id: number; position: number }) =>
          pageContentRepository.updateManufacturingProcess(id, { sortOrder: position }),
      ),
    );

    try {
      await twoTierBatchCache.invalidate("manufacturing:processes");
      await CacheOperations.invalidateManufacturing();
      logger.info("[ManufacturingProcesses] ✅ Cache invalidated after reorder");
    } catch (cacheError) {
      logger.error("[ManufacturingProcesses] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info(`[ManufacturingProcesses] Reordered ${updates.length} processes`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[ManufacturingProcesses] Error reordering processes:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder processes",
    });
  }
});

/**
 * PHASE 4: Cache warming now handled by CacheWarmupRegistry
 * Old HTTP-based warming removed to eliminate duplicate DB queries
 * See: server/lib/cache-warmup-registry.ts -> manufacturingProcesses
 */

export default router;
