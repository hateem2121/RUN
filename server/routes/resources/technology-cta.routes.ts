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
import { insertTechnologyCtaSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";

const router = Router();

/**
 * GET /api/v1/technology-cta
 * Retrieve technology CTA section
 */
router.get("/", async (_req, res) => {
  try {
    const cta = await withTimeout(getStorage().getTechnologyCta(), 10000, "Get technology CTA");

    logger.info("[TechnologyCTA] Retrieved CTA data");
    return res.json(cta || null);
  } catch (error) {
    logger.error("[TechnologyCTA] Error getting CTA:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get technology CTA",
    });
  }
});

/**
 * PATCH /api/v1/technology-cta
 * Update technology CTA section
 */
router.patch("/", async (req, res) => {
  try {
    const validation = insertTechnologyCtaSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[TechnologyCTA] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updated = await withTimeout(
      getStorage().updateTechnologyCta(validation.data),
      10000,
      "Update technology CTA",
    );

    try {
      await CacheOperations.invalidateTechnology();
      logger.info("[TechnologyCTA] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[TechnologyCTA] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info("[TechnologyCTA] CTA updated successfully");
    return res.json(updated);
  } catch (error) {
    logger.error("[TechnologyCTA] Error updating CTA:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update technology CTA",
    });
  }
});

export default router;
