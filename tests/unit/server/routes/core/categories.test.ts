import { ok } from "neverthrow";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../../../server/lib/errors.js";

vi.mock("../../../../../server/services/category.service.js", () => ({
  categoryService: {
    getCategories: vi.fn(),
    reorderCategories: vi.fn(),
    getCategoryBySlug: vi.fn(),
    getCategoryById: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    restoreCategory: vi.fn(),
    hardDeleteCategory: vi.fn(),
  },
}));

vi.mock("../../../../../server/middleware/rbac.js", () => ({
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: (_req: any, _res: any, next: any) => next(),
  },
}));

import express from "express";
import categoriesRouter from "../../../../../server/routes/core/categories.js";
import { categoryService } from "../../../../../server/services/category.service.js";

const app = express();
app.use(express.json());
app.use("/api", categoriesRouter);
// Basic error handler
app.use((error: any, _req: any, res: any, _next: any) => {
  if (error instanceof AppError) {
    res.status(error.statusCode || 500).json({ error: error.message });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

describe("Core Categories Routes", () => {
  describe("GET /api/categories", () => {
    it("should return a list of categories", async () => {
      const mockCategories = [{ id: 1, name: "Test Category", slug: "test-cat" }];
      vi.mocked(categoryService.getCategories).mockResolvedValue(ok(mockCategories));

      const response = await request(app).get("/api/categories?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(categoryService.getCategories).toHaveBeenCalledWith(1, 10);
    });
  });

  describe("PATCH /api/categories/reorder", () => {
    it("should reorder categories successfully", async () => {
      vi.mocked(categoryService.reorderCategories).mockResolvedValue(ok({ updated: 2 }));

      const response = await request(app)
        .patch("/api/categories/reorder")
        .send({
          categories: [
            { id: 1, sortOrder: 1, parentId: null },
            { id: 2, sortOrder: 2, parentId: null },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Successfully reordered 2 categories",
        updated: 2,
      });
    });

    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .patch("/api/categories/reorder")
        .send([{ invalid: "data" }]);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/categories/by-slug/:slug", () => {
    it("should return category by slug", async () => {
      const mockCategory = { id: 1, name: "Test Category", slug: "test-cat" };
      vi.mocked(categoryService.getCategoryBySlug).mockResolvedValue(ok(mockCategory));

      const response = await request(app).get("/api/categories/by-slug/test-cat");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategory);
      expect(categoryService.getCategoryBySlug).toHaveBeenCalledWith("test-cat");
    });
  });

  describe("GET /api/categories/:id", () => {
    it("should return category by id", async () => {
      const mockCategory = { id: 1, name: "Test Category", slug: "test-cat" };
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(ok(mockCategory));

      const response = await request(app).get("/api/categories/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategory);
      expect(categoryService.getCategoryById).toHaveBeenCalledWith(1);
    });

    it("should return 422 for invalid id format", async () => {
      const response = await request(app).get("/api/categories/abc");
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/categories", () => {
    it("should create a category", async () => {
      const newCat = { id: 1, name: "New Category" };
      vi.mocked(categoryService.createCategory).mockResolvedValue(ok(newCat as any));

      const response = await request(app)
        .post("/api/categories")
        .send({ name: "New Category", slug: "new-cat" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newCat);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should update a category", async () => {
      const updatedCat = { id: 1, name: "Updated Category" };
      vi.mocked(categoryService.updateCategory).mockResolvedValue(ok(updatedCat as any));

      const response = await request(app)
        .put("/api/categories/1")
        .send({ name: "Updated Category" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedCat);
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("should update a category", async () => {
      const updatedCat = { id: 1, name: "Updated Category" };
      vi.mocked(categoryService.updateCategory).mockResolvedValue(ok(updatedCat as any));

      const response = await request(app)
        .patch("/api/categories/1")
        .send({ name: "Updated Category" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedCat);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should soft delete a category", async () => {
      vi.mocked(categoryService.deleteCategory).mockResolvedValue(ok(true as any));

      const response = await request(app).delete("/api/categories/1");

      expect(response.status).toBe(204);
      expect(categoryService.deleteCategory).toHaveBeenCalledWith(1);
    });
  });

  describe("POST /api/categories/:id/restore", () => {
    it("should restore a category", async () => {
      vi.mocked(categoryService.restoreCategory).mockResolvedValue(ok(true));

      const response = await request(app).post("/api/categories/1/restore");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(categoryService.restoreCategory).toHaveBeenCalledWith(1);
    });
  });

  describe("DELETE /api/categories/:id/hard-delete", () => {
    it("should hard delete a category", async () => {
      vi.mocked(categoryService.hardDeleteCategory).mockResolvedValue(ok(true));

      const response = await request(app).delete("/api/categories/1/hard-delete");

      expect(response.status).toBe(204);
      expect(categoryService.hardDeleteCategory).toHaveBeenCalledWith(1);
    });
  });
});
