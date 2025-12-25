/**
 * ACCESSORIES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all accessory CRUD operations with caching and pagination
 */

import { Router } from "express";
import { z } from "zod";
import { insertAccessorySchema } from "../../../shared/schema.js";
import { accessoryRepository } from "../../lib/repositories/accessory-repository.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";

const router = Router();

// GET /api/accessories - List accessories with pagination and filters
router.get("/accessories", async (req, res) => {
  try {
    // Disable HTTP caching to ensure fresh data after cache invalidation
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const limit = parseInt(req.query.limit as string, 10) || 100;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const withCount = req.query.withCount === "true";

    if (withCount) {
      // Return accessories with total count for pagination
      const result = await withTimeout(
        accessoryRepository.getAccessoriesWithCount(limit, offset, {
          category,
          search,
        }),
        5000,
        "Get accessories with count",
      );
      res.json(result);
    } else {
      // Return just accessories array
      const accessories = await withTimeout(
        accessoryRepository.getAccessories(limit, offset, { category, search }),
        5000,
        "Get accessories",
      );
      res.json(accessories);
    }
  } catch (error: unknown) {
    logger.error("Route: Error fetching accessories:", error);
    res.status(500).json({
      message: "Failed to fetch accessories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/accessories - Create new accessory
router.post("/accessories", async (req, res) => {
  try {
    const validatedData = insertAccessorySchema.parse(req.body);

    // Convert price to string if it's a number (database expects string for decimal)
    const dataToInsert = {
      ...validatedData,
      price: validatedData.price !== undefined ? String(validatedData.price) : undefined,
    };

    const accessory = await withTimeout(
      accessoryRepository.createAccessory(dataToInsert),
      10000,
      "Create accessory",
    );
    res.status(201).json(accessory);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error creating accessory:", error);
      res.status(500).json({
        message: "Failed to create accessory",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// PUT /api/accessories/:id - Update accessory
router.put("/accessories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validatedData = insertAccessorySchema.partial().parse(req.body);

    // Convert price to string if it's a number (database expects string for decimal)
    const dataToUpdate = {
      ...validatedData,
      price: validatedData.price !== undefined ? String(validatedData.price) : undefined,
    };

    const accessory = await withTimeout(
      accessoryRepository.updateAccessory(id, dataToUpdate),
      10000,
      "Update accessory",
    );

    if (!accessory) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    return res.json(accessory);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error updating accessory:", error);
      return res.status(500).json({
        message: "Failed to update accessory",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// DELETE /api/accessories/:id - Delete accessory
router.delete("/accessories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid accessory ID" });
    }

    const success = await withTimeout(
      accessoryRepository.deleteAccessory(id),
      10000,
      "Delete accessory",
    );

    if (!success) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    return res.status(204).send();
  } catch (error: unknown) {
    logger.error("Route: Error deleting accessory:", error);
    return res.status(500).json({
      message: "Failed to delete accessory",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
