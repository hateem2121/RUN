/**
 * CATEGORIES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all category CRUD operations and relationships
 */

import { Router } from "express";
import { z } from "zod";
import { type Category, insertCategorySchema } from "../../../shared/schema.js";
import { db } from "../../db.js";
import { CacheOperations } from "../../lib/cache-strategies.js";
import { retryDbOperation } from "../../lib/db-retry.js";
import { withTimeout } from "../../lib/request-timeout.js";
import { normalizeSlug } from "../../lib/slug-utils.js";
import { logger } from "../../lib/smart-logger.js";
import { getStorage } from "../../lib/storage-singleton.js";
import {
  checkRateLimit,
  shouldBypassCache,
  validateAndSanitizeInput,
  validateIdParam,
} from "../../utils.js";

const router = Router();

// GET /api/categories - List all categories with optional pagination
// CHUNK 5: Added pagination support for large category lists
router.get("/categories", async (req, res) => {
  try {
    const { page, limit } = req.query;

    // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
    if (shouldBypassCache(req)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }

    // If pagination params provided, use pagination
    if (page || limit) {
      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = Math.min(parseInt(limit as string, 10) || 50, 100);
      const offset = (pageNum - 1) * pageSize;

      const categories = await withTimeout(
        retryDbOperation(() => getStorage().getCategories(pageSize, offset), {
          operationName: "Get categories with pagination",
        }),
        10000,
        "Get categories with pagination",
      );
      const totalCount = await withTimeout(
        retryDbOperation(() => getStorage().getCategoriesCount(), {
          operationName: "Get categories count",
        }),
        10000,
        "Get categories count",
      );

      return res.json({
        data: categories,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: totalCount,
          pages: Math.ceil(totalCount / pageSize),
        },
      });
    } else {
      // No pagination requested - return all categories (backward compatible)
      const categories = await withTimeout(
        retryDbOperation(() => getStorage().getCategories(), {
          operationName: "Get all categories",
        }),
        10000,
        "Get all categories",
      );
      return res.json(categories);
    }
  } catch (error: unknown) {
    logger.error("Route: Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// Bulk reorder categories endpoint for drag-and-drop (MUST be before :id route)
router.patch("/categories/reorder", async (req, res) => {
  try {
    // Validate request body structure
    const reorderSchema = z.object({
      categories: z.array(
        z.object({
          id: z.number(),
          sortOrder: z.number(),
          parentId: z.number().nullable().optional(),
        }),
      ),
    });

    const validatedData = reorderSchema.parse(req.body);

    // Wrap all updates in a transaction for atomicity
    const startTime = Date.now();
    const results = await withTimeout(
      db.transaction(async () => {
        const storage = getStorage();
        const updateResults = [];

        for (const categoryData of validatedData.categories) {
          const existingCategory = await storage.getCategory(categoryData.id);
          if (existingCategory) {
            const updatedCategory = {
              ...existingCategory,
              sortOrder: categoryData.sortOrder,
              ...(categoryData.parentId !== undefined && {
                parentId: categoryData.parentId,
              }),
            };
            const updated = await storage.updateCategory(categoryData.id, updatedCategory);
            updateResults.push(updated);
          }
        }
        return updateResults;
      }),
      15000,
      "Bulk reorder categories transaction",
    );
    const successCount = results.length;
    const duration = Date.now() - startTime;

    logger.debug(
      `[Transaction] Bulk category reorder completed in ${duration}ms (${successCount} categories)`,
    );

    // CHUNK 10: Cache invalidation with new pattern
    try {
      await CacheOperations.invalidateCategories();
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache after reorder:", cacheError);
    }

    return res.json({
      success: true,
      message: `Successfully reordered ${successCount} categories`,
      updated: successCount,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid reorder data format",
          details: error.issues,
        },
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to reorder categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// GET /api/categories/by-slug/:slug - Get category by slug (SEO-friendly lookup)
router.get("/categories/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
    if (shouldBypassCache(req)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: { message: "Slug parameter is required" },
      });
    }

    // Normalize slug for consistent lookups (lowercase-kebab-case)
    const normalizedSlug = normalizeSlug(slug);

    const category = await withTimeout(
      retryDbOperation(() => getStorage().getCategoryBySlug(normalizedSlug), {
        operationName: `Get category by slug: ${normalizedSlug}`,
      }),
      5000,
      `Get category by slug: ${normalizedSlug}`,
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }

    return res.json(category);
  } catch (error: unknown) {
    logger.error("Route: Error fetching category by slug:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch category" },
    });
  }
});

// GET /api/categories/:id - Get single category
router.get("/categories/:id", async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return; // Error response already sent

    // Smart Caching: Bypass for admin/nocache, otherwise cache for 60s
    if (shouldBypassCache(req)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    } else {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().getCategory(id), {
        operationName: `Get category ${id}`,
      }),
      5000,
      `Get category ${id}`,
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }
    return res.json(category);
  } catch (error: unknown) {
    logger.error("Route: Error fetching category:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch category" },
    });
  }
});

// POST /api/categories - Create new category
router.post("/categories", async (req, res) => {
  try {
    // Rate limiting check
    if (!checkRateLimit()) {
      return res.status(429).json({
        success: false,
        error: { message: "Too many requests. Please try again later." },
      });
    }

    logger.debug("CREATE CATEGORY Request Body:", JSON.stringify(req.body, null, 2));

    // Enhanced input validation and sanitization
    if (req.body.name) {
      req.body.name = validateAndSanitizeInput(req.body.name);
    }
    if (req.body.slug) {
      req.body.slug = validateAndSanitizeInput(req.body.slug);
    }
    if (req.body.description) {
      req.body.description = validateAndSanitizeInput(req.body.description);
    }
    if (req.body.metaTitle) {
      req.body.metaTitle = validateAndSanitizeInput(req.body.metaTitle);
    }
    if (req.body.metaDescription) {
      req.body.metaDescription = validateAndSanitizeInput(req.body.metaDescription);
    }

    const validatedData = insertCategorySchema.parse(req.body);

    // Get existing categories for validation and sortOrder calculation
    const allCategories = await withTimeout(
      retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get categories for validation",
      }),
      10000,
      "Get categories for validation",
    );

    // Validate unique grid position for featured categories
    if (validatedData.featuredOnHomepage && validatedData.gridPosition) {
      const existingCategory = allCategories.find(
        (c: Category) => c.featuredOnHomepage && c.gridPosition === validatedData.gridPosition,
      );
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Grid position ${validatedData.gridPosition} is already taken by category "${existingCategory.name}". Please choose a different position.`,
          },
        });
      }
    }

    // Set default sortOrder if not provided
    if (!validatedData.sortOrder) {
      const maxSortOrder = allCategories.reduce((max, cat) => Math.max(max, cat.sortOrder || 0), 0);
      validatedData.sortOrder = maxSortOrder + 10;
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().createCategory(validatedData), {
        operationName: "Create category",
      }),
      10000,
      "Create category",
    );

    // CHUNK 10: Cache invalidation with new pattern
    try {
      await CacheOperations.invalidateCategories();
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.debug("CREATE CATEGORY Validation errors:", JSON.stringify(error.issues, null, 2));
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("CREATE CATEGORY Other error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create category" },
    });
  }
});

// PUT /api/categories/:id - Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validatedData = insertCategorySchema.partial().parse(req.body);

    const allCategories = await withTimeout(
      retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get categories for update validation",
      }),
      10000,
      "Get categories for update validation",
    );

    // Prevent circular references
    if (validatedData.parentId) {
      const isCircular = (categoryId: number, parentId: number): boolean => {
        if (categoryId === parentId) return true;
        const parent = allCategories.find((c: Category) => c.id === parentId);
        if (!parent || !parent.parentId) return false;
        return isCircular(categoryId, parent.parentId);
      };

      if (isCircular(id, validatedData.parentId as number)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Cannot set parent category - this would create a circular reference",
          },
        });
      }
    }

    // Validate unique grid position for featured categories
    if (validatedData.featuredOnHomepage && validatedData.gridPosition) {
      const existingCategory = allCategories.find(
        (c: Category) =>
          c.id !== id && c.featuredOnHomepage && c.gridPosition === validatedData.gridPosition,
      );
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Grid position ${validatedData.gridPosition} is already taken by category "${existingCategory.name}". Please choose a different position.`,
          },
        });
      }
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().updateCategory(id, validatedData), {
        operationName: `Update category ${id}`,
      }),
      10000,
      `Update category ${id}`,
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }

    // CHUNK 10: Cache invalidation with new pattern
    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update category" },
    });
  }
});

// PATCH /api/categories/:id - Update category (same as PUT)
router.patch("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validatedData = insertCategorySchema.partial().parse(req.body);

    const allCategories = await withTimeout(
      retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get categories for patch validation",
      }),
      10000,
      "Get categories for patch validation",
    );

    // Prevent circular references
    if (validatedData.parentId) {
      const isCircular = (categoryId: number, parentId: number): boolean => {
        if (categoryId === parentId) return true;
        const parent = allCategories.find((c: Category) => c.id === parentId);
        if (!parent || !parent.parentId) return false;
        return isCircular(categoryId, parent.parentId);
      };

      if (isCircular(id, validatedData.parentId as number)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Cannot set parent category - this would create a circular reference",
          },
        });
      }
    }

    // Validate unique grid position for featured categories
    if (validatedData.featuredOnHomepage && validatedData.gridPosition) {
      const existingCategory = allCategories.find(
        (c: Category) =>
          c.id !== id && c.featuredOnHomepage && c.gridPosition === validatedData.gridPosition,
      );
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Grid position ${validatedData.gridPosition} is already taken by category "${existingCategory.name}". Please choose a different position.`,
          },
        });
      }
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().updateCategory(id, validatedData), {
        operationName: `Patch category ${id}`,
      }),
      10000,
      `Patch category ${id}`,
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }

    // CHUNK 10: Cache invalidation with new pattern
    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update category" },
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await withTimeout(
      retryDbOperation(() => getStorage().deleteCategory(id), {
        operationName: `Delete category ${id}`,
      }),
      10000,
      `Delete category ${id}`,
    );
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }

    // CHUNK 10: Cache invalidation with new pattern
    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.status(204).send();
  } catch (_error) {
    return res.status(500).json({
      success: false,
      error: { message: "Failed to delete category" },
    });
  }
});

// GET /api/categories/deleted - List soft-deleted categories
router.get("/categories/deleted", async (_req, res) => {
  try {
    const deletedCategories = await withTimeout(
      retryDbOperation(() => getStorage().getDeletedCategories(), {
        operationName: "Get deleted categories",
      }),
      10000,
      "Get deleted categories",
    );
    return res.json(deletedCategories);
  } catch (error) {
    logger.error("[Categories] Failed to get deleted categories:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve deleted categories" },
    });
  }
});

// POST /api/categories/:id/restore - Restore soft-deleted category
router.post("/categories/:id/restore", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid category ID" },
      });
    }
    const restored = await withTimeout(
      retryDbOperation(() => getStorage().restoreCategory(id), {
        operationName: `Restore category ${id}`,
      }),
      10000,
      `Restore category ${id}`,
    );

    if (!restored) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found or already restored" },
      });
    }

    // Invalidate both active and deleted categories cache
    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.json({
      success: true,
      message: "Category restored successfully",
      id,
    });
  } catch (error) {
    logger.error("[Categories] Failed to restore category:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to restore category" },
    });
  }
});

// DELETE /api/categories/:id/hard-delete - Permanently delete category
router.delete("/categories/:id/hard-delete", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid category ID" },
      });
    }
    const hardDeleted = await withTimeout(
      retryDbOperation(() => getStorage().permanentlyDeleteCategory(id), {
        operationName: `Hard delete category ${id}`,
      }),
      10000,
      `Hard delete category ${id}`,
    );

    if (!hardDeleted) {
      return res.status(404).json({
        success: false,
        error: { message: "Category not found" },
      });
    }

    // Invalidate both active and deleted categories cache
    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    return res.status(204).send();
  } catch (error) {
    logger.error("[Categories] Failed to hard delete category:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to permanently delete category" },
    });
  }
});

export default router;
