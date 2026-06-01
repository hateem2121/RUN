import { Router } from "express";
import { insertServiceSchema } from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { removeUndefined } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { servicesService } from "../../services/services.service.js";

const router = Router();

// GET /api/services - List active services
router.get("/services", async (_req, res) => {
  const result = await servicesService.getServices(false);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.json(result.value);
});

// GET /api/services/admin - List all services for administration
router.get("/services/admin", authService.requireAdmin, async (_req, res) => {
  const result = await servicesService.getServices(true);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json(result.value);
});

// GET /api/services/:id - Get a single service
router.get("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid service ID");
  }

  const result = await servicesService.getService(id);
  if (result.isErr()) throw result.error;

  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.json(result.value);
});

// POST /api/services - Create new service
router.post("/services", authService.requireAdmin, async (req, res) => {
  const validation = insertServiceSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid service data", { issues: validation.error.issues });
  }

  const result = await servicesService.createService(removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.status(201).json(result.value);
});

// PUT /api/services/reorder - Reorder services
router.put("/services/reorder", authService.requireAdmin, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    throw new ValidationError("orderedIds must be an array of numbers");
  }

  const result = await servicesService.reorderServices(orderedIds);
  if (result.isErr()) throw result.error;

  return res.json({ success: true });
});

// PUT /api/services/:id - Update service
router.put("/services/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid service ID");
  }

  const validation = insertServiceSchema.partial().safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid service data", { issues: validation.error.issues });
  }

  const result = await servicesService.updateService(id, removeUndefined(validation.data));
  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

// DELETE /api/services/:id - Delete service
router.delete("/services/:id", authService.requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError("Invalid service ID");
  }

  const result = await servicesService.deleteService(id);
  if (result.isErr()) throw result.error;

  return res.status(204).send();
});

export default router;
