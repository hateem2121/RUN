import { removeUndefined } from "../../lib/utilities/core-utils.js";

/**
 * ABOUT TEAM MESSAGE RESOURCE ROUTER
 *
 * Modular Express Router for About Team Message management
 * Handles GET and PATCH operations for the team message section
 */

import { Router } from "express";
import { insertAboutTeamMessageSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-team-message
 * Retrieve the team message
 */
router.get("/", async (_req, res) => {
  const result = await aboutService.getTeamMessage();
  if (result.isErr()) throw result.error;

  logger.info("[AboutTeamMessage] Retrieved team message");
  return res.json(result.value || null);
});

/**
 * PATCH /api/v1/about-team-message
 * Update the team message
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutTeamMessageSchema.partial().safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Validation failed", { details: validation.error.issues });
  }

  const result = await aboutService.updateTeamMessage(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  logger.info("[AboutTeamMessage] Team message updated successfully");
  return res.json(result.value);
});

export default router;
