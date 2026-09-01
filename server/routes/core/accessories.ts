import { insertAccessorySchema } from "@run-remix/shared";
import { Router } from "express";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { apiTier } from "../../middleware/rate-limit-tiers.js";
import { accessoryService } from "../../services/catalog/accessory.service.js";
import { authService } from "../../services/system/auth.service.js";

/**
 * ACCESSORIES ROUTER MODULE
 * Handles all accessory CRUD operations through the accessoryService layer
 */
const router = Router();
router.use(apiTier);

// GET /api/accessories - List accessories with pagination and filters
router.get("/accessories", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  const limit = parseInt(req.query.limit as string, 10) || 100;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const withCount = req.query.withCount === "true";

  const result = await accessoryService.getAccessories(
    limit,
    offset,
    removeUndefined({ category, search }),
  );

  return result.match(
    (data) => {
      if (withCount) {
        return res.json(data);
      }
      return res.json(data.accessories);
    },
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// POST /api/accessories - Create new accessory
router.post("/accessories", authService.requireAdmin, async (req, res) => {
  const validatedData = insertAccessorySchema.parse(req.body);

  const dataToInsert = {
    ...validatedData,
    price: validatedData.price !== undefined ? String(validatedData.price) : undefined,
  };

  const result = await accessoryService.createAccessory(dataToInsert);

  return result.match(
    (accessory) => res.status(201).json(accessory),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// PUT /api/accessories/:id - Update accessory
router.put("/accessories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "accessory");
  if (id === null) {
    return;
  }
  const validatedData = insertAccessorySchema.partial().parse(req.body);

  const dataToUpdate = {
    ...validatedData,
    price: validatedData.price !== undefined ? String(validatedData.price) : undefined,
  };

  const result = await accessoryService.updateAccessory(id, removeUndefined(dataToUpdate));

  return result.match(
    (accessory) => res.json(accessory),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// DELETE /api/accessories/:id - Delete accessory
router.delete("/accessories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "accessory");
  if (id === null) {
    return;
  }

  const result = await accessoryService.deleteAccessory(id);

  return result.match(
    () => res.status(204).send(),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

export default router;
