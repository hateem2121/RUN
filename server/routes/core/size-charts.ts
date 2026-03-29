import { removeUndefined } from "../../utils.js";

/**
 * SIZE CHARTS ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all size chart CRUD operations and relationships
 */

import { Router } from "express";
import { insertSizeChartSchema } from "../../../shared/index.js";
import { miscRepository } from "../../lib/db/repositories/index.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/size-charts - List all size charts
router.get("/size-charts", async (_req, res) => {
  const sizeCharts = await withTimeout(miscRepository.getSizeCharts(), 5000, "Get size charts");
  res.json(sizeCharts);
});

// POST /api/size-charts - Create new size chart
router.post("/size-charts", authService.requireAdmin, async (req, res) => {
  const validatedData = insertSizeChartSchema.parse(req.body);
  const sizeChart = await withTimeout(
    miscRepository.createSizeChart(removeUndefined(validatedData)),
    10000,
    "Create size chart",
  );
  res.status(201).json(sizeChart);
});

// PUT /api/size-charts/:id - Update size chart
router.put("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "size chart");
  if (id === null) {
    return;
  }
  const validatedData = insertSizeChartSchema.partial().parse(req.body);
  const sizeChart = await withTimeout(
    miscRepository.updateSizeChart(id, removeUndefined(validatedData)),
    10000,
    "Update size chart",
  );

  if (!sizeChart) {
    return res.status(404).json({ message: "Size chart not found" });
  }

  return res.json(sizeChart);
});

// DELETE /api/size-charts/:id - Delete size chart
router.delete("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "size chart");
  if (id === null) {
    return;
  }

  const success = await withTimeout(miscRepository.deleteSizeChart(id), 10000, "Delete size chart");

  if (!success) {
    return res.status(404).json({ message: "Size chart not found" });
  }

  return res.status(204).send();
});

export default router;
