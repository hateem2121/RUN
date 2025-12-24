/**
 * TECHNOLOGY GRADIENT SETTINGS RESOURCE ROUTER
 *
 * Modular Express Router for Technology Gradient Settings management
 * Handles GET and PATCH operations for gradient settings
 *
 * Routes:
 * - GET    /api/v1/technology-gradient-settings    - Get gradient settings
 * - PATCH  /api/v1/technology-gradient-settings    - Update gradient settings
 */

import { Router } from "express";
import {
	insertTechnologyGradientSettingsSchema,
	technologyGradientFrontendSchema,
} from "../../../shared/schema.js";
import { CacheKeys, CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { unifiedCache } from "../../lib/unified-cache.js";

const router = Router();

// Cache TTL constant (120 minutes in milliseconds)
// PHASE 1 OPTIMIZATION: Increased from 900000ms (15min) to 7200000ms (120min)
const CACHE_TTL_SETTINGS = 7200000;

/**
 * GET /api/v1/technology-gradient-settings
 * Retrieve technology gradient settings with KV cache layer
 */
router.get("/", async (_req, res) => {
	const startTime = performance.now();
	try {
		// Check cache first
		const cacheKey = CacheKeys.technology.gradientSettings();
		const cached = await unifiedCache.get(cacheKey);

		if (cached) {
			logger.info(
				"[TechnologyGradientSettings] ✅ Returning cached gradient settings",
			);
			res.setHeader("X-Cache-Hit", "true");
			res.setHeader(
				"X-Response-Time",
				(performance.now() - startTime).toString(),
			);
			return res.json(cached);
		}

		logger.info(
			"[TechnologyGradientSettings] Cache miss - fetching from database",
		);

		// Cache miss - fetch from storage
		const settings = await withTimeout(
			getStorage().getTechnologyGradientSettings(),
			10000,
			"Get technology gradient settings",
		);

		// Cache the result for 120 minutes
		if (settings) {
			await unifiedCache.set(cacheKey, settings, CACHE_TTL_SETTINGS);
			logger.info(
				"[TechnologyGradientSettings] Settings cached for 120 minutes / 2 hours",
			);
		}

		res.setHeader("X-Cache-Hit", "false");
		res.setHeader(
			"X-Response-Time",
			(performance.now() - startTime).toString(),
		);
		logger.info(
			"[TechnologyGradientSettings] Retrieved gradient settings from database",
		);
		return res.json(settings || null);
	} catch (error) {
		logger.error("[TechnologyGradientSettings] Error getting settings:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to get gradient settings",
		});
	}
});

/**
 * PATCH /api/v1/technology-gradient-settings
 * Update technology gradient settings
 */
router.patch("/", async (req, res) => {
	try {
		let storageData: any = {};

		// STRATEGY 1: Check if request matches the Frontend Schema (flat structure)
		// This handles the standard Admin UI request
		const frontendValidation = technologyGradientFrontendSchema.safeParse(
			req.body,
		);

		if (frontendValidation.success) {
			const data = frontendValidation.data;
			logger.info(
				"[TechnologyGradientSettings] Detected Frontend format - transforming to DB schema",
			);

			// Transform Frontend flat data to DB nested structure
			storageData = {
				gradientType: "linear", // Default to linear as mostly used
				colors: data.gradientColors, // Map gradientColors -> colors (jsonb)
				direction: data.angle.toString(), // Map angle -> direction
				opacity: data.spotlightOpacity.toString(), // Map opacity -> opacity (decimal)
				settings: data, // Store the FULL configuration in JSONB for component rehydration
				isActive: data.isActive,
			};
		} else {
			// STRATEGY 2: Fallback to standard DB Schema validation
			// This supports direct API usage matching the table structure
			const dbValidation = insertTechnologyGradientSettingsSchema
				.partial()
				.safeParse(req.body);

			if (!dbValidation.success) {
				logger.warn(
					"[TechnologyGradientSettings] Validation failed for both formats:",
					{
						frontend: frontendValidation.error,
						db: dbValidation.error,
					},
				);
				return res.status(400).json({
					error: "Validation failed",
					details:
						"Request matches neither frontend structure nor database schema",
				});
			}
			storageData = dbValidation.data;
		}

		// Final validation against DB schema before save (safety check)
		// We use .partial() because updates might not be full records
		const finalValidation = insertTechnologyGradientSettingsSchema
			.partial()
			.safeParse(storageData);

		if (!finalValidation.success) {
			logger.error(
				"[TechnologyGradientSettings] Transformation result invalid:",
				finalValidation.error,
			);
			return res.status(500).json({ error: "Internal transformation error" });
		}

		const updated = await withTimeout(
			getStorage().updateTechnologyGradientSettings(finalValidation.data),
			10000,
			"Update technology gradient settings",
		);

		try {
			await CacheOperations.invalidateTechnology();
			logger.info(
				"[TechnologyGradientSettings] ✅ Cache invalidated after update",
			);
		} catch (cacheError) {
			logger.error(
				"[TechnologyGradientSettings] ❌ Cache invalidation failed:",
				cacheError,
			);
		}

		logger.info("[TechnologyGradientSettings] Settings updated successfully");
		return res.json(updated);
	} catch (error) {
		logger.error(
			"[TechnologyGradientSettings] Error updating settings:",
			error,
		);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to update gradient settings",
		});
	}
});

export default router;
