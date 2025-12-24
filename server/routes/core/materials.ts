/**
 * MATERIALS ROUTER MODULE
 * Handles fibers, fabrics, and certificates management
 * Extracted from routes.ts for better organization
 */

import { Router } from "express";
import { z } from "zod";
import { insertFiberSchema } from "../../../shared/schema.js";
import { retryDbOperation } from "../../lib/db-retry.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// FIBERS ROUTES
router.get("/fibers", async (_req, res) => {
	try {
		const fibers = await withTimeout(
			retryDbOperation(() => getStorage().getFibers(), {
				operationName: "Get all fibers",
			}),
			10000,
			"Get all fibers",
		);
		res.json(fibers);
	} catch (error: unknown) {
		logger.error("Route: Error fetching fibers:", error);
		res.status(500).json({
			message: "Failed to fetch fibers",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

router.post("/fibers", async (req, res) => {
	try {
		const validatedData = insertFiberSchema.parse(req.body);
		const fiber = await withTimeout(
			retryDbOperation(() => getStorage().createFiber(validatedData), {
				operationName: "Create fiber",
			}),
			10000,
			"Create fiber",
		);
		return res.status(201).json(fiber);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Validation error", errors: error.issues });
		}
		return res.status(500).json({ message: "Failed to create fiber" });
	}
});

router.put("/fibers/:id", async (req, res) => {
	try {
		const id = validateIdParam(req, res, "id", "fiber");
		if (id === null) return; // Error response already sent

		const validatedData = insertFiberSchema.partial().parse(req.body);
		const fiber = await withTimeout(
			retryDbOperation(() => getStorage().updateFiber(id, validatedData), {
				operationName: "Update fiber",
			}),
			10000,
			"Update fiber",
		);
		if (!fiber) {
			return res.status(404).json({ message: "Fiber not found" });
		}
		return res.json(fiber);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Validation error", errors: error.issues });
		}
		return res.status(500).json({ message: "Failed to update fiber" });
	}
});

router.delete("/fibers/:id", async (req, res) => {
	try {
		const id = validateIdParam(req, res, "id", "fiber");
		if (id === null) return; // Error response already sent

		const deleted = await withTimeout(
			retryDbOperation(() => getStorage().deleteFiber(id), {
				operationName: "Delete fiber",
			}),
			10000,
			"Delete fiber",
		);
		if (!deleted) {
			return res.status(404).json({ message: "Fiber not found" });
		}
		return res.status(204).send();
	} catch (error) {
		logger.error("Route: Error deleting fiber:", { error });
		return res.status(500).json({ message: "Failed to delete fiber" });
	}
});

export default router;
