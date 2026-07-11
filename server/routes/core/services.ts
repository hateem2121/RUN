import { insertServiceSchema, serviceReorderSchema } from "@run-remix/shared";
import { Router } from "express";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { servicesService } from "../../services/services.service.js";

const router = Router();

// GET /api/services - List active services
router.get("/services", async (_req, res) => {
  const result = await servicesService.getServices(false);
  return result.match(
    (services) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(services);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// GET /api/services/admin - List all services for administration
router.get("/services/admin", authService.requireAdmin, async (_req, res) => {
  const result = await servicesService.getServices(true);
  return result.match(
    (services) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json(services);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// GET /api/services/:id - Get a single service
router.get("/services/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "service");
  if (id === null) return;

  const result = await servicesService.getService(id);
  return result.match(
    (service) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(service);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/services - Create new service
router.post("/services", authService.requireAdmin, async (req, res) => {
  const validation = insertServiceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid service data",
        issues: validation.error.issues,
      },
    });
  }

  const result = await servicesService.createService(removeUndefined(validation.data));
  return result.match(
    (service) => res.status(201).json(service),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PUT /api/services/reorder - Reorder services
router.put("/services/reorder", authService.requireAdmin, async (req, res) => {
  const parsed = serviceReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "orderedIds must be an array of numbers",
        issues: parsed.error.issues,
      },
    });
  }

  const result = await servicesService.reorderServices(parsed.data.orderedIds);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PUT /api/services/:id - Update service
router.put("/services/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "service");
  if (id === null) return;

  const validation = insertServiceSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid service data",
        issues: validation.error.issues,
      },
    });
  }

  const result = await servicesService.updateService(id, removeUndefined(validation.data));
  return result.match(
    (service) => res.json(service),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// DELETE /api/services/:id - Delete service
router.delete("/services/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "service");
  if (id === null) return;

  const result = await servicesService.deleteService(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
