import { removeUndefined } from "../../lib/utilities/core-utils.js";

/**
 * ACCESSORIES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all accessory CRUD operations with caching and pagination
 */

import { insertAccessorySchema } from "@run-remix/shared";
import { Router } from "express";
import { accessoryRepository } from "../../lib/db/repositories/accessory-repository.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// GET /api/accessories - List accessories with pagination and filters
router.get("/accessories", async (req, res) => {
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
      accessoryRepository.getAccessoriesWithCount(
        limit,
        offset,
        removeUndefined({
          category,
          search,
        }),
      ),
      5000,
      "Get accessories with count",
    );
    res.json(result);
  } else {
    // Return just accessories array
    const accessories = await withTimeout(
      accessoryRepository.getAccessories(limit, offset, removeUndefined({ category, search })),
      5000,
      "Get accessories",
    );
    res.json(accessories);
  }
});

// POST /api/accessories - Create new accessory
router.post("/accessories", authService.requireAdmin, async (req, res) => {
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
});

// PUT /api/accessories/:id - Update accessory
router.put("/accessories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "accessory");
  if (id === null) {
    return;
  }
  const validatedData = insertAccessorySchema.partial().parse(req.body);

  // Convert price to string if it's a number (database expects string for decimal)
  const dataToUpdate = {
    ...validatedData,
    price: validatedData.price !== undefined ? String(validatedData.price) : undefined,
  };

  const accessory = await withTimeout(
    accessoryRepository.updateAccessory(id, removeUndefined(dataToUpdate)),
    10000,
    "Update accessory",
  );

  if (!accessory) {
    return res.status(404).json({ message: "Accessory not found" });
  }

  return res.json(accessory);
});

// DELETE /api/accessories/:id - Delete accessory
router.delete("/accessories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "accessory");
  if (id === null) {
    return;
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
});

export default router;
