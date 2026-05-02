/**
 * ABOUT LOCATIONS RESOURCE ROUTER
 *
 * Modular Express Router for About Map Locations management
 * Handles full CRUD + reorder operations for map locations
 *
 * Routes:
 * - GET    /api/v1/about-locations           - List all locations
 * - GET    /api/v1/about-locations/:id       - Get single location
 * - POST   /api/v1/about-locations           - Create new location
 * - PATCH  /api/v1/about-locations/:id       - Update location
 * - DELETE /api/v1/about-locations/:id       - Delete location
 * - PATCH  /api/v1/about-locations/reorder   - Reorder locations
 */

import { Router } from "express";
import { z } from "zod";
import {
  type InsertAboutMapLocation,
  insertAboutMapLocationSchema,
} from "../../../shared/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { aboutService } from "../../services/about.service.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Param validation schema
const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
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
 * GET /api/v1/about-locations
 * Retrieve all map locations
 */
router.get("/", async (_req, res) => {
  const result = await withTimeout(aboutService.getLocations(), 10000, "Get map locations");

  return result.match(
    (locations) => {
      logger.info(`[AboutLocations] Retrieved ${locations.length} locations`);
      return res.json(locations);
    },
    (error) => {
      logger.error("[AboutLocations] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * GET /api/v1/about-locations/:id
 * Retrieve single location
 */
router.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.getLocation(id), 10000, "Get map location");

  return result.match(
    (location) => {
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      logger.info(`[AboutLocations] Retrieved location ${id}`);
      return res.json(location);
    },
    (error) => {
      logger.error("[AboutLocations] Fetch failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * POST /api/v1/about-locations
 * Create new location
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  const validation = insertAboutMapLocationSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutLocations] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const data: InsertAboutMapLocation = {
    ...validation.data,
    latitude: String(validation.data.latitude),
    longitude: String(validation.data.longitude),
  } as InsertAboutMapLocation;

  const result = await withTimeout(aboutService.createLocation(data), 10000, "Create map location");

  return result.match(
    (newLocation) => {
      logger.info(`[AboutLocations] Created location ${newLocation.id}`);
      return res.status(201).json(newLocation);
    },
    (error) => {
      logger.error("[AboutLocations] Create failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-locations/:id
 * Update location
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const validation = insertAboutMapLocationSchema.partial().safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutLocations] Validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const data = { ...validation.data } as Partial<InsertAboutMapLocation>;
  if (data.latitude !== undefined) {
    data.latitude = String(data.latitude);
  }
  if (data.longitude !== undefined) {
    data.longitude = String(data.longitude);
  }

  const result = await withTimeout(
    aboutService.updateLocation(id, data),
    10000,
    "Update map location",
  );

  return result.match(
    (updatedLocation) => {
      logger.info(`[AboutLocations] Updated location ${id}`);
      return res.json(updatedLocation);
    },
    (error) => {
      logger.error("[AboutLocations] Update failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * DELETE /api/v1/about-locations/:id
 * Delete location
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const result = await withTimeout(aboutService.deleteLocation(id), 10000, "Delete map location");

  return result.match(
    () => {
      logger.info(`[AboutLocations] Deleted location ${id}`);
      return res.status(204).send();
    },
    (error) => {
      logger.error("[AboutLocations] Delete failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

/**
 * PATCH /api/v1/about-locations/reorder
 * Reorder locations
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    logger.warn("[AboutLocations] Reorder validation failed:", validation.error);
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  // Extract ordered IDs
  const orderedIds = validation.data.entries.map((e) => e.id);

  const result = await withTimeout(
    aboutService.reorderLocations(orderedIds),
    15000,
    "Reorder about locations",
  );

  return result.match(
    () => {
      logger.info(`[AboutLocations] Reordered ${orderedIds.length} locations`);
      return res.json({ success: true, updated: orderedIds.length });
    },
    (error) => {
      logger.error("[AboutLocations] Reorder failed", error);
      return res.status(error.statusCode || 500).json({
        error: error.message,
        code: error.code,
      });
    },
  );
});

export default router;
