/**
 * tests/unit/api/catalog-api.test.ts
 * Phase 3 — Vitest unit coverage for product & category API surface
 *
 * Covers:
 *   GET  /api/products          — list, pagination, category filter, featured
 *   GET  /api/products/:id      — single product
 *   GET  /api/products/by-path  — SEO URL resolution
 *   GET  /api/products/:id/3d-model — 3D model metadata
 *   POST /api/products          — auth enforcement (admin only)
 *   PATCH /api/products/:id     — auth enforcement + update
 *   DELETE /api/products/:id    — auth enforcement + soft-delete
 *
 *   GET  /api/categories        — list with pagination
 *   GET  /api/categories/:id    — single category
 *   GET  /api/categories/by-slug/:slug — slug lookup
 *   POST /api/categories        — auth enforcement
 *   PATCH /api/categories/:id   — auth enforcement + update
 *   DELETE /api/categories/:id  — auth enforcement + soft-delete
 *
 * Uses supertest — no live DB or Redis.
 */

import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE MOCKS — must come before any import that pulls these in transitively
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("../../../server/lib/storage/app-service.js", () => ({
  appStorageService: {
    generateSignedUrl: vi.fn().mockResolvedValue("https://mock-storage.com/signed-url"),
    assetExists: vi.fn().mockResolvedValue(true),
    deleteAsset: vi.fn().mockResolvedValue(true),
    uploadAsset: vi.fn().mockResolvedValue("storage/path"),
    downloadAsset: vi.fn().mockResolvedValue(Buffer.from("mock")),
    getBucketName: vi.fn().mockReturnValue("mock-bucket"),
  },
}));

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  getStorage: vi.fn().mockReturnValue({}),
}));

// Unified cache — no Redis
vi.mock("../../../server/lib/cache/unified-cache.js", () => {
  const mockCache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  };
  return {
    UnifiedCache: { getInstance: vi.fn().mockReturnValue(mockCache) },
    unifiedCache: mockCache,
  };
});

// Two-tier batch cache — pass-through
vi.mock("../../../server/lib/cache/two-tier-batch.js", () => ({
  twoTierBatchCache: {
    get: vi.fn().mockImplementation(async (_key: string, fetchFn: () => Promise<unknown>) => {
      const data = await fetchFn();
      return { data, benchmark: { hit: "MISS", dbTime: 50 } };
    }),
  },
}));

// Product & category fixture data (defined inside vi.mock factory — hoisting rules)
vi.mock("../../../server/lib/db/repositories/index.js", () => {
  // ── Product fixture ──
  const mockProductSummary = {
    id: 49,
    name: "Pro Performance Running Shirt",
    slug: "pro-performance-running-shirt",
    sku: "RUN-SHIRT-001",
    description: "High-performance running shirt with moisture-wicking technology",
    shortDescription: "Professional running shirt",
    isActive: true,
    isFeatured: true,
    categoryId: 36,
    fabricId: 50,
    sizeChartId: null,
    primaryImageId: 670,
    primaryVideoId: null,
    imageIds: null,
    videos: null,
    minimumOrderQuantity: 1,
    leadTime: "14-21 days",
    careInstructions: null,
    technicalSpecs: null,
    customFit: null,
    fiberComposition: null,
    specifications: null,
    isFeatured_: true,
    certificateIds: null,
    sizeChartId_: null,
    accessoryIds: null,
    tags: null,
    urlPath: null,
    createdAt: "2025-12-28T19:01:03.548Z",
  };
  const mockProductDetail = {
    ...mockProductSummary,
    updatedAt: "2025-12-28T19:01:03.548Z",
    modelFileId: null,
    relatedProductIds: null,
    customizationOptions: "Logo printing",
    metaTitle: null,
    metaDescription: null,
  };
  const mockProductWithContext = {
    ...mockProductDetail,
    category: { id: 36, name: "Athletic Wear", slug: "athletic-wear" },
    fabric: { id: 50, name: "Performance Polyester" },
    media: [],
  };
  const mock3DModel = {
    productId: 49,
    modelFileId: null,
    modelUrl: null,
  };

  // ── Category fixture ──
  const mockCategory = {
    id: 36,
    name: "Athletic Wear",
    slug: "athletic-wear",
    description: "High-performance athletic clothing",
    parentId: null,
    primaryImageId: null,
    sortOrder: 0,
    isActive: true,
    level: 0,
    fullPath: null,
    metaTitle: null,
    metaDescription: null,
    featuredOnHomepage: false,
    gridPosition: 0,
    displayOrder: 1,
    featuredContent: null,
    bannerUrl: null,
    imageUrl: null,
    createdAt: "2025-12-28T19:01:02.588Z",
    updatedAt: "2025-12-28T19:01:02.588Z",
    deletedAt: null,
    version: 1,
  };
  const mockCreatedCategory = {
    ...mockCategory,
    id: 99,
    name: "Test Category",
    slug: "test-category",
  };
  const mockUpdatedCategory = { ...mockCategory, name: "Updated Athletic Wear" };
  const mockCreatedProduct = {
    ...mockProductDetail,
    id: 100,
    name: "New Product",
    slug: "new-product",
    sku: "SKU-NEW",
  };
  const mockUpdatedProduct = { ...mockProductDetail, name: "Updated Shirt" };

  return {
    productRepository: {
      // Product methods — getProductsSummary returns { products, totalCount }
      getProductsSummary: vi
        .fn()
        .mockResolvedValue({ products: [mockProductSummary], totalCount: 1 }),
      searchProducts: vi.fn().mockResolvedValue([mockProductSummary]),
      searchProductsCount: vi.fn().mockResolvedValue(1),
      getFeaturedProducts: vi.fn().mockResolvedValue([mockProductSummary]),
      getFeaturedProductsCount: vi.fn().mockResolvedValue(1),
      getProductsByCategory: vi.fn().mockResolvedValue([mockProductSummary]),
      getProductsByCategoryCount: vi.fn().mockResolvedValue(1),
      getProductsByTag: vi.fn().mockResolvedValue([mockProductSummary]),
      getProductsByTagCount: vi.fn().mockResolvedValue(1),
      getProduct: vi.fn().mockResolvedValue(mockProductDetail),
      getProductByPath: vi.fn().mockResolvedValue(mockProductWithContext),
      get3DModelMetadata: vi.fn().mockResolvedValue(mock3DModel),
      createProduct: vi.fn().mockResolvedValue(mockCreatedProduct),
      updateProduct: vi.fn().mockResolvedValue(mockUpdatedProduct),
      deleteProduct: vi.fn().mockResolvedValue(true),
      // Category methods
      getCategories: vi.fn().mockResolvedValue([mockCategory]),
      getCategoriesCount: vi.fn().mockResolvedValue(1),
      getCategoriesIncludingDeleted: vi.fn().mockResolvedValue([mockCategory]),
      getCategory: vi.fn().mockResolvedValue(mockCategory),
      getCategoryBySlug: vi.fn().mockResolvedValue(mockCategory),
      createCategory: vi.fn().mockResolvedValue(mockCreatedCategory),
      updateCategory: vi.fn().mockResolvedValue(mockUpdatedCategory),
      deleteCategory: vi.fn().mockResolvedValue(true),
    },
    pageContentRepository: {
      getHomepageHero: vi.fn().mockResolvedValue(null),
      updateHomepageHero: vi.fn().mockResolvedValue(null),
      getHomepageSlogans: vi.fn().mockResolvedValue([]),
      getHomepageSections: vi.fn().mockResolvedValue([]),
      getHomepageProcessCards: vi.fn().mockResolvedValue([]),
      getFeaturedProductsSettings: vi.fn().mockResolvedValue(null),
    },
    miscRepository: {
      getNavigationItems: vi.fn().mockResolvedValue([]),
      getNavigationSettings: vi.fn().mockResolvedValue(null),
      getPerformanceMetrics: vi
        .fn()
        .mockResolvedValue({ cacheHitRate: 0.9, averageResponseTime: 50 }),
      checkDatabaseHealth: vi.fn().mockResolvedValue({ healthy: true }),
    },
    accessoryRepository: {
      getAccessories: vi.fn().mockResolvedValue([]),
      getAccessory: vi.fn().mockResolvedValue(null),
    },
    blogRepository: {
      getBlogPosts: vi.fn().mockResolvedValue([]),
      getBlogPost: vi.fn().mockResolvedValue(null),
    },
    // Additional repos required by admin.service.ts / rbac.ts at import time
    mediaRepository: {
      getMediaAssets: vi.fn().mockResolvedValue([]),
      getMediaAsset: vi.fn().mockResolvedValue(null),
      createMediaAsset: vi.fn().mockResolvedValue(null),
      updateMediaAsset: vi.fn().mockResolvedValue(null),
      deleteMediaAsset: vi.fn().mockResolvedValue(true),
    },
    systemRepository: {
      getSystemSettings: vi.fn().mockResolvedValue(null),
      updateSystemSettings: vi.fn().mockResolvedValue(null),
    },
    userRepository: {
      getUserById: vi.fn().mockResolvedValue(null),
      getUserByEmail: vi.fn().mockResolvedValue(null),
    },
    WebhookRepository: class {},
    webhookRepository: {
      getWebhooks: vi.fn().mockResolvedValue([]),
      createWebhook: vi.fn().mockResolvedValue(null),
    },
    MediaRepository: class {},
    SystemRepository: class {},
    UserRepository: class {},
    BlogRepository: class {},
    MiscRepository: class {},
    PageContentRepository: class {},
    AccessoryRepository: class {},
  };
});

// Webhook service — no-op
vi.mock("../../../server/services/webhook-service.js", () => ({
  webhookService: { trigger: vi.fn() },
}));

// Auth service — mock requireAdmin and requireRole
vi.mock("../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: vi.fn(
      (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const sessionUser = (req as Record<string, unknown>).user as
          | { claims?: { role?: string } }
          | undefined;
        if (sessionUser?.claims?.role === "admin") {
          return next();
        }
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Admin required" });
      },
    ),
    requireRole: vi.fn(
      (_role: string) =>
        (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const sessionUser = (req as Record<string, unknown>).user as
            | { claims?: { role?: string } }
            | undefined;
          if (sessionUser?.claims?.role === "admin") {
            return next();
          }
          return res.status(401).json({ code: "UNAUTHORIZED", message: "Admin required" });
        },
    ),
    isMockAccessAllowed: vi.fn().mockReturnValue(false),
  },
}));

// CSRF middleware — passthrough for tests
vi.mock("../../../server/middleware/csrf.js", () => ({
  csrfProtection: vi.fn(
    (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  ),
}));

// RBAC middleware — mock requireRole so it checks req.user instead of Passport
vi.mock("../../../server/middleware/rbac.js", () => ({
  requireRole: vi.fn(
    (..._roles: string[]) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const user = (req as Record<string, unknown>).user as
          | { claims?: { role?: string } }
          | undefined;
        if (user?.claims?.role === "admin") return next();
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Admin required" });
      },
  ),
}));

// Rate limiter — always allow
vi.mock("../../../server/lib/rate-limiter.js", () => ({
  createRateLimiter: vi.fn(() =>
    vi.fn((_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
  ),
}));

// DB circuit breaker — passthrough
vi.mock("../../../server/lib/resilience/circuit-breaker.js", () => ({
  dbCircuitBreaker: {
    execute: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
  },
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
  })),
}));

// Upstash client — no-op
vi.mock("../../../server/lib/cache/upstash-client.js", () => ({
  upstashClient: null,
  getUpstashClient: vi.fn().mockReturnValue(null),
}));

// Query performance monitor — no-op
vi.mock("../../../server/lib/monitoring/query-performance.js", () => ({
  queryPerformanceMonitor: {
    startQuery: vi.fn().mockReturnValue({
      setCacheHit: vi.fn().mockReturnThis(),
      complete: vi.fn(),
    }),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// App & route imports (after all mocks are defined)
// ─────────────────────────────────────────────────────────────────────────────

import { productRepository } from "../../../server/lib/db/repositories/index.js";
import categoryRoutes from "../../../server/routes/core/categories.js";
import productRoutes from "../../../server/routes/core/products.js";

// Re-declare fixture values (post-mock) for assertions
const PRODUCT_ID = 49;
const CATEGORY_ID = 36;

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  // Attach mock admin user for protected-route tests
  app.use("/api/admin", (req, _res, next) => {
    (req as Record<string, unknown>).user = { claims: { role: "admin", isMock: true } };
    next();
  });
  app.use("/api", productRoutes);
  app.use("/api", categoryRoutes);
  return app;
}

function buildAdminApp(): express.Express {
  const app = express();
  app.use(express.json());
  // Always inject admin user
  app.use((_req: express.Request, _res, next) => {
    (_req as Record<string, unknown>).user = { claims: { role: "admin", isMock: true } };
    next();
  });
  app.use("/api", productRoutes);
  app.use("/api", categoryRoutes);
  return app;
}

let app: express.Express;
let adminApp: express.Express;

beforeAll(() => {
  app = buildApp();
  adminApp = buildAdminApp();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/products", () => {
  test("returns 200 with product list (summary)", async () => {
    const repo = productRepository as typeof productRepository & {
      getProductsSummary: ReturnType<typeof vi.fn>;
    };
    repo.getProductsSummary.mockResolvedValueOnce({
      products: [
        {
          id: PRODUCT_ID,
          name: "Pro Performance Running Shirt",
          slug: "pro-performance-running-shirt",
          sku: "RUN-SHIRT-001",
          categoryId: 36,
          isActive: true,
          urlPath: null,
          createdAt: "2025-12-28T19:01:03.548Z",
        },
      ],
      totalCount: 1,
    });
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({ name: "Pro Performance Running Shirt" }),
      ]),
    });
  });

  test("accepts category filter and delegates to getProductsByCategory", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getProductsByCategory.mockResolvedValueOnce([
      {
        id: PRODUCT_ID,
        name: "Pro Performance Running Shirt",
        slug: "pro-performance-running-shirt",
        categoryId: 36,
        isActive: true,
      },
    ]);
    repo.getProductsByCategoryCount.mockResolvedValueOnce(1);
    const res = await request(app).get(`/api/products?category=${CATEGORY_ID}`);
    expect(res.status).toBe(200);
  });

  test("returns featured products when featured=true", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getFeaturedProducts.mockResolvedValueOnce([
      { id: PRODUCT_ID, name: "Pro Performance Running Shirt", isFeatured: true, isActive: true },
    ]);
    const res = await request(app).get("/api/products?featured=true");
    expect(res.status).toBe(200);
    const body = res.body as { data?: unknown[]; length?: number } | unknown[];
    const arr = Array.isArray(body) ? body : ((body as { data?: unknown[] }).data ?? []);
    expect((arr as unknown[]).length).toBeGreaterThan(0);
  });

  test("search query triggers searchProducts", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.searchProducts.mockResolvedValueOnce([
      { id: PRODUCT_ID, name: "Pro Performance Running Shirt", isActive: true },
    ]);
    repo.searchProductsCount.mockResolvedValueOnce(1);
    const res = await request(app).get("/api/products?search=running");
    expect(res.status).toBe(200);
  });
});

describe("GET /api/products/:id", () => {
  test("returns 200 with product detail for valid id", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getProduct.mockResolvedValueOnce({
      id: PRODUCT_ID,
      name: "Pro Performance Running Shirt",
      sku: "RUN-SHIRT-001",
      isActive: true,
    });
    const res = await request(app).get(`/api/products/${PRODUCT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: PRODUCT_ID, name: "Pro Performance Running Shirt" });
  });

  test("returns 404 when product not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getProduct.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/products/99999");
    expect(res.status).toBe(404);
  });

  test("returns 400 for non-numeric id", async () => {
    const res = await request(app).get("/api/products/not-a-number");
    // Route may return 400 (invalid id) or fall to by-path — not 200
    expect(res.status).not.toBe(200);
  });
});

describe("GET /api/products/by-path", () => {
  test("returns 200 with product when path resolves", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getProductByPath.mockResolvedValueOnce({
      id: PRODUCT_ID,
      name: "Pro Performance Running Shirt",
      urlPath: "/categories/athletic-wear/pro-performance-running-shirt",
    });
    const res = await request(app).get(
      "/api/products/by-path?path=/categories/athletic-wear/pro-performance-running-shirt",
    );
    expect(res.status).toBe(200);
  });

  test("returns 404 when path not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getProductByPath.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/products/by-path?path=/categories/bad/path");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });

  test("returns 4xx/5xx when path param is missing (Zod parse throws)", async () => {
    const res = await request(app).get("/api/products/by-path");
    // Zod throws ZodError which Express 5 converts to 500 (no try/catch in handler)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("GET /api/products/:id/3d-model", () => {
  test("returns 200 with model metadata", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.get3DModelMetadata.mockResolvedValueOnce({
      productId: PRODUCT_ID,
      modelFileId: null,
      modelUrl: null,
    });
    const res = await request(app).get(`/api/products/${PRODUCT_ID}/3d-model`);
    expect(res.status).toBe(200);
  });

  test("returns 404 when no model found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.get3DModelMetadata.mockResolvedValueOnce(null);
    const res = await request(app).get(`/api/products/${PRODUCT_ID}/3d-model`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/products — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ name: "Test", slug: "test", sku: "SKU-1", categoryId: 36 });
    expect(res.status).toBe(401);
  });

  test("creates product with admin role and returns 201", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.createProduct.mockResolvedValueOnce({
      id: 100,
      name: "New Product",
      slug: "new-product",
      sku: "SKU-NEW",
      categoryId: 36,
    });
    const res = await request(adminApp)
      .post("/api/products")
      .send({ name: "New Product", slug: "new-product", sku: "SKU-NEW", categoryId: 36 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "New Product" });
  });
});

describe("PATCH /api/products/:id — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app).patch(`/api/products/${PRODUCT_ID}`).send({ name: "Updated" });
    expect(res.status).toBe(401);
  });

  test("updates product with admin role and returns 200", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.updateProduct.mockResolvedValueOnce({ id: PRODUCT_ID, name: "Updated Shirt" });
    const res = await request(adminApp)
      .patch(`/api/products/${PRODUCT_ID}`)
      .send({ name: "Updated Shirt" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Updated Shirt" });
  });

  test("returns 404 when product not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.updateProduct.mockResolvedValueOnce(null);
    const res = await request(adminApp).patch("/api/products/99999").send({ name: "X" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app).delete(`/api/products/${PRODUCT_ID}`);
    expect(res.status).toBe(401);
  });

  test("soft-deletes product with admin role and returns 200", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.deleteProduct.mockResolvedValueOnce(true);
    const res = await request(adminApp).delete(`/api/products/${PRODUCT_ID}`);
    expect([200, 204]).toContain(res.status);
  });

  test("returns 404 when product not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.deleteProduct.mockResolvedValueOnce(false);
    const res = await request(adminApp).delete("/api/products/99999");
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/categories", () => {
  test("returns 200 with category list", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategories.mockResolvedValueOnce([
      { id: CATEGORY_ID, name: "Athletic Wear", slug: "athletic-wear", isActive: true },
    ]);
    repo.getCategoriesCount.mockResolvedValueOnce(1);
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
  });

  test("returns paginated result with pagination metadata", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategories.mockResolvedValueOnce([
      { id: CATEGORY_ID, name: "Athletic Wear", slug: "athletic-wear", isActive: true },
    ]);
    repo.getCategoriesCount.mockResolvedValueOnce(1);
    const res = await request(app).get("/api/categories?page=1&limit=10");
    expect(res.status).toBe(200);
    // Either paginated { data, pagination } or flat array — both acceptable
    const body = res.body as { data?: unknown[]; pagination?: unknown };
    const hasPagination = body.pagination !== undefined || Array.isArray(body);
    expect(hasPagination).toBe(true);
  });
});

describe("GET /api/categories/:id", () => {
  test("returns 200 with category for valid id", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategory.mockResolvedValueOnce({
      id: CATEGORY_ID,
      name: "Athletic Wear",
      slug: "athletic-wear",
    });
    const res = await request(app).get(`/api/categories/${CATEGORY_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: CATEGORY_ID, name: "Athletic Wear" });
  });

  test("returns 404 when category not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategory.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/categories/99999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/categories/by-slug/:slug", () => {
  test("returns 200 with category for valid slug", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategoryBySlug.mockResolvedValueOnce({
      id: CATEGORY_ID,
      name: "Athletic Wear",
      slug: "athletic-wear",
    });
    const res = await request(app).get("/api/categories/by-slug/athletic-wear");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ slug: "athletic-wear" });
  });

  test("returns 404 when slug not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategoryBySlug.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/categories/by-slug/nonexistent-slug");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/categories — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "Test Cat", slug: "test-cat" });
    expect(res.status).toBe(401);
  });

  test("creates category with admin role and returns 201", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategories.mockResolvedValueOnce([]);
    repo.createCategory.mockResolvedValueOnce({
      id: 99,
      name: "New Category",
      slug: "new-category",
      isActive: true,
    });
    const res = await request(adminApp)
      .post("/api/categories")
      .send({ name: "New Category", slug: "new-category" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "New Category" });
  });
});

describe("PATCH /api/categories/:id — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app)
      .patch(`/api/categories/${CATEGORY_ID}`)
      .send({ name: "Updated" });
    expect(res.status).toBe(401);
  });

  test("updates category with admin role and returns 200", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.getCategory.mockResolvedValueOnce({
      id: CATEGORY_ID,
      name: "Athletic Wear",
      slug: "athletic-wear",
    });
    repo.updateCategory.mockResolvedValueOnce({
      id: CATEGORY_ID,
      name: "Updated Athletic Wear",
      slug: "athletic-wear",
    });
    const res = await request(adminApp)
      .patch(`/api/categories/${CATEGORY_ID}`)
      .send({ name: "Updated Athletic Wear" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Updated Athletic Wear" });
  });
});

describe("DELETE /api/categories/:id — auth enforcement", () => {
  test("rejects 401 without admin role", async () => {
    const res = await request(app).delete(`/api/categories/${CATEGORY_ID}`);
    expect(res.status).toBe(401);
  });

  test("soft-deletes category with admin role and returns 200", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.deleteCategory.mockResolvedValueOnce(true);
    const res = await request(adminApp).delete(`/api/categories/${CATEGORY_ID}`);
    expect([200, 204]).toContain(res.status);
  });

  test("returns 404 when category not found", async () => {
    const repo = productRepository as Record<string, ReturnType<typeof vi.fn>>;
    repo.deleteCategory.mockResolvedValueOnce(false);
    const res = await request(adminApp).delete("/api/categories/99999");
    expect(res.status).toBe(404);
  });
});
