import { Router } from "express";
import { z } from "zod";
import { insertTechnologyEquipmentSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY EQUIPMENT RESOURCE ROUTER
 *
 * Modular Express Router for Technology Equipment management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

const reorderSchema = z.object({
  equipment: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (_req, res) => {
  const result = await technologyService.getEquipment();
  if (result.isErr()) throw result.error;

  const equipment = result.value;

  return res.json(equipment);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await technologyService.getEquipmentItem(id);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyEquipmentSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.createEquipment(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const validation = insertTechnologyEquipmentSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateEquipment(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const result = await technologyService.deleteEquipment(id);
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

  const orderedIds = validation.data.equipment
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await technologyService.reorderEquipment(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
