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
      position: z.number().int().min(0),
    }),
  ),
});

/**
 * GET /api/v1/about-locations
 * Retrieve all map locations
 */
router.get("/", async (_req, res) => {
  try {
    const locations = await withTimeout(aboutService.getLocations(), 10000, "Get map locations");

    logger.info(`[AboutLocations] Retrieved ${locations.length} locations`);
    return res.json(locations);
  } catch (error) {
    logger.error("[AboutLocations] Error getting locations:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get locations",
    });
  }
});

/**
 * GET /api/v1/about-locations/:id
 * Retrieve single location
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const location = await withTimeout(aboutService.getLocation(id), 10000, "Get map location");

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    logger.info(`[AboutLocations] Retrieved location ${id}`);
    return res.json(location);
  } catch (error) {
    logger.error("[AboutLocations] Error getting location:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get location",
    });
  }
});

/**
 * POST /api/v1/about-locations
 * Create new location
 */
router.post("/", authService.requireAdmin, async (req, res) => {
  try {
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

    const newLocation = await withTimeout(
      aboutService.createLocation(data),
      10000,
      "Create map location",
    );

    if (!newLocation) {
      throw new Error("Failed to create location");
    }

    // Invalidation handled by service layer
    logger.info(`[AboutLocations] Created location ${newLocation.id}`);
    return res.status(201).json(newLocation);
  } catch (error) {
    logger.error("[AboutLocations] Error creating location:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create location",
    });
  }
});

/**
 * PATCH /api/v1/about-locations/:id
 * Update location
 */
router.patch("/:id", authService.requireAdmin, async (req, res) => {
  try {
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

    const updatedLocation = await withTimeout(
      aboutService.updateLocation(id, data),
      10000,
      "Update map location",
    );

    if (!updatedLocation) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Invalidation handled by service layer
    logger.info(`[AboutLocations] Updated location ${id}`);
    return res.json(updatedLocation);
  } catch (error) {
    logger.error("[AboutLocations] Error updating location:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update location",
    });
  }
});

/**
 * DELETE /api/v1/about-locations/:id
 * Delete location
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const deleted = await withTimeout(
      aboutService.deleteLocation(id),
      10000,
      "Delete map location",
    );

    if (!deleted) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Invalidation handled by service layer
    logger.info(`[AboutLocations] Deleted location ${id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error("[AboutLocations] Error deleting location:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete location",
    });
  }
});

/**
 * PATCH /api/v1/about-locations/reorder
 * Reorder locations
 */
router.patch("/reorder", authService.requireAdmin, async (req, res) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn("[AboutLocations] Reorder validation failed:", validation.error);
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues,
      });
    }

    // Update positions
    // Note: Implicitly relies on sortOrder existing or being ignored if missing
    const updates = await Promise.all(
      validation.data.entries.map(({ id, position }) =>
        aboutService.updateLocation(id, { sortOrder: position }),
      ),
    );

    // Invalidation handled by service layer
    logger.info(`[AboutLocations] Reordered ${updates.length} locations`);
    return res.json({ success: true, updated: updates.length });
  } catch (error) {
    logger.error("[AboutLocations] Error reordering locations:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to reorder locations",
    });
  }
});

export default router;
