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
import { insertAboutHeroSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/request-timeout.js";
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
  try {
    const hero = await withTimeout(aboutService.getHero(), 10000, "Get about hero");

    // Log result
    if (hero) {
      logger.info(`[AboutHero] Retrieved hero: ${hero.title}`);
    } else {
      logger.info("[AboutHero] No hero found");
    }

    return res.json(hero || null);
  } catch (error) {
    logger.error("[AboutHero] Error getting hero:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get about hero",
    });
  }
});

/**
 * PATCH /api/about-hero
 * Update the About page hero section
 */
router.patch("/", authService.requireAdmin, async (req, res) => {
  try {
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
    const updatedHero = await withTimeout(
      aboutService.updateHero(validation.data),
      10000,
      "Update about hero",
    );

    // Invalidate cache
    try {
      await CacheOperations.invalidateAbout();
      logger.info("[AboutHero] ✅ Cache invalidated after hero update");
    } catch (cacheError) {
      // CACHE FAILURE FALLBACK: Log error but do not fail the request
      // This ensures the DB update persists even if Redis/Cache is temporary down
      logger.error("[AboutHero] ⚠️ Cache invalidation failed - stale data may persist:", cacheError);
      // Optional: Trigger an alert or background retry mechanism here
    }

    logger.info("[AboutHero] Hero updated successfully");
    return res.json(updatedHero);
  } catch (error) {
    logger.error("[AboutHero] Error updating hero:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update about hero",
    });
  }
});

export default router;
