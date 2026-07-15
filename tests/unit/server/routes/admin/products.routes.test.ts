import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import productsRouter from "../../../../../server/routes/admin/products.routes";
import { adminService } from "../../../../../server/services/admin/index";

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

vi.mock("../../../../../server/services/admin/index", () => ({
  adminService: {
    getInitialProductsData: vi.fn(),
    getProductsList: vi.fn(),
    createProduct: vi.fn(),
    checkSlugAvailability: vi.fn(),
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    restoreProduct: vi.fn(),
    softDeleteProduct: vi.fn(),
    hardDeleteProduct: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/", productsRouter);

describe("Admin Products Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /initial-data", () => {
    it("should return initial data on success", async () => {
      vi.mocked(adminService.getInitialProductsData).mockResolvedValue(
        ok({ categories: [] }) as any,
      );
      const res = await request(app).get("/initial-data");
      expect(res.status).toBe(200);
    });

    it("should return error if it fails", async () => {
      vi.mocked(adminService.getInitialProductsData).mockResolvedValue(
        err({ statusCode: 500, message: "DB fail" }) as any,
      );
      const res = await request(app).get("/initial-data");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /", () => {
    it("should return products on success", async () => {
      vi.mocked(adminService.getProductsList).mockResolvedValue(ok({ data: [], total: 0 }) as any);
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /", () => {
    it("should return 201 on success", async () => {
      vi.mocked(adminService.createProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).post("/").send({ name: "Product" });
      expect(res.status).toBe(201);
    });
  });

  describe("GET /check-slug", () => {
    it("should return availability on success", async () => {
      vi.mocked(adminService.checkSlugAvailability).mockResolvedValue(
        ok({ available: true }) as any,
      );
      const res = await request(app).get("/check-slug?slug=test");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("should return product on success", async () => {
      vi.mocked(adminService.getProductById).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).get("/1");
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /:id", () => {
    it("should return updated product on success", async () => {
      vi.mocked(adminService.updateProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).patch("/1").send({ name: "P" });
      expect(res.status).toBe(200);
    });
  });

  describe("PUT /:id", () => {
    it("should return updated product on success", async () => {
      vi.mocked(adminService.updateProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).put("/1").send({ name: "P" });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/restore", () => {
    it("should return success on restore", async () => {
      vi.mocked(adminService.restoreProduct).mockResolvedValue(ok(true) as any);
      const res = await request(app).post("/1/restore");
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id", () => {
    it("should return success on soft delete", async () => {
      vi.mocked(adminService.softDeleteProduct).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/1");
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id/hard", () => {
    it("should return success on hard delete", async () => {
      vi.mocked(adminService.hardDeleteProduct).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/1/hard").send({ confirm: "product-slug" });
      expect(res.status).toBe(200);
    });
  });
});
