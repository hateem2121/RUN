import { Router } from "express";
import { z } from "zod";
import { insertTechnologyInnovationSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY INNOVATIONS RESOURCE ROUTER
 *
 * Modular Express Router for Technology Innovations management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

const reorderSchema = z.object({
  innovations: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (req, res) => {
  const result = await technologyService.getInnovations(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const innovations = result.value;

  return res.json(innovations);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await technologyService.getInnovation(id);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyInnovationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.createInnovation(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = insertTechnologyInnovationSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateInnovation(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await technologyService.deleteInnovation(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const orderedIds = validation.data.innovations
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await technologyService.reorderInnovations(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
