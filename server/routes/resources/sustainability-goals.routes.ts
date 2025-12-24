/**
 * SUSTAINABILITY GOALS RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Goals management
 * Handles full CRUD + reorder operations for sustainability goals
 *
 * Routes:
 * - GET    /api/v1/sustainability-goals           - List all goals
 * - GET    /api/v1/sustainability-goals/:id       - Get single goal
 * - POST   /api/v1/sustainability-goals           - Create new goal
 * - PATCH  /api/v1/sustainability-goals/:id       - Update goal
 * - DELETE /api/v1/sustainability-goals/:id       - Delete goal
 * - PATCH  /api/v1/sustainability-goals/reorder   - Reorder goals
 */

import { Router } from "express";
import { z } from "zod";
import { insertSustainabilityGoalSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = Router();

const idParamSchema = z.object({
	id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const reorderSchema = z.object({
	goals: z.array(
		z.object({
			id: z.number().int().positive(),
			position: z.number().int().min(0),
		}),
	),
});

router.get("/", async (_req, res) => {
	try {
		const goals = await withTimeout(
			getStorage().getSustainabilityGoals(),
			10000,
			"Get sustainability goals",
		);

		logger.info(`[SustainabilityGoals] Retrieved ${goals.length} goals`);
		return res.json(goals);
	} catch (error) {
		logger.error("[SustainabilityGoals] Error getting goals:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to get goals",
		});
	}
});

router.get("/:id", async (req, res) => {
	try {
		const { id } = idParamSchema.parse(req.params);

		const goal = await withTimeout(
			getStorage().getSustainabilityGoal(id),
			10000,
			"Get sustainability goal",
		);

		if (!goal) {
			return res.status(404).json({ error: "Goal not found" });
		}

		logger.info(`[SustainabilityGoals] Retrieved goal ${id}`);
		return res.json(goal);
	} catch (error) {
		logger.error("[SustainabilityGoals] Error getting goal:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to get goal",
		});
	}
});

router.post("/", requireAdmin, async (req, res) => {
	try {
		const validation = insertSustainabilityGoalSchema.safeParse(req.body);

		if (!validation.success) {
			logger.warn("[SustainabilityGoals] Validation failed:", validation.error);
			return res.status(400).json({
				error: "Validation failed",
				details: validation.error.issues,
			});
		}

		const newGoal = await withTimeout(
			getStorage().createSustainabilityGoal(validation.data),
			10000,
			"Create sustainability goal",
		);

		try {
			await CacheOperations.invalidateSustainability();
			logger.info("[SustainabilityGoals] ✅ Cache invalidated after creation");
		} catch (cacheError) {
			logger.error(
				"[SustainabilityGoals] ❌ Cache invalidation failed:",
				cacheError,
			);
		}

		logger.info(`[SustainabilityGoals] Created goal ${newGoal.id}`);
		return res.status(201).json(newGoal);
	} catch (error) {
		logger.error("[SustainabilityGoals] Error creating goal:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to create goal",
		});
	}
});

router.patch("/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = idParamSchema.parse(req.params);
		const validation = insertSustainabilityGoalSchema
			.partial()
			.safeParse(req.body);

		if (!validation.success) {
			logger.warn("[SustainabilityGoals] Validation failed:", validation.error);
			return res.status(400).json({
				error: "Validation failed",
				details: validation.error.issues,
			});
		}

		const updated = await withTimeout(
			getStorage().updateSustainabilityGoal(id, validation.data),
			10000,
			"Update sustainability goal",
		);

		if (!updated) {
			return res.status(404).json({ error: "Goal not found" });
		}

		try {
			await CacheOperations.invalidateSustainability();
			logger.info("[SustainabilityGoals] ✅ Cache invalidated after update");
		} catch (cacheError) {
			logger.error(
				"[SustainabilityGoals] ❌ Cache invalidation failed:",
				cacheError,
			);
		}

		logger.info(`[SustainabilityGoals] Updated goal ${id}`);
		return res.json(updated);
	} catch (error) {
		logger.error("[SustainabilityGoals] Error updating goal:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to update goal",
		});
	}
});

router.delete("/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = idParamSchema.parse(req.params);

		const deleted = await withTimeout(
			getStorage().deleteSustainabilityGoal(id),
			10000,
			"Delete sustainability goal",
		);

		if (!deleted) {
			return res.status(404).json({ error: "Goal not found" });
		}

		try {
			await CacheOperations.invalidateSustainability();
			logger.info("[SustainabilityGoals] ✅ Cache invalidated after deletion");
		} catch (cacheError) {
			logger.error(
				"[SustainabilityGoals] ❌ Cache invalidation failed:",
				cacheError,
			);
		}

		logger.info(`[SustainabilityGoals] Deleted goal ${id}`);
		return res.status(204).send();
	} catch (error) {
		logger.error("[SustainabilityGoals] Error deleting goal:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to delete goal",
		});
	}
});

router.patch("/reorder", requireAdmin, async (req, res) => {
	try {
		const validation = reorderSchema.safeParse(req.body);

		if (!validation.success) {
			logger.warn(
				"[SustainabilityGoals] Reorder validation failed:",
				validation.error,
			);
			return res.status(400).json({
				error: "Validation failed",
				details: validation.error.issues,
			});
		}

		const updates = await Promise.all(
			validation.data.goals.map(({ id, position }) =>
				getStorage().updateSustainabilityGoal(id, { sortOrder: position }),
			),
		);

		try {
			await CacheOperations.invalidateSustainability();
			logger.info("[SustainabilityGoals] ✅ Cache invalidated after reorder");
		} catch (cacheError) {
			logger.error(
				"[SustainabilityGoals] ❌ Cache invalidation failed:",
				cacheError,
			);
		}

		logger.info(`[SustainabilityGoals] Reordered ${updates.length} goals`);
		return res.json({ success: true, updated: updates.length });
	} catch (error) {
		logger.error("[SustainabilityGoals] Error reordering goals:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to reorder goals",
		});
	}
});

export default router;
