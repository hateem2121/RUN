import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { validateAndSanitizeInput, validateIdParam } from "../../lib/utilities/core-utils.js";
import { normalizeSlug } from "../../lib/utilities/slug-utils.js";
import { createRateLimiter } from "../../middleware/rateLimiter.js";
import { authService } from "../../services/auth-service.js";
import { categoryService } from "../../services/category.service.js";
import { webhookService } from "../../services/webhook-service.js";

const writeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many write requests. Please try again later.",
});

const router = Router();

// GET /api/categories - List all categories with optional pagination
router.get("/categories", async (req, res) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const pageNum = page ? parseInt(page, 10) : undefined;
  const limitNum = limit ? parseInt(limit, 10) : undefined;

  const result = await categoryService.getCategories(pageNum, limitNum);
  if (result.isErr()) throw result.error;
  return res.json(result.value);
});

// Bulk reorder categories
router.patch("/categories/reorder", authService.requireAdmin, async (req, res) => {
  const result = await categoryService.reorderCategories(req.body);
  if (result.isErr()) throw result.error;

  const { updated } = result.value;

  CacheOperations.invalidateCategories().catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache after reorder:", cacheError),
  );

  webhookService.trigger("category.reordered", { count: updated });

  return res.json({
    success: true,
    message: `Successfully reordered ${updated} categories`,
    updated,
  });
});

// GET /api/categories/by-slug/:slug
router.get("/categories/by-slug/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(422).json({
      success: false,
      error: { message: "Slug parameter is required" },
    });
  }

  const normalizedSlug = normalizeSlug(slug);
  const result = await categoryService.getCategoryBySlug(normalizedSlug);

  if (result.isErr()) throw result.error;

  return res.json(result.value);
});

// GET /api/categories/:id
router.get("/categories/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.getCategoryById(id);
  if (result.isErr()) throw result.error;
  return res.json(result.value);
});

// POST /api/categories
router.post("/categories", authService.requireAdmin, writeRateLimiter, async (req, res) => {
  if (req.body.name) req.body.name = validateAndSanitizeInput(req.body.name);
  if (req.body.slug) req.body.slug = validateAndSanitizeInput(req.body.slug);
  if (req.body.description) req.body.description = validateAndSanitizeInput(req.body.description);

  const result = await categoryService.createCategory(req.body);
  if (result.isErr()) throw result.error;

  const category = result.value;

  CacheOperations.invalidateCategories().catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.created", category);

  return res.status(201).json(category);
});

// PUT /api/categories/:id
router.put("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.updateCategory(id, req.body);
  if (result.isErr()) throw result.error;

  const category = result.value;

  CacheOperations.invalidateCategories(id).catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.updated", category);

  return res.json(category);
});

// PATCH /api/categories/:id
router.patch("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.updateCategory(id, req.body);
  if (result.isErr()) throw result.error;

  const category = result.value;

  CacheOperations.invalidateCategories(id).catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.updated", category);

  return res.json(category);
});

// DELETE /api/categories/:id
router.delete("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.deleteCategory(id);
  if (result.isErr()) throw result.error;

  CacheOperations.invalidateCategories(id).catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.deleted", { id });

  return res.status(204).send();
});

// POST /api/categories/:id/restore
router.post("/categories/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.restoreCategory(id);
  if (result.isErr()) throw result.error;

  CacheOperations.invalidateCategories(id).catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.restored", { id });

  return res.json({ success: true, message: "Restored", id });
});

// DELETE /api/categories/:id/hard-delete
router.delete("/categories/:id/hard-delete", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.hardDeleteCategory(id);
  if (result.isErr()) throw result.error;

  CacheOperations.invalidateCategories(id).catch((cacheError) =>
    logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
  );

  webhookService.trigger("category.deleted", { id, permanent: true });

  return res.status(204).send();
});

export default router;
