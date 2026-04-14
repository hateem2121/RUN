/**
 * Product Integration Flow Tests
 * Verifies public product browsing, category filtering, search, and pagination.
 */

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupErrorHandling, setupMiddleware } from "../../boot/middleware.js";
import productRouter from "../../routes/core/products.js";

// Mock Storage singleton using factory for correct hoisting
vi.mock("../../lib/storage-singleton.js", () => {
  const mockStorage = {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getProductBySlug: vi.fn(),
    getProductByPath: vi.fn(),
    getCategories: vi.fn(),
    getFeaturedProducts: vi.fn(),
    getFeaturedProductsCount: vi.fn(),
    getProductsCount: vi.fn(),
    getProductsSummary: vi.fn(),
    getProductsByCategory: vi.fn(),
    getProductsByCategoryCount: vi.fn(),
    getProductsByTag: vi.fn(),
    getProductsByTagCount: vi.fn(),
    searchProducts: vi.fn(),
    searchProductsCount: vi.fn(),
    get3DModelMetadata: vi.fn(),
    getUser: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
  return {
    getStorage: () => mockStorage,
    StorageSingleton: {
      hasInstance: () => true,
      getInstance: () => mockStorage,
    },
  };
});

// Mock UnifiedCache
vi.mock("../../lib/cache/unified-cache.js", () => {
  const mockCache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
    getStats: vi.fn().mockReturnValue({}),
  };
  return {
    UnifiedCache: {
      getInstance: () => mockCache,
      TTL_PRESETS: {
        SHORT: 300,
        MEDIUM: 1800,
        LONG: 3600,
        MEDIA: 21600,
        STATIC: 86400,
      },
    },
    unifiedCache: mockCache,
  };
});

describe("Product Integration Tests", () => {
  let app: express.Express;
  let storage: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get storage mock instance
    const { getStorage } = await import("../../lib/storage-singleton.js");
    storage = getStorage();

    app = express();
    app.use(express.json());

    // Inject test flags
    app.use((req, _res, next) => {
      (req as unknown as { _skipCsrf?: boolean })._skipCsrf = true;
      next();
    });

    const { authService } = await import("../../services/auth-service.js");
    vi.spyOn(authService, "setup").mockResolvedValue(undefined);

    await setupMiddleware(app);

    // Register product routes
    const apiRouter = express.Router();
    apiRouter.use(productRouter);
    app.use("/api", apiRouter);

    setupErrorHandling(app);
  });

  describe("GET /api/products", () => {
    it("should return paginated list of products", async () => {
      const mockResult = {
        products: [
          { id: 1, name: "Product 1", slug: "product-1", price: "29.99" },
          { id: 2, name: "Product 2", slug: "product-2", price: "39.99" },
        ],
        totalCount: 2,
      };

      storage.getProductsSummary.mockResolvedValue(mockResult);

      const response = await request(app).get("/api/products?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it("should filter products by category", async () => {
      storage.getProductsByCategory.mockResolvedValue([]);
      storage.getProductsByCategoryCount.mockResolvedValue(0);

      const response = await request(app).get("/api/products?category=1");

      expect(response.status).toBe(200);
      expect(storage.getProductsByCategory).toHaveBeenCalledWith(1, 20, 0);
    });

    it("should search products", async () => {
      storage.searchProducts.mockResolvedValue([]);
      storage.searchProductsCount.mockResolvedValue(0);

      const response = await request(app).get("/api/products?search=shirt");

      expect(response.status).toBe(200);
      expect(storage.searchProducts).toHaveBeenCalledWith("shirt", {}, 20, 0);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return 404 if product not found", async () => {
      storage.getProduct.mockResolvedValue(null);

      const response = await request(app).get("/api/products/999");

      expect(response.status).toBe(404);
    });

    it("should return product details by integer ID", async () => {
      const mockProduct = {
        id: 1,
        name: "Test Product",
        slug: "test-product",
        description: "A great product",
        price: "49.99",
      };
      storage.getProduct.mockResolvedValue(mockProduct);

      const response = await request(app).get("/api/products/1");

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Test Product");
    });
  });

  describe("GET /api/products/by-path", () => {
    it("should return product details by path", async () => {
      const mockResult = {
        product: { id: 1, name: "Path Product", slug: "path-product" },
        category: { name: "Test Category" },
      };
      storage.getProductByPath.mockResolvedValue(mockResult);

      const response = await request(app).get("/api/products/by-path?path=test/path");

      expect(response.status).toBe(200);
      expect(response.body.product.name).toBe("Path Product");
    });
  });
});
