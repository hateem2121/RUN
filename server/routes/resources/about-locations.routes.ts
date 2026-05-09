import { Router } from "express";
import { z } from "zod";
import {
  type InsertAboutMapLocation,
  insertAboutMapLocationSchema,
} from "../../../shared/index.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

/**
 * GET /api/v1/about-locations
 * Retrieve all map locations
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getMapLocations(), 10000, "Get map locations");

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutLocations] Retrieved ${result.value.length} locations`);
  return res.json(result.value);
});

/**
 * GET /api/v1/about-locations/:id
 * Retrieve single location
 */
router.get("/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "Location");
  if (id === null) return;

  const result = await withTimeout(aboutService.getMapLocation(id), 10000, "Get map location");

  if (result.isErr()) {
    throw result.error;
  }

  const location = result.value;
  if (!location) {
    throw new ValidationError(`Location ${id} not found`);
  }

  logger.info(`[AboutLocations] Retrieved location ${id}`);
  return res.json(location);
});

/**
 * POST /api/v1/about-locations
 * Create new location
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutMapLocationSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid location data", { issues: validation.error.issues });
  }

  const data: InsertAboutMapLocation = {
    ...validation.data,
    latitude: String(validation.data.latitude),
    longitude: String(validation.data.longitude),
  } as InsertAboutMapLocation;

  const result = await withTimeout(
    aboutService.createMapLocation(data),
    10000,
    "Create map location",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutLocations] Created location ${result.value.id}`);
  return res.status(201).json(result.value);
});

/**
 * PATCH /api/v1/about-locations/:id
 * Update location
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Location");
  if (id === null) return;

  const validation = insertAboutMapLocationSchema.partial().safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid location update data", { issues: validation.error.issues });
  }

  const data = { ...validation.data } as Partial<InsertAboutMapLocation>;
  if (data.latitude !== undefined) {
    data.latitude = String(data.latitude);
  }
  if (data.longitude !== undefined) {
    data.longitude = String(data.longitude);
  }

  const result = await withTimeout(
    aboutService.updateMapLocation(id, data),
    10000,
    "Update map location",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutLocations] Updated location ${id}`);
  return res.json(result.value);
});

/**
 * DELETE /api/v1/about-locations/:id
 * Delete location
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "Location");
  if (id === null) return;

  const result = await withTimeout(
    aboutService.deleteMapLocation(id),
    10000,
    "Delete map location",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutLocations] Deleted location ${id}`);
  return res.status(204).send();
});

// Reorder validation schema
const reorderSchema = z.object({
  entries: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

/**
 * PATCH /api/v1/about-locations/reorder
 * Reorder locations
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError("Invalid reorder data", { issues: validation.error.issues });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderLocations(orderedIds),
    15000,
    "Reorder about locations",
  );

  if (result.isErr()) {
    throw result.error;
  }

  logger.info(`[AboutLocations] Reordered ${orderedIds.length} locations`);
  return res.json({ success: true, updated: orderedIds.length });
});

export default router;
