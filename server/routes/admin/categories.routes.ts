import { type InsertCategory, insertCategorySchema } from "@run-remix/shared";
import { Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { getAuditContext } from "../../middleware/request-context.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";
import { categoryService } from "../../services/category.service.js";

const router = Router();

/**
 * GET /api/admin/categories
 * List all categories with pagination
 */
router.get("/", authService.requireAdmin, async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  const result = await categoryService.getCategories(page, limit);

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * GET /api/admin/categories/:id
 * Get single category by ID
 */
router.get("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.getCategoryById(id);

  return result.match(
    (data: unknown) => res.json(data),
    (error: { statusCode?: number; message?: string }) =>
      res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * POST /api/admin/categories
 * Create new category
 */
router.post(
  "/",
  authService.requireAdmin,
  validateRequest({ body: insertCategorySchema }),
  async (req, res) => {
    const result = await categoryService.createCategory(req.body);

    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * PATCH /api/admin/categories/:id
 * Update category
 */
router.patch(
  "/:id",
  authService.requireAdmin,
  validateRequest({ body: insertCategorySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;

    const result = await categoryService.updateCategory(id, req.body as Partial<InsertCategory>);

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * DELETE /api/admin/categories/:id
 * Soft delete category
 */
router.delete("/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const result = await categoryService.deleteCategory(id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * POST /api/admin/categories/:id/restore
 * Restore soft-deleted category
 */
router.post("/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const auditContext = getAuditContext(req);
  const result = await adminService.restoreCategory(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
