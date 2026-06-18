import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { insertSustainabilityInitiativeSchema } from "../../../shared/index.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY INITIATIVES RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Initiatives management.
 * Refactored to "Thin Controller" pattern: delegates business logic to sustainabilityService.
 */
const router = Router();

const reorderSchema = z.object({
  initiatives: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * @openapi
 * /api/resources/sustainability-initiatives:
 *   get:
 *     summary: List sustainability initiatives
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: List of initiatives
 */
router.get("/", async (req, res) => {
  const result = await sustainabilityService.getInitiatives(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const initiatives = result.value;

  return res.json(initiatives);
});

/**
 * @openapi
 * /api/resources/sustainability-initiatives/{id}:
 *   get:
 *     summary: Get initiative by ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Initiative data
 *       404:
 *         description: Initiative not found
 */
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.getInitiative(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/resources/sustainability-initiatives:
 *   post:
 *     summary: Create sustainability initiative
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SustainabilityInitiative'
 *     responses:
 *       201:
 *         description: Initiative created
 */
router.post(
  "/",
  authService.requireAdmin,
  validateRequest({ body: insertSustainabilityInitiativeSchema }),
  async (req, res) => {
    const result = await sustainabilityService.createInitiative(removeUndefined(req.body));
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * @openapi
 * /api/resources/sustainability-initiatives/{id}:
 *   patch:
 *     summary: Update sustainability initiative
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
 *             $ref: '#/components/schemas/SustainabilityInitiative'
 *     responses:
 *       200:
 *         description: Initiative updated
 */
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertSustainabilityInitiativeSchema.partial() }),
  async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    const result = await sustainabilityService.updateInitiative(id, removeUndefined(req.body));
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * @openapi
 * /api/resources/sustainability-initiatives/{id}:
 *   delete:
 *     summary: Delete sustainability initiative
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
 *         description: Initiative deleted
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.deleteInitiative(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/resources/sustainability-initiatives/reorder:
 *   patch:
 *     summary: Reorder sustainability initiatives
 *     tags: [Resources]
 *     security: [{ sessionAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initiatives:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     position: { type: integer }
 *     responses:
 *       200:
 *         description: Initiatives reordered
 */
router.patch(
  "/reorder",
  authService.requireAdmin,
  validateRequest({ body: reorderSchema }),
  async (req, res) => {
    const parsedBody = reorderSchema.parse(req.body);
    const orderedIds = parsedBody.initiatives
      .sort((a, b) => a.position - b.position)
      .map((item) => item.id);

    const result = await sustainabilityService.reorderInitiatives(orderedIds);
    return result.match(
      () => res.json({ success: true, updated: orderedIds.length }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

export default router;
