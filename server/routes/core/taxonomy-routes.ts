/**
 * TAXONOMY ROUTES
 * Phase 3.2: Modularized category, fiber, fabric, and certificate endpoints
 *
 * Endpoints:
 * - Categories (GET, POST, PATCH, DELETE)
 * - Fibers (GET, POST, DELETE)
 * - Fabrics (GET, POST, PATCH, DELETE)
 * - Certificates (GET, POST, DELETE)
 */

import type { Express } from "express";
import {
  insertCategorySchema,
  insertFabricSchema,
  insertFiberSchema,
} from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";

export function registerTaxonomyRoutes(app: Express): void {
  logger.info("[Routes] Registering taxonomy routes module");

  // Categories Routes
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await withTimeout(getStorage().getCategories(), 5000, "Get categories");
      return res.json(categories);
    } catch (error) {
      logger.error("[Categories] GET failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get categories",
      });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await withTimeout(getStorage().getCategory(id), 5000, "Get category by ID");
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.json(category);
    } catch (error) {
      logger.error("[Categories] GET by ID failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get category",
      });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      const category = await withTimeout(
        getStorage().createCategory(validation.data),
        10000,
        "Create category",
      );

      // CHUNK 1: Invalidate products cache (categories are part of products namespace) and homepage
      try {
        await CacheOperations.invalidateProducts();
        await CacheOperations.invalidateHomepage();
        logger.info("[Categories] ✅ Cache invalidated after category creation");
      } catch (err) {
        logger.error("[Categories] ❌ Cache invalidation failed:", err);
      }

      return res.json(category);
    } catch (error) {
      logger.error("[Categories] POST failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create category",
      });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await withTimeout(
        getStorage().updateCategory(id, req.body),
        10000,
        "Update category",
      );
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // CHUNK 1: Invalidate products cache and homepage after category update
      try {
        await CacheOperations.invalidateProducts();
        await CacheOperations.invalidateHomepage();
        logger.info("[Categories] ✅ Cache invalidated after category update");
      } catch (err) {
        logger.error("[Categories] ❌ Cache invalidation failed:", err);
      }

      return res.json(category);
    } catch (error) {
      logger.error("[Categories] PATCH failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update category",
      });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await withTimeout(getStorage().deleteCategory(id), 10000, "Delete category");
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }

      // CHUNK 1: Invalidate products cache and homepage after category deletion
      try {
        await CacheOperations.invalidateProducts();
        await CacheOperations.invalidateHomepage();
        logger.info("[Categories] ✅ Cache invalidated after category deletion");
      } catch (err) {
        logger.error("[Categories] ❌ Cache invalidation failed:", err);
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error("[Categories] DELETE failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete category",
      });
    }
  });

  app.patch("/api/categories/reorder", async (req, res) => {
    try {
      const { categoryOrders } = req.body;
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ error: "categoryOrders must be an array" });
      }

      // Manual category reordering since reorderCategories doesn't exist
      // Update each category's sort order
      for (const orderUpdate of categoryOrders) {
        if (orderUpdate.id && orderUpdate.sortOrder !== undefined) {
          await withTimeout(
            getStorage().updateCategory(orderUpdate.id, {
              sortOrder: orderUpdate.sortOrder,
            }),
            10000,
            `Update category ${orderUpdate.id} sort order`,
          );
        }
      }
      const updatedCategories = await withTimeout(
        getStorage().getCategories(),
        20000,
        "Get updated categories after reorder",
      );

      // CHUNK 1: Invalidate products cache and homepage after category reorder
      try {
        await CacheOperations.invalidateProducts();
        await CacheOperations.invalidateHomepage();
        logger.info("[Categories] ✅ Cache invalidated after category reorder");
      } catch (err) {
        logger.error("[Categories] ❌ Cache invalidation failed:", err);
      }

      return res.json({ success: true, categories: updatedCategories });
    } catch (error) {
      logger.error("[Categories] Reorder failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to reorder categories",
      });
    }
  });

  // Fibers Routes
  app.get("/api/fibers", async (_req, res) => {
    try {
      const fibers = await withTimeout(getStorage().getFibers(), 5000, "Get fibers");
      return res.json(fibers);
    } catch (error) {
      logger.error("[Fibers] GET failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get fibers",
      });
    }
  });

  app.post("/api/fibers", async (req, res) => {
    try {
      const validation = insertFiberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      const fiber = await withTimeout(
        getStorage().createFiber(validation.data),
        10000,
        "Create fiber",
      );

      // CHUNK 1: Invalidate fibers cache after fiber creation
      try {
        await CacheOperations.invalidateFibers();
        logger.info("[Fibers] ✅ Cache invalidated after fiber creation");
      } catch (err) {
        logger.error("[Fibers] ❌ Cache invalidation failed:", err);
      }

      return res.json(fiber);
    } catch (error) {
      logger.error("[Fibers] POST failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create fiber",
      });
    }
  });

  app.patch("/api/fibers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fiber = await withTimeout(
        getStorage().updateFiber(id, req.body),
        10000,
        "Update fiber",
      );
      if (!fiber) {
        return res.status(404).json({ error: "Fiber not found" });
      }

      // CHUNK 1: Invalidate fibers cache after fiber update
      try {
        await CacheOperations.invalidateFibers();
        logger.info("[Fibers] ✅ Cache invalidated after fiber update");
      } catch (err) {
        logger.error("[Fibers] ❌ Cache invalidation failed:", err);
      }

      return res.json(fiber);
    } catch (error) {
      logger.error("[Fibers] PATCH failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update fiber",
      });
    }
  });

  app.delete("/api/fibers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await withTimeout(getStorage().deleteFiber(id), 10000, "Delete fiber");
      if (!success) {
        return res.status(404).json({ error: "Fiber not found" });
      }

      // CHUNK 1: Invalidate fibers cache after fiber deletion
      try {
        await CacheOperations.invalidateFibers();
        logger.info("[Fibers] ✅ Cache invalidated after fiber deletion");
      } catch (err) {
        logger.error("[Fibers] ❌ Cache invalidation failed:", err);
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error("[Fibers] DELETE failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete fiber",
      });
    }
  });

  // Fabrics Routes
  app.get("/api/fabrics", async (_req, res) => {
    try {
      const fabrics = await withTimeout(getStorage().getFabrics(), 5000, "Get fabrics");
      return res.json(fabrics);
    } catch (error) {
      logger.error("[Fabrics] GET failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get fabrics",
      });
    }
  });

  app.post("/api/fabrics", async (req, res) => {
    try {
      const validation = insertFabricSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      // Transform sustainabilityScore to number if present
      const fabricData = {
        ...validation.data,
        sustainabilityScore: validation.data.sustainabilityScore
          ? Number(validation.data.sustainabilityScore)
          : undefined,
      };

      const fabric = await withTimeout(
        getStorage().createFabric(fabricData),
        10000,
        "Create fabric",
      );

      // CHUNK 1: Invalidate fabrics and sustainability caches (fabrics appear on sustainability page)
      try {
        await CacheOperations.invalidateFabrics();
        await CacheOperations.invalidateSustainability();
        logger.info("[Fabrics] ✅ Cache invalidated after fabric creation");
      } catch (err) {
        logger.error("[Fabrics] ❌ Cache invalidation failed:", err);
      }

      return res.json(fabric);
    } catch (error) {
      logger.error("[Fabrics] POST failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create fabric",
      });
    }
  });

  app.patch("/api/fabrics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Transform sustainabilityScore to number if present
      const fabricData = {
        ...req.body,
        sustainabilityScore: req.body.sustainabilityScore
          ? Number(req.body.sustainabilityScore)
          : undefined,
      };

      const fabric = await withTimeout(
        getStorage().updateFabric(id, fabricData),
        10000,
        "Update fabric",
      );
      if (!fabric) {
        return res.status(404).json({ error: "Fabric not found" });
      }

      // CHUNK 1: Invalidate fabrics and sustainability caches after fabric update
      try {
        await CacheOperations.invalidateFabrics();
        await CacheOperations.invalidateSustainability();
        logger.info("[Fabrics] ✅ Cache invalidated after fabric update");
      } catch (err) {
        logger.error("[Fabrics] ❌ Cache invalidation failed:", err);
      }

      return res.json(fabric);
    } catch (error) {
      logger.error("[Fabrics] PATCH failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update fabric",
      });
    }
  });

  app.delete("/api/fabrics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await withTimeout(getStorage().deleteFabric(id), 10000, "Delete fabric");
      if (!success) {
        return res.status(404).json({ error: "Fabric not found" });
      }

      // CHUNK 1: Invalidate fabrics and sustainability caches after fabric deletion
      try {
        await CacheOperations.invalidateFabrics();
        await CacheOperations.invalidateSustainability();
        logger.info("[Fabrics] ✅ Cache invalidated after fabric deletion");
      } catch (err) {
        logger.error("[Fabrics] ❌ Cache invalidation failed:", err);
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error("[Fabrics] DELETE failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete fabric",
      });
    }
  });

  logger.info("[Routes] Taxonomy routes registered successfully");
}
