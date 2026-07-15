import { err, ok } from "neverthrow";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppError, NotFoundError } from "../../../../../server/lib/errors.js";

vi.mock("../../../../../server/services/blog.service.js", () => ({
  blogService: {
    getBlogPosts: vi.fn(),
    getBlogPostBySlug: vi.fn(),
  },
}));

vi.mock("../../../../../server/middleware/rbac.js", () => ({
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

import express from "express";
import blogRouter from "../../../../../server/routes/core/blog.js";
import { blogService } from "../../../../../server/services/blog.service.js";

const app = express();
app.use(express.json());
app.use("/api", blogRouter);
// Basic error handler to catch thrown errors in routes
app.use((error: any, _req: any, res: any, _next: any) => {
  if (error instanceof AppError) {
    res.status(error.statusCode || 500).json({ error: error.message });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

describe("Core Blog Routes", () => {
  describe("GET /api/blog", () => {
    it("should return a list of blog posts", async () => {
      const mockPosts = {
        posts: [{ id: 1, title: "Test Post", slug: "test-post" }],
      };
      vi.mocked(blogService.getBlogPosts).mockResolvedValue(ok(mockPosts));

      const response = await request(app).get("/api/blog?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPosts.posts);
      expect(response.headers["cache-control"]).toBe(
        "public, max-age=60, stale-while-revalidate=300",
      );
      expect(blogService.getBlogPosts).toHaveBeenCalledWith(1, 10, { status: "published" });
    });

    it("should propagate errors from the service", async () => {
      vi.mocked(blogService.getBlogPosts).mockResolvedValue(err(new AppError("Database Error")));

      const response = await request(app).get("/api/blog");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Database Error");
    });
  });

  describe("GET /api/blog/:slug", () => {
    it("should return a blog post by slug", async () => {
      const mockPost = { id: 1, title: "Test Post", slug: "test-post" };
      vi.mocked(blogService.getBlogPostBySlug).mockResolvedValue(ok(mockPost));

      const response = await request(app).get("/api/blog/test-post");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPost);
      expect(response.headers["cache-control"]).toBe("public, max-age=3600");
      expect(blogService.getBlogPostBySlug).toHaveBeenCalledWith("test-post");
    });

    it("should propagate errors from the service", async () => {
      vi.mocked(blogService.getBlogPostBySlug).mockResolvedValue(
        err(new NotFoundError("Post not found")),
      );

      const response = await request(app).get("/api/blog/non-existent-post");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Post not found not found");
    });
  });
});
