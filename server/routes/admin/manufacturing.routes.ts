import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import {
  type InsertManufacturingCapability,
  type InsertManufacturingCaseStudy,
  type InsertManufacturingHero,
  type InsertManufacturingProcess,
  type InsertManufacturingQuality,
  insertManufacturingCapabilitySchema,
  insertManufacturingCaseStudySchema,
  insertManufacturingHeroSchema,
  insertManufacturingProcessSchema,
  insertManufacturingQualitySchema,
} from "../../../shared/index.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { manufacturingService } from "../../services/manufacturing.service.js";

const router = Router();

// =============================================================================
// HERO
// =============================================================================

router.get("/hero", authService.requireAdmin, async (_req, res) => {
  const result = await manufacturingService.getHero();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.patch(
  "/hero",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingHeroSchema.partial() }),
  async (req, res) => {
    const result = await manufacturingService.updateHero(
      req.body as Partial<InsertManufacturingHero>,
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// =============================================================================
// PROCESSES
// =============================================================================

router.get("/processes", authService.requireAdmin, async (_req, res) => {
  const result = await manufacturingService.getProcesses();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/processes",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingProcessSchema }),
  async (req, res) => {
    const result = await manufacturingService.createProcess(req.body);
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.patch(
  "/processes/:id",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingProcessSchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "process");
    if (id === null) return;
    const result = await manufacturingService.updateProcess(
      id,
      req.body as Partial<InsertManufacturingProcess>,
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.delete("/processes/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "process");
  if (id === null) return;
  const result = await manufacturingService.deleteProcess(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/processes/reorder",
  authService.requireAdmin,
  validateRequest({ body: z.object({ orderedIds: z.array(z.number()) }) }),
  async (req, res) => {
    const result = await manufacturingService.reorderProcesses(req.body.orderedIds);
    return result.match(
      () => res.json({ success: true }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// =============================================================================
// CAPABILITIES
// =============================================================================

router.get("/capabilities", authService.requireAdmin, async (_req, res) => {
  const result = await manufacturingService.getCapabilities();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/capabilities",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingCapabilitySchema }),
  async (req, res) => {
    const result = await manufacturingService.createCapability(req.body);
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.patch(
  "/capabilities/:id",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingCapabilitySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "capability");
    if (id === null) return;
    const result = await manufacturingService.updateCapability(
      id,
      req.body as Partial<InsertManufacturingCapability>,
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.delete("/capabilities/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "capability");
  if (id === null) return;
  const result = await manufacturingService.deleteCapability(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/capabilities/reorder",
  authService.requireAdmin,
  validateRequest({ body: z.object({ orderedIds: z.array(z.number()) }) }),
  async (req, res) => {
    const result = await manufacturingService.reorderCapabilities(req.body.orderedIds);
    return result.match(
      () => res.json({ success: true }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// =============================================================================
// QUALITIES
// =============================================================================

router.get("/qualities", authService.requireAdmin, async (_req, res) => {
  const result = await manufacturingService.getQualities(true);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/qualities",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingQualitySchema }),
  async (req, res) => {
    const result = await manufacturingService.createQuality(req.body);
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.patch(
  "/qualities/:id",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingQualitySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "quality");
    if (id === null) return;
    const result = await manufacturingService.updateQuality(
      id,
      req.body as Partial<InsertManufacturingQuality>,
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.delete("/qualities/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "quality");
  if (id === null) return;
  const result = await manufacturingService.deleteQuality(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/qualities/reorder",
  authService.requireAdmin,
  validateRequest({ body: z.object({ orderedIds: z.array(z.number()) }) }),
  async (req, res) => {
    const result = await manufacturingService.reorderQualities(req.body.orderedIds);
    return result.match(
      () => res.json({ success: true }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// =============================================================================
// CASE STUDIES
// =============================================================================

router.get("/case-studies", authService.requireAdmin, async (_req, res) => {
  const result = await manufacturingService.getCaseStudies();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/case-studies",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingCaseStudySchema }),
  async (req, res) => {
    const result = await manufacturingService.createCaseStudy(req.body);
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.patch(
  "/case-studies/:id",
  authService.requireAdmin,
  validateRequest({ body: insertManufacturingCaseStudySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "case-study");
    if (id === null) return;
    const result = await manufacturingService.updateCaseStudy(
      id,
      req.body as Partial<InsertManufacturingCaseStudy>,
    );
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.delete("/case-studies/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "case-study");
  if (id === null) return;
  const result = await manufacturingService.deleteCaseStudy(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/case-studies/reorder",
  authService.requireAdmin,
  validateRequest({ body: z.object({ orderedIds: z.array(z.number()) }) }),
  async (req, res) => {
    const result = await manufacturingService.reorderCaseStudies(req.body.orderedIds);
    return result.match(
      () => res.json({ success: true }),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

export default router;
