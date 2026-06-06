import { insertBlogCategorySchema, insertBlogPostSchema } from "@run-remix/shared";
import { Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { blogService } from "../../services/blog.service.js";

const router = Router();

// ============================================================================
// BLOG CATEGORIES
// ============================================================================

// GET /api/admin/blog/categories
router.get("/categories", authService.requireAdmin, async (_req, res) => {
  const result = await blogService.getBlogCategories();
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/admin/blog/categories
router.post(
  "/categories",
  authService.requireAdmin,
  validateRequest({ body: insertBlogCategorySchema }),
  async (req, res) => {
    const result = await blogService.createBlogCategory(req.body);
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// PATCH /api/admin/blog/categories/:id
router.patch(
  "/categories/:id",
  authService.requireAdmin,
  validateRequest({ body: insertBlogCategorySchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return;
    const result = await blogService.updateBlogCategory(id, req.body);
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// DELETE /api/admin/blog/categories/:id
router.delete("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;
  const result = await blogService.deleteBlogCategory(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ============================================================================
// BLOG POSTS
// ============================================================================

// GET /api/admin/blog/posts
router.get("/posts", authService.requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const search = req.query.search as string;
  const categoryId = req.query.category ? parseInt(req.query.category as string, 10) : undefined;
  const status = req.query.status as string;

  const result = await blogService.getBlogPosts(
    page,
    limit,
    removeUndefined({ search, categoryId, status }),
  );
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/admin/blog/posts
router.post(
  "/posts",
  authService.requireAdmin,
  validateRequest({ body: insertBlogPostSchema }),
  async (req, res) => {
    const result = await blogService.createBlogPost(
      req.body,
      req.user?.id ? String(req.user.id) : undefined,
    );
    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// GET /api/admin/blog/posts/:id
router.get("/posts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  const result = await blogService.getBlogPostById(id);
  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// PATCH /api/admin/blog/posts/:id
router.patch(
  "/posts/:id",
  authService.requireAdmin,
  validateRequest({ body: insertBlogPostSchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "post");
    if (id === null) return;
    const result = await blogService.updateBlogPost(id, req.body);
    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

// DELETE /api/admin/blog/posts/:id
router.delete("/posts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  const result = await blogService.deleteBlogPost(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// POST /api/admin/blog/posts/:id/restore
router.post("/posts/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  const result = await blogService.restoreBlogPost(id);
  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
