import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import {
  type InsertBlogPost,
  insertBlogCategorySchema,
  insertBlogPostSchema,
  users,
} from "../../../shared/index.js";
import { db } from "../../db.js";
import { blogRepository } from "../../lib/db/repositories/index.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { authService } from "../../services/auth-service.js";
import { removeUndefined, validateIdParam } from "../../utils.js";

const router = Router();

// ============================================================================
// BLOG CATEGORIES
// ============================================================================

// GET /api/admin/blog/categories
router.get("/categories", authService.requireAdmin, async (_req, res) => {
  try {
    const categories = await withTimeout(
      blogRepository.getBlogCategories(),
      5000,
      "Fetch all blog categories",
    );
    return res.json(categories || []);
  } catch (error) {
    logger.error("[Blog] Error fetching categories:", error);
    return res.status(500).json({ error: "Failed to fetch blog categories" });
  }
});

// POST /api/admin/blog/categories
router.post(
  "/categories",
  authService.requireAdmin,
  validateRequest({ body: insertBlogCategorySchema }),
  async (req, res) => {
    try {
      const category = await withTimeout(
        blogRepository.createBlogCategory(req.body),
        5000,
        "Create blog category",
      );
      return res.status(201).json(category);
    } catch (error) {
      logger.error("[Blog] Error creating category:", error);
      return res.status(500).json({ error: "Failed to create blog category" });
    }
  },
);

// PATCH /api/admin/blog/categories/:id
router.patch("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;
  try {
    const category = await withTimeout(
      blogRepository.updateBlogCategory(id, req.body),
      5000,
      "Update blog category",
    );
    if (!category) return res.status(404).json({ error: "Category not found" });
    return res.json(category);
  } catch (error) {
    logger.error("[Blog] Error updating category:", error);
    return res.status(500).json({ error: "Failed to update blog category" });
  }
});

// DELETE /api/admin/blog/categories/:id
router.delete("/categories/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;
  try {
    const result = await withTimeout(
      blogRepository.deleteBlogCategory(id),
      5000,
      "Delete blog category",
    );
    if (!result) return res.status(404).json({ error: "Category not found" });
    return res.json({ success: true });
  } catch (error) {
    logger.error("[Blog] Error deleting category:", error);
    return res.status(500).json({ error: "Failed to delete blog category" });
  }
});

// ============================================================================
// BLOG POSTS
// ============================================================================

// GET /api/admin/blog/posts
router.get("/posts", authService.requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const search = req.query.search as string;
    const categoryId = req.query.category ? parseInt(req.query.category as string, 10) : undefined;
    const status = req.query.status as string;

    const result = await withTimeout(
      blogRepository.getBlogPosts(
        limit,
        (page - 1) * limit,
        removeUndefined({ search, categoryId, status }),
      ),
      5000,
      "Fetch blog posts",
    );
    return res.json(result);
  } catch (error) {
    logger.error("[Blog] Error fetching posts:", error);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// POST /api/admin/blog/posts
router.post("/posts", authService.requireAdmin, async (req, res) => {
  try {
    let fallbackAuthorId = "system";
    const [firstUser] = await db.select().from(users).limit(1);
    if (firstUser) {
      fallbackAuthorId = firstUser.id;
    }

    const payload = {
      ...req.body,
      authorId: req.user?.id ? String(req.user.id) : fallbackAuthorId,
    };
    const postData = insertBlogPostSchema.parse(payload);
    const post = await withTimeout(
      blogRepository.createBlogPost(postData),
      5000,
      "Create blog post",
    );
    return res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", issues: error.issues });
    }
    logger.error("[Blog] Error creating post:", error);
    return res.status(500).json({
      error: "Failed to create blog post",
      details: error instanceof Error ? error.stack : String(error),
    });
  }
});

// GET /api/admin/blog/posts/:id
router.get("/posts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  try {
    const post = await withTimeout(blogRepository.getBlogPost(id), 5000, "Fetch blog post");
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json(post);
  } catch (error) {
    logger.error("[Blog] Error fetching post:", error);
    return res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// PATCH /api/admin/blog/posts/:id
router.patch("/posts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  try {
    // Only parse the fields that are provided
    const postSchema = insertBlogPostSchema.partial();
    const postData = postSchema.parse(req.body) as Partial<InsertBlogPost>;

    const post = await withTimeout(
      blogRepository.updateBlogPost(id, postData),
      5000,
      "Update blog post",
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", issues: error.issues });
    }
    logger.error("[Blog] Error updating post:", error);
    return res.status(500).json({ error: "Failed to update blog post" });
  }
});

// DELETE /api/admin/blog/posts/:id
router.delete("/posts/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  try {
    const result = await withTimeout(blogRepository.deleteBlogPost(id), 5000, "Delete blog post");
    if (!result) return res.status(404).json({ error: "Post not found" });
    return res.json({ success: true });
  } catch (error) {
    logger.error("[Blog] Error deleting post:", error);
    return res.status(500).json({ error: "Failed to delete blog post" });
  }
});

// POST /api/admin/blog/posts/:id/restore
router.post("/posts/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "post");
  if (id === null) return;
  try {
    const result = await withTimeout(blogRepository.restoreBlogPost(id), 5000, "Restore blog post");
    if (!result) return res.status(404).json({ error: "Post not found" });
    return res.json({ success: true });
  } catch (error) {
    logger.error("[Blog] Error restoring post:", error);
    return res.status(500).json({ error: "Failed to restore blog post" });
  }
});

export default router;
