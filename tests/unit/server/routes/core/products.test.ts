import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import productsRouter from "../../../../../server/routes/core/products";
import { productService } from "../../../../../server/services/product.service";
import { webhookService } from "../../../../../server/services/webhook-service";

vi.mock("zod-express-middleware", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../../server/middleware/rbac", () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../../server/middleware/rateLimiter", () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../../../../server/services/product.service", () => ({
  productService: {
    listProducts: vi.fn(),
    getProductByPath: vi.fn(),
    get3DModelMetadata: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/webhook-service", () => ({
  webhookService: {
    trigger: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/", productsRouter);

// Express 5 error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.name === "NotFoundError") {
    res.status(404).json({ error: "Not found" });
  } else {
    res.status(500).json({ error: err.message });
  }
});

describe("Core Products Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /products", () => {
    it("should return products on success", async () => {
      vi.mocked(productService.listProducts).mockResolvedValue(
        ok({ data: [], pagination: {} }) as any,
      );
      const res = await request(app).get("/products");
      expect(res.status).toBe(200);
    });

    it("should throw on service error", async () => {
      vi.mocked(productService.listProducts).mockResolvedValue(err(new Error("DB Failed")) as any);
      const res = await request(app).get("/products");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /products/by-path", () => {
    it("should return product on success", async () => {
      vi.mocked(productService.getProductByPath).mockResolvedValue(
        ok({ product: { name: "P" } }) as any,
      );
      const res = await request(app).get("/products/by-path?path=/test");
      expect(res.status).toBe(200);
    });

    it("should throw NotFoundError on missing product", async () => {
      const error = new Error("Missing");
      error.name = "NotFoundError";
      vi.mocked(productService.getProductByPath).mockResolvedValue(err(error) as any);
      const res = await request(app).get("/products/by-path?path=/test");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /products/:id/3d-model", () => {
    it("should return 3d model metadata on success", async () => {
      vi.mocked(productService.get3DModelMetadata).mockResolvedValue(
        ok({ url: "model.glb" }) as any,
      );
      const res = await request(app).get("/products/1/3d-model");
      expect(res.status).toBe(200);
    });

    it("should return 422 for invalid id", async () => {
      const res = await request(app).get("/products/abc/3d-model");
      expect(res.status).toBe(422);
    });
  });

  describe("GET /products/:id", () => {
    it("should return product on success", async () => {
      vi.mocked(productService.getProductById).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).get("/products/1");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /products", () => {
    it("should return 201 on success and trigger webhook", async () => {
      vi.mocked(productService.createProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).post("/products").send({ name: "Product" });
      expect(res.status).toBe(201);
      expect(webhookService.trigger).toHaveBeenCalledWith("product.created", { id: 1 });
    });
  });

  describe("PUT /products/:id", () => {
    it("should return 200 on success and trigger webhook", async () => {
      vi.mocked(productService.updateProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).put("/products/1").send({ name: "P" });
      expect(res.status).toBe(200);
      expect(webhookService.trigger).toHaveBeenCalledWith("product.updated", { id: 1 });
    });
  });

  describe("PATCH /products/:id", () => {
    it("should return 200 on success", async () => {
      vi.mocked(productService.updateProduct).mockResolvedValue(ok({ id: 1 }) as any);
      const res = await request(app).patch("/products/1").send({ name: "P" });
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /products/:id", () => {
    it("should return 204 on success and trigger webhook", async () => {
      vi.mocked(productService.deleteProduct).mockResolvedValue(ok(true) as any);
      const res = await request(app).delete("/products/1");
      expect(res.status).toBe(204);
      expect(webhookService.trigger).toHaveBeenCalledWith("product.deleted", { id: 1 });
    });
  });
});
