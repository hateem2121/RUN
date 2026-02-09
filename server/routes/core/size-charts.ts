import { removeUndefined } from "../../utils.js";

/**
 * SIZE CHARTS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all size chart CRUD operations and relationships
 */

import { Router } from "express";
import { z } from "zod";
import { insertSizeChartSchema } from "../../../shared/schema.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/size-charts - List all size charts
router.get("/size-charts", async (_req, res) => {
  try {
    const sizeCharts = await withTimeout(getStorage().getSizeCharts(), 5000, "Get size charts");
    res.json(sizeCharts);
  } catch (error: unknown) {
    logger.error("Route: Error fetching size charts:", error);
    res.status(500).json({
      message: "Failed to fetch size charts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/size-charts - Create new size chart
router.post("/size-charts", authService.requireAdmin, async (req, res) => {
  try {
    const validatedData = insertSizeChartSchema.parse(req.body);
    const sizeChart = await withTimeout(
      getStorage().createSizeChart(removeUndefined(validatedData)),
      10000,
      "Create size chart",
    );
    res.status(201).json(sizeChart);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error creating size chart:", error);
      res.status(500).json({
        message: "Failed to create size chart",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// PUT /api/size-charts/:id - Update size chart
router.put("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "size chart");
    if (id === null) {
      return;
    }
    const validatedData = insertSizeChartSchema.partial().parse(req.body);
    const sizeChart = await withTimeout(
      getStorage().updateSizeChart(id, removeUndefined(validatedData)),
      10000,
      "Update size chart",
    );

    if (!sizeChart) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    return res.json(sizeChart);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error updating size chart:", error);
      return res.status(500).json({
        message: "Failed to update size chart",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// DELETE /api/size-charts/:id - Delete size chart
router.delete("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "size chart");
    if (id === null) {
      return;
    }

    const success = await withTimeout(getStorage().deleteSizeChart(id), 10000, "Delete size chart");

    if (!success) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    return res.status(204).send();
  } catch (error: unknown) {
    logger.error("Route: Error deleting size chart:", error);
    return res.status(500).json({
      message: "Failed to delete size chart",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
