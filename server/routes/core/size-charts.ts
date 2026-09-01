import { insertSizeChartSchema } from "@run-remix/shared";
import { Router } from "express";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { apiTier } from "../../middleware/rate-limit-tiers.js";
import { miscService } from "../../services/cms/misc.service.js";
import { authService } from "../../services/system/auth.service.js";

/**
 * SIZE CHARTS ROUTER MODULE
 * Handles all size chart CRUD operations and relationships via miscService
 */
const router = Router();
router.use(apiTier);

// GET /api/size-charts - List all size charts
router.get("/size-charts", async (_req, res) => {
  const result = await miscService.getSizeCharts();
  return result.match(
    (sizeCharts) => res.json(sizeCharts),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// POST /api/size-charts - Create new size chart
router.post("/size-charts", authService.requireAdmin, async (req, res) => {
  const validatedData = insertSizeChartSchema.parse(req.body);
  const result = await miscService.createSizeChart(removeUndefined(validatedData));

  return result.match(
    (sizeChart) => res.status(201).json(sizeChart),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// PUT /api/size-charts/:id - Update size chart
router.put("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "size chart");
  if (id === null) {
    return;
  }
  const validatedData = insertSizeChartSchema.partial().parse(req.body);
  const result = await miscService.updateSizeChart(id, removeUndefined(validatedData));

  return result.match(
    (sizeChart) => res.json(sizeChart),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// DELETE /api/size-charts/:id - Delete size chart
router.delete("/size-charts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "size chart");
  if (id === null) {
    return;
  }

  const result = await miscService.deleteSizeChart(id);

  return result.match(
    () => res.status(204).send(),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

export default router;
