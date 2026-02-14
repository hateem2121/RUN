/**
 * Admin Product Management Integration Tests
 * Verifies Admin CRUD operations, RBAC enforcement, and validation logic.
 */

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupErrorHandling, setupMiddleware } from "../../boot/middleware.js";
import productRouter from "../../routes/core/products.js";
import { authService } from "../../services/auth-service.js";

// Mock Storage singleton using factory for correct hoisting
vi.mock("../../lib/storage-singleton.js", () => {
  const mockStore = {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProduct: vi.fn(),
    getUser: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
  return {
    getStorage: () => mockStore,
  };
});

// Mock UnifiedCache
vi.mock("../../lib/cache/unified-cache.js", () => ({
  UnifiedCache: { getInstance: () => ({ get: vi.fn(), set: vi.fn(), invalidate: vi.fn() }) },
  unifiedCache: { get: vi.fn(), set: vi.fn(), invalidate: vi.fn() },
}));

describe("Admin Product Management Integration Tests", () => {
  let app: express.Express;
  let mockUser: any = null;
  let storage: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser = null;

    const { getStorage } = await import("../../lib/storage-singleton.js");
    storage = getStorage();

    app = express();
    app.use(express.json());

    // Inject mock user and CSRF bypass
    app.use((req, _res, next) => {
      (req as any)._skipCsrf = true;
      if (mockUser) {
        (req as any).user = mockUser;
      }
      (req as any).isAuthenticated = () => !!(req as any).user;
      next();
    });

    // Mock authService.setup to skip real init
    vi.spyOn(authService, "setup").mockResolvedValue(undefined);

    // Mock verifyAdminAccess which is used by requireRole middleware
    vi.spyOn(authService, "verifyAdminAccess").mockImplementation(async (user: any) => {
      return !!user?.isAdmin;
    });

    await setupMiddleware(app);
    const apiRouter = express.Router();
    apiRouter.use(productRouter);
    app.use("/api", apiRouter);
    setupErrorHandling(app);
  });

  describe("POST /api/products", () => {
    it("should block non-admins from creating products", async () => {
      mockUser = { id: "user-1", isAdmin: false, claims: { sub: "user-1" } };
      const response = await request(app).post("/api/products").send({ name: "New Product" });
      expect(response.status).toBe(403);
    });

    it("should allow admins to create products with valid data", async () => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
      const productData = {
        name: "Eco T-Shirt",
        slug: "eco-t-shirt",
        sku: "ECO-TSHIRT-001",
        description: "Sustainable bamboo fabric",
        categoryId: 1,
        isActive: true,
      };
      storage.createProduct.mockResolvedValue({ id: 101, ...productData });

      const response = await request(app).post("/api/products").send(productData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(101);
      expect(storage.createProduct).toHaveBeenCalled();
    });

    it("should return 400 for invalid product data", async () => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
      const response = await request(app).post("/api/products").send({ name: "" }); // Missing required fields
      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should allow admins to update products", async () => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
      storage.updateProduct.mockResolvedValue({ id: 1, name: "Updated Name" });

      const response = await request(app).put("/api/products/1").send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
      expect(storage.updateProduct).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should allow admins to delete products", async () => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
      storage.deleteProduct.mockResolvedValue(true);

      const response = await request(app).delete("/api/products/1");

      expect(response.status).toBe(204);
      expect(storage.deleteProduct).toHaveBeenCalledWith(1);
    });

    it("should return 404 for deleting non-existent product", async () => {
      mockUser = { id: "admin-1", isAdmin: true, claims: { sub: "admin-1" } };
      storage.deleteProduct.mockResolvedValue(false);

      const response = await request(app).delete("/api/products/999");

      expect(response.status).toBe(404);
    });
  });
});
