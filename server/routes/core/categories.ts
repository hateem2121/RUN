import { categoryReorderSchema } from "@run-remix/shared";
import { Router } from "express";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { normalizeSlug } from "../../lib/utilities/slug-utils.js";
import { createRateLimiter } from "../../middleware/rateLimiter.js";
import { authService } from "../../services/auth-service.js";
import { categoryService } from "../../services/category.service.js";

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
  return result.match(
    (categories) => res.json(categories),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// Bulk reorder categories
router.patch("/categories/reorder", authService.requireAdmin, async (req, res) => {
  const parsed = categoryReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
  }

  const result = await categoryService.reorderCategories(parsed.data);
  return result.match(
    ({ updated }) =>
      res.json({ success: true, message: `Successfully reordered ${updated} categories`, updated }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
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

  return result.match(
    (category) => res.json(category),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// GET /api/categories/:id
router.get("/categories/:id", async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.getCategoryById(id);
  return result.match(
    (category) => res.json(category),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/categories
router.post("/categories", authService.requireAdmin, writeRateLimiter, async (req, res) => {
  const result = await categoryService.createCategory(req.body);
  return result.match(
    (category) => res.status(201).json(category),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PUT /api/categories/:id
router.put("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.updateCategory(id, req.body);
  return result.match(
    (category) => res.json(category),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PATCH /api/categories/:id
router.patch("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.updateCategory(id, req.body);
  return result.match(
    (category) => res.json(category),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// DELETE /api/categories/:id
router.delete("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.deleteCategory(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/categories/:id/restore
router.post("/categories/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.restoreCategory(id);
  return result.match(
    () => res.json({ success: true, message: "Restored", id }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// DELETE /api/categories/:id/hard-delete
router.delete("/categories/:id/hard-delete", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.hardDeleteCategory(id);
  return result.match(
    () => res.status(204).send(),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
