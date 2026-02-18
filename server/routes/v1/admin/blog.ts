import { Router } from "express";
import { blogService } from "../../../services/admin/blog.service.js";
import type { SessionUser } from "../../../types/session.js";
import { getAuditContext } from "../../../utils/request-context.js";

const router = Router();

// Helper for audit context - MOVED TO SHARED UTILS

// GET /api/admin/blog/posts
router.get("/posts", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as string;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const search = req.query.search as string;

  const result = await blogService.getPosts(limit, offset, {
    ...(status && { status }),
    ...(categoryId !== undefined && { categoryId }),
    ...(search && { search }),
  });

  return res.json(result);
});

// GET /api/admin/blog/posts/:id
router.get("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const post = await blogService.getPost(id);
  return res.json(post);
});

// POST /api/admin/blog/posts
router.post("/posts", async (req, res) => {
  const audit = getAuditContext(req);
  if (!audit.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const post = await blogService.createPost(audit, req.body);
  return res.status(201).json(post);
});

// PATCH /api/admin/blog/posts/:id
router.patch("/posts/:id", async (req, res) => {
  const audit = getAuditContext(req);
  const id = parseInt(req.params.id);

  if (!audit.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const post = await blogService.updatePost(audit, id, req.body);
  return res.json(post);
});

// DELETE /api/admin/blog/posts/:id
router.delete("/posts/:id", async (req, res) => {
  const audit = getAuditContext(req);
  const id = parseInt(req.params.id);

  if (!audit.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const success = await blogService.deletePost(audit, id);
  return res.json({ success });
});

// GET /api/admin/blog/categories
router.get("/categories", async (req, res) => {
  const categories = await blogService.getCategories();
  return res.json(categories);
});

// POST /api/admin/blog/categories
router.post("/categories", async (req, res) => {
  const audit = getAuditContext(req);
  if (!audit.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const category = await blogService.createCategory(audit, req.body);
  return res.status(201).json(category);
});

export default router;
