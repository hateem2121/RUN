import { removeUndefined } from "../../utils.js";

/**
 * ABOUT HERO RESOURCE ROUTER
 *
 * Modular Express Router for About Hero management
 * Handles GET and PATCH operations for the about page hero section
 *
 * Routes:
 * - GET    /api/about-hero          - Get hero data
 * - PATCH  /api/about-hero          - Update hero data
 */

import { Router } from "express";
import { insertAboutHeroSchema } from "../../../shared/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased from 3600s (60min) to 10800s (180min)
// Cache constants removed as they were unused

/**
 * GET /api/about-hero
 * Retrieve the About page hero section
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getHero(), 10000, "Get about hero");

  return result.match(
    (hero) => {
      if (hero) {
        logger.info(`[AboutHero] Retrieved hero: ${hero.title}`);
      } else {
        logger.info("[AboutHero] No hero found");
      }
      return res.json(hero || null);
    },
    (error) => {
      logger.error("[AboutHero] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/about-hero
 * Update the About page hero section
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  // Validate request body
  const validation = insertAboutHeroSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutHero] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  // Update hero
  const result = await withTimeout(
    aboutService.updateHero(removeUndefined(validation.data)),
    10000,
    "Update about hero",
  );

  return result.match(
    (updatedHero) => {
      logger.info("[AboutHero] Hero updated successfully");
      return res.json(updatedHero);
    },
    (error) => {
      logger.error("[AboutHero] Update failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

export default router;
