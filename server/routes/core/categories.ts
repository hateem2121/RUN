import { removeUndefined } from "../../utils.js";

/**
 * CATEGORIES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all category CRUD operations and relationships
 */

import { Router } from "express";
import { z } from "zod";
import { type Category, insertCategorySchema } from "../../../shared/schema.js";
import { db } from "../../db.js";
import { jsonResponse, registry } from "../../lib/api/openapi-generator.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { retryDbOperation } from "../../lib/db/db-retry.js";

import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { normalizeSlug } from "../../lib/utilities/slug-utils.js";
import { authService } from "../../services/auth-service.js";
import { webhookService } from "../../services/webhook-service.js";
import {
  checkRateLimit,
  shouldBypassCache,
  validateAndSanitizeInput,
  validateIdParam,
} from "../../utils.js";

const router = Router();

// OpenAPI Registration
registry.registerPath({
  method: "get",
  path: "/categories",
  summary: "List all categories",
  description:
    "Retrieve all product categories with optional pagination. Useful for building navigation menus and category landing pages.",
  tags: ["Categories"],
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "integer", default: 1 },
      description: "Page number",
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "integer", default: 50 },
      description: "Items per page (max 100)",
    },
  ],
  responses: {
    200: jsonResponse(
      z.union([
        z.array(z.any()),
        z.object({
          data: z.array(z.any()),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            pages: z.number(),
          }),
        }),
      ]),
      "List of categories or paginated categories object",
    ),
  },
});

registry.registerPath({
  method: "get",
  path: "/categories/by-slug/{slug}",
  summary: "Get category by slug",
  description:
    "Retrieve a category by its SEO-friendly slug. Useful for dynamic routing on the frontend.",
  tags: ["Categories"],
  parameters: [
    {
      name: "slug",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Category slug",
    },
  ],
  responses: {
    200: jsonResponse(z.any(), "The category object"),
    404: { description: "Category not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/categories/{id}",
  summary: "Get category by ID",
  description: "Retrieve full details for a specific category.",
  tags: ["Categories"],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    200: jsonResponse(z.any(), "The category object"),
    404: { description: "Category not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/categories",
  summary: "Create a new category",
  description: "Add a new category to the catalog. Admin role required.",
  tags: ["Categories"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertCategorySchema,
        },
      },
    },
  },
  responses: {
    201: jsonResponse(z.any(), "The created category"),
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/categories/reorder",
  summary: "Bulk reorder categories",
  description:
    "Update the sort order and parenting for multiple categories at once. Admin role required.",
  tags: ["Categories"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            categories: z.array(
              z.object({
                id: z.number(),
                sortOrder: z.number(),
                parentId: z.number().nullable().optional(),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: jsonResponse(
      z.object({ success: z.boolean(), message: z.string(), updated: z.number() }),
      "Successfully reordered",
    ),
    400: { description: "Invalid request format" },
  },
});

registry.registerPath({
  method: "put",
  path: "/categories/{id}",
  summary: "Update category (Full)",
  description: "Replace a category's entire configuration. Admin role required.",
  tags: ["Categories"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertCategorySchema,
        },
      },
    },
  },
  responses: {
    200: jsonResponse(z.any(), "The updated category"),
    404: { description: "Category not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/categories/{id}",
  summary: "Delete category",
  description: "Soft-delete a category. Admin role required.",
  tags: ["Categories"],
  security: [{ sessionAuth: [] }, { bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    204: { description: "Category deleted successfully" },
    404: { description: "Category not found" },
  },
});

// GET /api/categories - List all categories with optional pagination
router.get("/categories", async (req, res) => {
  // CLAIM REQUEST
  (req as unknown as Record<string, boolean>)._handled = true;

  try {
    const { page, limit } = req.query as { page?: string; limit?: string };

    if (page || limit) {
      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = Math.min(parseInt(limit as string, 10) || 50, 100);
      const offset = (pageNum - 1) * pageSize;

      const categories = await retryDbOperation(
        () => getStorage().getCategories(pageSize, offset),
        { operationName: "Get categories with pagination" },
      );
      const totalCount = await retryDbOperation(() => getStorage().getCategoriesCount(), {
        operationName: "Get categories count",
      });

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
      const categories = await retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get all categories",
      });

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

// Bulk reorder categories
router.patch("/categories/reorder", authService.requireAdmin, async (req, res) => {
  try {
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

    const startTime = Date.now();
    const results = await withTimeout(
      db.transaction(async () => {
        const storage = getStorage();
        const updateResults = [];

        for (const categoryData of removeUndefined(validatedData).categories) {
          const existingCategory = await storage.getCategory(categoryData.id);
          if (existingCategory) {
            const updatedCategory = {
              ...existingCategory,
              isActive: existingCategory.isActive ?? undefined,
              description: existingCategory.description ?? undefined,
              gridPosition: existingCategory.gridPosition ?? undefined,
              featuredOnHomepage: existingCategory.featuredOnHomepage ?? undefined,
              featuredContent: existingCategory.featuredContent
                ? (existingCategory.featuredContent as Record<string, unknown>)
                : undefined,
              level: existingCategory.level ?? undefined,
              parentId: existingCategory.parentId ?? undefined,
              sortOrder: categoryData.sortOrder,
              ...(categoryData.parentId !== undefined && {
                parentId: categoryData.parentId,
              }),
            };
            const updated = await storage.updateCategory(
              categoryData.id,
              updatedCategory as Record<string, unknown>,
            );
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

    try {
      await CacheOperations.invalidateCategories();
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache after reorder:", cacheError);
    }

    // Trigger Webhook for major reorder event
    webhookService.trigger("category.reordered", { count: successCount });

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

// GET /api/categories/by-slug/:slug
router.get("/categories/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

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

// GET /api/categories/:id
router.get("/categories/:id", async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) {
      return;
    }

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

// POST /api/categories
router.post("/categories", authService.requireAdmin, async (req, res) => {
  try {
    if (!checkRateLimit()) {
      return res.status(429).json({
        success: false,
        error: { message: "Too many requests. Please try again later." },
      });
    }

    if (req.body.name) req.body.name = validateAndSanitizeInput(req.body.name);
    if (req.body.slug) req.body.slug = validateAndSanitizeInput(req.body.slug);
    if (req.body.description) req.body.description = validateAndSanitizeInput(req.body.description);

    const validatedData = insertCategorySchema.parse(req.body);

    const allCategories = (await withTimeout(
      retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get categories for validation",
      }),
      10000,
      "Get categories for validation",
    )) as Category[];

    if (
      removeUndefined(validatedData).featuredOnHomepage &&
      removeUndefined(validatedData).gridPosition
    ) {
      const existingCategory = allCategories.find(
        (c: Category) =>
          c.featuredOnHomepage && c.gridPosition === removeUndefined(validatedData).gridPosition,
      );
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Grid position ${removeUndefined(validatedData).gridPosition} is already taken by category "${existingCategory.name}".`,
          },
        });
      }
    }

    if (!removeUndefined(validatedData).sortOrder) {
      const maxSortOrder = allCategories.reduce((max, cat) => Math.max(max, cat.sortOrder || 0), 0);
      removeUndefined(validatedData).sortOrder = maxSortOrder + 10;
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().createCategory(removeUndefined(validatedData)), {
        operationName: "Create category",
      }),
      10000,
      "Create category",
    );

    try {
      await CacheOperations.invalidateCategories();
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.created", category);

    return res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation error", details: error.issues },
      });
    }
    logger.error("CREATE CATEGORY Error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create category" },
    });
  }
});

// PUT /api/categories/:id
router.put("/categories/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;

    const validatedData = insertCategorySchema.partial().parse(req.body);
    const allCategories = (await withTimeout(
      retryDbOperation(() => getStorage().getCategories(), {
        operationName: "Get categories for update validation",
      }),
      10000,
      "Get categories for update validation",
    )) as Category[];

    // Circular reference check
    if (removeUndefined(validatedData).parentId) {
      const isCircular = (categoryId: number, parentId: number): boolean => {
        if (categoryId === parentId) return true;
        const parent = allCategories.find((c: Category) => c.id === parentId);
        if (!parent || !parent.parentId) return false;
        return isCircular(categoryId, parent.parentId);
      };

      if (isCircular(id, removeUndefined(validatedData).parentId as number)) {
        return res.status(400).json({
          success: false,
          error: { message: "Circular reference detected" },
        });
      }
    }

    const category = await withTimeout(
      retryDbOperation(() => getStorage().updateCategory(id, removeUndefined(validatedData)), {
        operationName: `Update category ${id}`,
      }),
      10000,
      `Update category ${id}`,
    );

    if (!category) {
      return res.status(404).json({ success: false, error: { message: "Category not found" } });
    }

    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.updated", category);

    return res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to update category" } });
  }
});

// PATCH /api/categories/:id
router.patch("/categories/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;
    const validatedData = insertCategorySchema.partial().parse(req.body);

    const category = await withTimeout(
      retryDbOperation(() => getStorage().updateCategory(id, removeUndefined(validatedData)), {
        operationName: `Patch category ${id}`,
      }),
      10000,
      `Patch category ${id}`,
    );

    if (!category) {
      return res.status(404).json({ success: false, error: { message: "Category not found" } });
    }

    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.updated", category);

    return res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to update category" } });
  }
});

// DELETE /api/categories/:id
router.delete("/categories/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;

    const deleted = await withTimeout(
      retryDbOperation(() => getStorage().deleteCategory(id), {
        operationName: `Delete category ${id}`,
      }),
      10000,
      `Delete category ${id}`,
    );

    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: "Category not found" } });
    }

    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.deleted", { id });

    return res.status(204).send();
  } catch (_error) {
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to delete category" } });
  }
});

// GET /api/categories/deleted
router.get("/categories/deleted", async (_req, res) => {
  try {
    const deletedCategories = await withTimeout(
      retryDbOperation(() => getStorage().getCategoriesIncludingDeleted(), {
        operationName: "Get deleted categories",
      }),
      10000,
      "Get deleted categories",
    );
    return res.json(deletedCategories);
  } catch (_error) {
    return res.status(500).json({ success: false, error: { message: "Failed to retrieve" } });
  }
});

// POST /api/categories/:id/restore
router.post("/categories/:id/restore", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;
    const restored = await withTimeout(
      retryDbOperation(() => getStorage().restoreCategory(id), {
        operationName: `Restore category ${id}`,
      }),
      10000,
      `Restore category ${id}`,
    );

    if (!restored) {
      return res.status(404).json({ success: false, error: { message: "Not found" } });
    }

    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.restored", { id });

    return res.json({ success: true, message: "Restored", id });
  } catch (_error) {
    return res.status(500).json({ success: false, error: { message: "Failed" } });
  }
});

// DELETE /api/categories/:id/hard-delete
router.delete("/categories/:id/hard-delete", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;
    const hardDeleted = await withTimeout(
      retryDbOperation(() => getStorage().permanentlyDeleteCategory(id), {
        operationName: `Hard delete category ${id}`,
      }),
      10000,
      `Hard delete category ${id}`,
    );

    if (!hardDeleted) {
      return res.status(404).json({ success: false, error: { message: "Not found" } });
    }

    try {
      await CacheOperations.invalidateCategories(id);
    } catch (cacheError) {
      logger.warn("[CACHE] Failed to invalidate category cache:", cacheError);
    }

    // Trigger Webhook
    webhookService.trigger("category.deleted", { id, permanent: true });

    return res.status(204).send();
  } catch (_error) {
    return res.status(500).json({ success: false, error: { message: "Failed" } });
  }
});

export default router;
