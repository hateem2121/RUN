import { type Request, Router } from "express";
import { z } from "zod";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { manufacturingRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import { removeUndefined } from "../../utils.js";
import {
  validateManufacturingCaseStudy,
  validateManufacturingCaseStudyPartial,
  validateReorderCaseStudies,
} from "../../validation/manufacturing.js";

const router = Router();

/**
 * Admin Cache Bypass Utility
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

router.get("/", async (req, res) => {
  const { data: caseStudies, benchmark } = (await twoTierBatchCache.get(
    "manufacturing:case-studies",
    async () => {
      return await withTimeout(
        manufacturingRepository.getManufacturingCaseStudies(),
        10000,
        "Get manufacturing case studies",
      );
    },
    { bypassCache: shouldBypassCache(req) },
  )) || { data: [], benchmark: { hit: "MISS", totalTime: 0, l1Time: 0, l2Time: 0, dbTime: 0 } };

  res.setHeader("X-Cache-Hit", benchmark?.hit || "MISS");

  return res.json(caseStudies || []);
});

router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const caseStudy = await withTimeout(
    manufacturingRepository.getManufacturingCaseStudy(id),
    10000,
    "Get manufacturing case study",
  );

  if (!caseStudy) {
    return res.status(404).json({ error: "Case study not found" });
  }

  return res.json(caseStudy);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = validateManufacturingCaseStudy(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCaseStudies] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const newCaseStudy = await withTimeout(
    manufacturingRepository.createManufacturingCaseStudy(removeUndefined(validation.data)),
    10000,
    "Create manufacturing case study",
  );

  logger.info(`[ManufacturingCaseStudies] Created case study ${newCaseStudy.id}`);
  return res.status(201).json(newCaseStudy);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = validateManufacturingCaseStudyPartial(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCaseStudies] Validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const updated = await withTimeout(
    manufacturingRepository.updateManufacturingCaseStudy(id, removeUndefined(validation.data)),
    10000,
    "Update manufacturing case study",
  );

  if (!updated) {
    return res.status(404).json({ error: "Case study not found" });
  }

  logger.info(`[ManufacturingCaseStudies] Updated case study ${id}`);
  return res.json(updated);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const deleted = await withTimeout(
    manufacturingRepository.deleteManufacturingCaseStudy(id),
    10000,
    "Delete manufacturing case study",
  );

  if (!deleted) {
    return res.status(404).json({ error: "Case study not found" });
  }

  logger.info(`[ManufacturingCaseStudies] Deleted case study ${id}`);
  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = validateReorderCaseStudies(req.body);

  if (!validation.success) {
    logger.warn("[ManufacturingCaseStudies] Reorder validation failed:", validation.error);
    return res.status(400).json(validation.error);
  }

  const { caseStudies } = validation.data;
  const orderedIds = caseStudies.sort((a, b) => a.position - b.position).map((item) => item.id);

  await withTimeout(
    manufacturingRepository.reorderManufacturingCaseStudies(orderedIds),
    10000,
    "Reorder manufacturing case studies",
  );

  logger.info(`[ManufacturingCaseStudies] Reordered ${orderedIds.length} case studies`);
  return res.json({ success: true });
});

export default router;
