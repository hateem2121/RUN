import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import blogRouter from "../../../../../server/routes/admin/blog.routes";
import { blogService } from "../../../../../server/services/blog.service";

// Mock dependencies
vi.mock("zod-express-middleware", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../../server/services/auth-service", () => ({
  authService: {
    requireAdmin: (_req: any, _res: any, next: any) => next(),
  },
}));

vi.mock("../../../../../server/services/blog.service", () => ({
  blogService: {
    getBlogCategories: vi.fn(),
    createBlogCategory: vi.fn(),
    updateBlogCategory: vi.fn(),
    deleteBlogCategory: vi.fn(),
    getBlogPosts: vi.fn(),
    createBlogPost: vi.fn(),
    getBlogPostById: vi.fn(),
    updateBlogPost: vi.fn(),
    deleteBlogPost: vi.fn(),
    restoreBlogPost: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/", blogRouter);

describe("Admin Blog Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /categories", () => {
    it("should return categories on success", async () => {
      vi.mocked(blogService.getBlogCategories).mockResolvedValue(
        ok([{ id: 1, name: "Tech" }]) as any,
      );
      const res = await request(app).get("/categories");
      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe("Tech");
    });

    it("should return 500 on error", async () => {
      vi.mocked(blogService.getBlogCategories).mockResolvedValue(err(new Error("Failed")) as any);
      const res = await request(app).get("/categories");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /categories", () => {
    it("should return 201 on success", async () => {
      vi.mocked(blogService.createBlogCategory).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).post("/categories").send({ name: "Tech" });
      expect(res.status).toBe(201);
    });

    it("should return error status on failure", async () => {
      vi.mocked(blogService.createBlogCategory).mockResolvedValue(
        err({ statusCode: 400, message: "Bad req" } as any) as any,
      );
      const res = await request(app).post("/categories").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /categories/:id", () => {
    it("should return updated category on success", async () => {
      vi.mocked(blogService.updateBlogCategory).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).patch("/categories/1").send({ name: "Tech" });
      expect(res.status).toBe(200);
    });

    it("should return 422 for invalid id", async () => {
      const res = await request(app).patch("/categories/abc").send({});
      expect(res.status).toBe(422); // from validateIdParam
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should return success true", async () => {
      vi.mocked(blogService.deleteBlogCategory).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/categories/1");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /posts", () => {
    it("should return posts on success", async () => {
      vi.mocked(blogService.getBlogPosts).mockResolvedValue(ok({ data: [], total: 0 }) as any);
      const res = await request(app).get("/posts?page=1&limit=10");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /posts", () => {
    it("should return 201 on success", async () => {
      vi.mocked(blogService.createBlogPost).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).post("/posts").send({ title: "Hello" });
      expect(res.status).toBe(201);
    });
  });

  describe("GET /posts/:id", () => {
    it("should return post on success", async () => {
      vi.mocked(blogService.getBlogPostById).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).get("/posts/1");
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /posts/:id", () => {
    it("should return updated post on success", async () => {
      vi.mocked(blogService.updateBlogPost).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).patch("/posts/1").send({ title: "New" });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /posts/:id", () => {
    it("should return success true", async () => {
      vi.mocked(blogService.deleteBlogPost).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/posts/1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /posts/:id/restore", () => {
    it("should return success true on restore", async () => {
      vi.mocked(blogService.restoreBlogPost).mockResolvedValue(ok(true) as any);
      const res = await request(app).post("/posts/1/restore");
      expect(res.status).toBe(200);
    });
  });
});
