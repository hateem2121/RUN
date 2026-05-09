import { Router } from "express";
import { z } from "zod";
import { insertTechnologyResearchSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY RESEARCH RESOURCE ROUTER
 *
 * Modular Express Router for Technology Research & Development management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

const reorderSchema = z.object({
  research: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

router.get("/", async (req, res) => {
  const result = await technologyService.getResearch(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const research = result.value;

  return res.json(research);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await technologyService.getResearchItem(id);
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyResearchSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.createResearch(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertTechnologyResearchSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateResearch(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await technologyService.deleteResearch(id);
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

  const orderedIds = validation.data.research
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await technologyService.reorderResearch(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
