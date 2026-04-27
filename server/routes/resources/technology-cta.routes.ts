import { removeUndefined } from "../../utils.js";

/**
 * TECHNOLOGY CTA RESOURCE ROUTER
 *
 * Modular Express Router for Technology Call-to-Action management
 * Handles GET and PATCH operations for the CTA section
 *
 * Routes:
 * - GET    /api/v1/technology-cta    - Get CTA data
 * - PATCH  /api/v1/technology-cta    - Update CTA data
 */

import { Router } from "express";
import { insertTechnologyCtaSchema } from "../../../shared/index.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { technologyRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/technology-cta
 * Retrieve technology CTA section
 */
router.get("/", async (_req, res) => {
  const cta = await withTimeout(
    technologyRepository.getTechnologyCta(),
    10000,
    "Get technology CTA",
  );

  logger.info("[TechnologyCTA] Retrieved CTA data");
  return res.json(cta || null);
});

/**
 * PATCH /api/v1/technology-cta
 * Update technology CTA section
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyCtaSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[TechnologyCTA] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    technologyRepository.updateTechnologyCta(removeUndefined(validation.data)),
    10000,
    "Update technology CTA",
  );

  CacheOperations.invalidateTechnology()
    .then(() => logger.info("[TechnologyCTA] ✅ Cache invalidated after update"))
    .catch((cacheError) =>
      logger.error("[TechnologyCTA] ❌ Cache invalidation failed:", cacheError),
    );

  logger.info("[TechnologyCTA] CTA updated successfully");
  return res.json(updated);
});

export default router;
