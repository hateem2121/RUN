import { Router } from "express";
import { ValidationError } from "../../lib/errors.js";
import { blogService } from "../../services/blog.service.js";

const router = Router();

// GET /api/blog - List active published blog posts
router.get("/blog", async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const categoryId = req.query.categoryId
    ? parseInt(req.query.categoryId as string, 10)
    : undefined;
  const search = req.query.search as string | undefined;

  // Accept status published if filter requests it
  const status = req.query.published === "true" ? "published" : undefined;

  const filter: {
    status?: string;
    categoryId?: number;
    authorId?: string;
    search?: string;
    includeDeleted?: boolean;
  } = {
    status: status || "published",
  };
  if (categoryId !== undefined) {
    filter.categoryId = categoryId;
  }
  if (search !== undefined) {
    filter.search = search;
  }

  const result = await blogService.getBlogPosts(page, limit, filter);

  result.match(
    (data) => {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      return res.json(data.posts);
    },
    (error) => {
      throw error;
    },
  );
});

// GET /api/blog/:slug - Get blog post by slug
router.get("/blog/:slug", async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    throw new ValidationError("Slug is required");
  }

  const result = await blogService.getBlogPostBySlug(slug);

  result.match(
    (post) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(post);
    },
    (error) => {
      throw error;
    },
  );
});

export default router;
