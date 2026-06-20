import { reorderGoalsSchema } from "@run-remix/shared";
import { Router } from "express";
import { insertSustainabilityGoalSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined, shouldBypassCache } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { sustainabilityService } from "../../services/sustainability.service.js";

/**
 * SUSTAINABILITY GOALS RESOURCE ROUTER
 *
 * Modular Express Router for Sustainability Goals management.
 * Refactored to "Thin Controller" pattern: delegates business logic to sustainabilityService.
 */
const router = Router();

router.get("/", async (req, res) => {
  const result = await sustainabilityService.getGoals(shouldBypassCache(req));
  if (result.isErr()) throw result.error;

  const goals = result.value;

  return res.json(goals);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.getGoal(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertSustainabilityGoalSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await sustainabilityService.createGoal(removeUndefined(validation.data));
  return result.match(
    (data) => res.status(201).json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const validation = insertSustainabilityGoalSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const result = await sustainabilityService.updateGoal(id, removeUndefined(validation.data));
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const result = await sustainabilityService.deleteGoal(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderGoalsSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Validation failed", {
      details: validation.error.issues,
    });
  }

  const orderedIds = validation.data.goals
    .sort((a, b) => a.position - b.position)
    .map((item) => item.id);

  const result = await sustainabilityService.reorderGoals(orderedIds);
  return result.match(
    () => res.json({ success: true, updated: orderedIds.length }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
