/**
 * ABOUT TEAM MESSAGE RESOURCE ROUTER
 *
 * Modular Express Router for About Team Message management
 * Handles GET and PATCH operations for the team message section
 *
 * Routes:
 * - GET    /api/v1/about-team-message    - Get team message
 * - PATCH  /api/v1/about-team-message    - Update team message
 */

import { Router } from "express";
import { insertAboutTeamMessageSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { requireAdmin } from "../../middleware/auth.js";
import { aboutService } from "../../services/about.service.js";

const router = Router();

/**
 * GET /api/v1/about-team-message
 * Retrieve the team message
 */
router.get("/", async (_req, res) => {
  try {
    const message = await withTimeout(aboutService.getTeamMessage(), 10000, "Get team message");

    logger.info(`[AboutTeamMessage] Retrieved team message`);
    return res.json(message || null);
  } catch (error) {
    logger.error("[AboutTeamMessage] Error getting message:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get team message",
    });
  }
});

/**
 * PATCH /api/v1/about-team-message
 * Update the team message
 */
router.patch("/", requireAdmin, async (req, res) => {
  try {
    const validation = insertAboutTeamMessageSchema.partial().safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutTeamMessage] Validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    const updated = await withTimeout(
      aboutService.updateTeamMessage(validation.data),
      10000,
      "Update team message",
    );

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutTeamMessage] ✅ Cache invalidated after update");
    } catch (cacheError) {
      logger.error("[AboutTeamMessage] ❌ Cache invalidation failed:", cacheError);
    }

    logger.info("[AboutTeamMessage] Team message updated successfully");
    return res.json(updated);
  } catch (error) {
    logger.error("[AboutTeamMessage] Error updating message:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update team message",
    });
  }
});

export default router;
