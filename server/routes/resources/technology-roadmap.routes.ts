import { insertTechnologyRoadmapSchema, reorderRoadmapSchema } from "@run-remix/shared";
import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { technologyService } from "../../services/technology.service.js";

/**
 * TECHNOLOGY ROADMAP RESOURCE ROUTER
 *
 * Modular Express Router for Technology Roadmap management.
 * Refactored to "Thin Controller" pattern: delegates business logic to technologyService.
 */
const router = Router();

router.get("/", async (req, res) => {
  const result = await technologyService.getRoadmap(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const roadmap = result.value;

  return res.json(roadmap);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await technologyService.getRoadmapItem(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertTechnologyRoadmapSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.createRoadmapItem(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertTechnologyRoadmapSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await technologyService.updateRoadmapItem(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await technologyService.deleteRoadmapItem(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderRoadmapSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const orderedIds = validation.data.roadmap
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await technologyService.reorderRoadmap(orderedIds);
  return result.match(
    () => res.json({ success: true, updated: orderedIds.length }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
