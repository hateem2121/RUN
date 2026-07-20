/**
 * FOOTER CONFIGURATION ROUTES MODULE
 * Admin endpoints for managing footer configuration
 * Refactored to use FooterService for centralized business logic
 */

import express from "express";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import { footerService } from "../../services/footer.service.js";

const router = express.Router();

const CACHE_TTL_FOOTER = 3600; // 1 hour cache for footer

// PUBLIC endpoint for footer configuration
router.get("/footer", async (_req, res) => {
  const cacheKey = CacheKeys.footer.config();

  const cached = await unifiedCache.get<unknown>(cacheKey);
  if (cached) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }
  const result = await footerService.getFooterConfig();
  return result.match(
    async (response) => {
      await unifiedCache.set(cacheKey, response, CACHE_TTL_FOOTER * 1000);
      return res.json(response);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ADMIN endpoint for footer configuration
router.get("/admin/footer", authService.requireAdmin, async (_req, res) => {
  const cacheKey = CacheKeys.footer.config();
  const cached = await unifiedCache.get<unknown>(cacheKey);

  if (cached) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }
  const result = await footerService.getFooterConfig();
  return result.match(
    async (response) => {
      await unifiedCache.set(cacheKey, response, CACHE_TTL_FOOTER * 1000);
      return res.json(response);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/admin/footer", authService.requireAdmin, async (req, res) => {
  const result = await footerService.updateFooterConfig(req.body);

  return result.match(
    async (updated) => {
      // Invalidate Cache
      unifiedCache
        .delete(CacheKeys.footer.config())
        .then(() => logger.info(`[Footer] Cache invalidated for ${CacheKeys.footer.config()}`))
        .catch((cacheError) =>
          logger.warn("[Footer] Cache invalidation failed (non-fatal):", cacheError),
        );

      logger.info("[Footer] Footer configuration updated successfully", {
        id: updated?.id,
      });

      return res.json(updated);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

logger.debug("[Footer Config Routes] ✅ Footer configuration routes loaded (Service Refactored)");

export default router;
