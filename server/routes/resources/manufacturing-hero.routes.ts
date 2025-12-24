/**
 * MANUFACTURING HERO RESOURCES
 *
 * Dedicated router for Manufacturing Hero management
 * Replaces legacy page-content-routes.ts implementation
 */

import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { requireAdmin } from "../../middleware/auth.js";
import { validateManufacturingHeroPartial } from "../../validation/manufacturing.js";

const router = Router();

// Zod schema for validation is imported from validation/manufacturing.js to ensure consistency

// Helper function for null to undefined transformation (legacy compatibility)
const transformNullToUndefined = (
	obj: Record<string, unknown>,
): Record<string, unknown> => {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		result[key] = value === null ? undefined : value;
	}
	return result;
};

// GET /api/manufacturing-hero
router.get(
	"/manufacturing-hero",
	async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			// Set cache headers for performance optimization (30 mins)
			res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800");
			res.setHeader("X-Cache-TTL", "1800");
			res.setHeader("Vary", "Accept-Encoding");

			const hero = await withTimeout(
				getStorage().getManufacturingHero(),
				10000,
				"Get manufacturing hero",
			);

			res.json(hero || null);
		} catch (error) {
			next(error);
		}
	},
);

// PATCH /api/manufacturing-hero
router.patch(
	"/manufacturing-hero",
	requireAdmin,
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const transformedData = transformNullToUndefined(req.body);
			const validation = validateManufacturingHeroPartial(transformedData);

			if (!validation.success) {
				logger.warn("[ManufacturingHero] Validation failed:", validation.error);
				res.status(400).json(validation.error);
				return;
			}

			const hero = await withTimeout(
				getStorage().updateManufacturingHero(validation.data),
				10000,
				"Update manufacturing hero",
			);

			// Invalidate cache
			try {
				await CacheOperations.invalidateManufacturing();
				logger.info("[ManufacturingHero] ✅ Cache invalidated after update");
			} catch (cacheError) {
				logger.error(
					"[ManufacturingHero] ❌ Cache invalidation failed:",
					cacheError,
				);
			}

			// Audit Logging
			const user = req.user as any;
			const adminId = user?.claims?.sub || "unknown";
			logger.info(`[Audit] Admin ${adminId} updated manufacturing hero`);

			res.json(hero);
		} catch (error) {
			next(error);
		}
	},
);

export default router;
