import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import type { InsertSustainabilityMetric } from "../../../shared/index.js";
import { insertSustainabilityMetricSchema } from "../../../shared/index.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY METRICS RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Metrics management.
 * Refactored to "Thin Controller" pattern: delegates business logic to sustainabilityService.
 */
const router = Router();

const reorderSchema = z.object({
  metrics: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * @openapi
 * /api/resources/sustainability-metrics:
 *   get:
 *     summary: List sustainability metrics
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: List of metrics
 */
router.get("/", async (_req, res) => {
  const result = await sustainabilityService.getMetrics();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/resources/sustainability-metrics/{id}:
 *   get:
 *     summary: Get metric by ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Metric data
 *       404:
 *         description: Metric not found
 */
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.getMetric(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/resources/sustainability-metrics:
 *   post:
 *     summary: Create sustainability metric
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SustainabilityMetric'
 *     responses:
 *       201:
 *         description: Metric created
 */
router.post(
  "/",
  authService.requireAdmin,
  validateRequest({ body: insertSustainabilityMetricSchema }),
  async (req, res) => {
    const result = await sustainabilityService.createMetric(
      removeUndefined(req.body) as InsertSustainabilityMetric,
    );
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * @openapi
 * /api/resources/sustainability-metrics/{id}:
 *   patch:
 *     summary: Update sustainability metric
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SustainabilityMetric'
 *     responses:
 *       200:
 *         description: Metric updated
 */
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertSustainabilityMetricSchema.partial() }),
  async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    const result = await sustainabilityService.updateMetric(
      id,
      removeUndefined(req.body as Partial<InsertSustainabilityMetric>),
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * @openapi
 * /api/resources/sustainability-metrics/{id}:
 *   delete:
 *     summary: Delete sustainability metric
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Metric deleted
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.deleteMetric(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/resources/sustainability-metrics/reorder:
 *   patch:
 *     summary: Reorder sustainability metrics
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     position: { type: integer }
 *     responses:
 *       200:
 *         description: Metrics reordered
 */
router.patch(
  "/reorder",
  authService.requireAdmin,
  validateRequest({ body: reorderSchema }),
  async (req, res) => {
    const validatedData = req.body as z.infer<typeof reorderSchema>;
    const orderedIds = validatedData.metrics
      .sort((a, b) => a.position - b.position)
      .map((item) => item.id);

    const result = await sustainabilityService.reorderMetrics(orderedIds);
    return result.match(
      () => res.json({ success: true, updated: orderedIds.length }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

export default router;
