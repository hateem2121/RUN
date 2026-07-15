import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import categoriesRouter from "../../../../../server/routes/admin/categories.routes";
import { adminService } from "../../../../../server/services/admin/index";
import { categoryService } from "../../../../../server/services/category.service";

vi.mock("zod-express-middleware", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../../server/services/auth-service", () => ({
  authService: {
    requireAdmin: (_req: any, _res: any, next: any) => next(),
  },
}));

vi.mock("../../../../../server/middleware/request-context", () => ({
  getAuditContext: vi.fn().mockReturnValue({ userId: "admin" }),
}));

vi.mock("../../../../../server/services/category.service", () => ({
  categoryService: {
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/admin/index", () => ({
  adminService: {
    restoreCategory: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/", categoriesRouter);

describe("Admin Categories Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return categories on success", async () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue(ok({ data: [], total: 0 }) as any);
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });

    it("should return 500 on failure", async () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue(err(new Error("DB Fail")) as any);
      const res = await request(app).get("/");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /:id", () => {
    it("should return category on success", async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(
        ok({ id: 1, name: "C1" }) as any,
      );
      const res = await request(app).get("/1");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("C1");
    });

    it("should return 422 for invalid id", async () => {
      const res = await request(app).get("/abc");
      expect(res.status).toBe(422);
    });
  });

  describe("POST /", () => {
    it("should return 201 on success", async () => {
      vi.mocked(categoryService.createCategory).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).post("/").send({ name: "Tech" });
      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id", () => {
    it("should return updated category on success", async () => {
      vi.mocked(categoryService.updateCategory).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).patch("/1").send({ name: "Tech" });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id", () => {
    it("should return success on delete", async () => {
      vi.mocked(categoryService.deleteCategory).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/restore", () => {
    it("should return success on restore", async () => {
      vi.mocked(adminService.restoreCategory).mockResolvedValue(ok(true) as any);
      const res = await request(app).post("/1/restore");
      expect(res.status).toBe(200);
    });
  });
});
