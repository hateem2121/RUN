import { removeUndefined } from "../../utils.js";

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
import { insertAboutTeamMessageSchema } from "../../../shared/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-team-message
 * Retrieve the team message
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getTeamMessage(), 10000, "Get team message");

  return result.match(
    (message) => {
      logger.info("[AboutTeamMessage] Retrieved team message");
      return res.json(message || null);
    },
    (error) => {
      logger.error("[AboutTeamMessage] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-team-message
 * Update the team message
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutTeamMessageSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutTeamMessage] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const updated = await withTimeout(
    aboutService.updateTeamMessage(removeUndefined(validation.data)),
    10000,
    "Update team message",
  );

  // Invalidation handled by service layer
  logger.info("[AboutTeamMessage] Team message updated successfully");
  return res.json(updated);
});

export default router;
