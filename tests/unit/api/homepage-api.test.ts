/**
 * HOMEPAGE API UNIT TESTS
 * RUN APPAREL (PVT) LTD — B2B Sportswear Manufacturing Platform
 *
 * Covers the homepage CMS API surface:
 *   GET  /api/homepage-hero
 *   PATCH /api/homepage-hero  (admin-only)
 *   GET  /api/homepage-slogans
 *   GET  /api/homepage-sections
 *   GET  /api/homepage-batch
 *   GET  /api/homepage-process-cards
 *   GET  /api/homepage-featured-products-settings
 *
 * Uses supertest + vi.mock so no live DB or cache is required.
 */

import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// MODULE MOCKS (must come before imports that pull these in transitively)
// ──────────────────────────────────────────────────────────────────────────────

vi.mock("../../../server/lib/storage/app-service.js", () => ({
  appStorageService: {
    generateSignedUrl: vi.fn().mockResolvedValue("https://mock-storage.com/signed-url"),
    assetExists: vi.fn().mockResolvedValue(true),
    deleteAsset: vi.fn().mockResolvedValue(true),
    uploadAsset: vi.fn().mockResolvedValue("storage/path"),
    downloadAsset: vi.fn().mockResolvedValue(Buffer.from("mock-content")),
    getBucketName: vi.fn().mockReturnValue("mock-bucket"),
  },
}));

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  getStorage: vi.fn().mockReturnValue({
    getCategories: vi.fn().mockResolvedValue([]),
    getCategoriesCount: vi.fn().mockResolvedValue(0),
    getProductsSummary: vi.fn().mockResolvedValue({ products: [], totalCount: 0 }),
    getProductByPath: vi.fn().mockResolvedValue(null),
    getProduct: vi.fn().mockResolvedValue(null),
    updateProduct: vi.fn().mockResolvedValue(null),
    deleteProduct: vi.fn().mockResolvedValue(true),
    createProduct: vi.fn().mockResolvedValue({ id: 1 }),
    searchProducts: vi.fn().mockResolvedValue([]),
    searchProductsCount: vi.fn().mockResolvedValue(0),
    getProductsByCategory: vi.fn().mockResolvedValue([]),
    getProductsByCategoryCount: vi.fn().mockResolvedValue(0),
    getFeaturedProducts: vi.fn().mockResolvedValue([]),
    get3DModelMetadata: vi.fn().mockResolvedValue(null),
    getMediaAssets: vi.fn().mockResolvedValue([]),
    getMediaAssetsWithCount: vi.fn().mockResolvedValue({ assets: [], total: 0 }),
    getMediaAsset: vi.fn().mockResolvedValue(null),
    getMediaAssetsCount: vi.fn().mockResolvedValue(0),
    deleteMediaAsset: vi.fn().mockResolvedValue(true),
    updateMediaAsset: vi.fn().mockResolvedValue(null),
    getHomepageHero: vi.fn().mockResolvedValue({
      id: 1,
      title: "Next-Generation Sportswear Manufacturing",
      subtitle: "Engineering high-performance athletic apparel",
      backgroundImageId: null,
      ctaText: "EXPLORE OUR CAPABILITIES",
      ctaLink: "/manufacturing",
      isActive: true,
      sortOrder: 0,
    }),
    getHomepageSections: vi
      .fn()
      .mockResolvedValue([{ id: 1, name: "intro", title: "Our Story", mediaIds: [] }]),
    getPerformanceMetrics: vi
      .fn()
      .mockResolvedValue({ cacheHitRate: 0.9, averageResponseTime: 50 }),
    checkDatabaseHealth: vi.fn().mockResolvedValue({ healthy: true }),
  }),
}));

// Mock the unified cache so no Redis connection is attempted
vi.mock("../../../server/lib/cache/unified-cache.js", () => {
  const mockCache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
    invalidateAll: vi.fn().mockResolvedValue(undefined),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn().mockReturnValue(mockCache),
    },
    unifiedCache: mockCache,
  };
});

// Mock cache strategies
vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheKeys: {
    homepage: {
      hero: () => "homepage:hero",
      slogans: () => "homepage:slogans",
      sections: () => "homepage:sections",
      processCards: () => "homepage:processCards",
      featuredProducts: () => "homepage:featuredProducts",
      batch: () => "homepage:batch",
      sustainability: () => "homepage:sustainability",
    },
    media: { list: () => "media:list" },
    products: { list: () => "products:list", featured: () => "products:featured" },
    categories: { list: () => "categories:list" },
  },
  CacheOperations: {
    invalidateHomepage: vi.fn().mockResolvedValue(undefined),
    invalidateManufacturing: vi.fn().mockResolvedValue(undefined),
  },
  shouldBypassCache: vi.fn().mockReturnValue(false),
}));

// Mock two-tier batch cache — returns data directly without Redis
vi.mock("../../../server/lib/cache/two-tier-batch.js", () => ({
  twoTierBatchCache: {
    get: vi.fn().mockImplementation(async (_key: string, fetchFn: () => Promise<unknown>) => {
      const data = await fetchFn();
      return {
        data,
        benchmark: {
          hit: "MISS",
          l1Time: null,
          l2Time: null,
          dbTime: 50,
        },
      };
    }),
    invalidate: vi.fn().mockResolvedValue(undefined),
    getMetrics: vi.fn().mockReturnValue({
      hitRate: 85,
      l1HitRate: 70,
      l2HitRate: 15,
      missRate: 15,
      avgL1Time: 2,
      avgL2Time: 12,
      avgDbTime: 80,
      totalRequests: 100,
    }),
  },
}));

// Mock pageContentRepository (used by homepage routes directly)
// NOTE: all data is defined INSIDE the vi.mock factory to avoid the hoisting
// "Cannot access before initialization" error — vi.mock is hoisted to the top.
vi.mock("../../../server/lib/db/repositories/index.js", () => {
  const hero = {
    id: 1,
    title: "Next-Generation Sportswear Manufacturing",
    subtitle: "Engineering high-performance athletic apparel",
    backgroundImageId: null,
    ctaText: "EXPLORE OUR CAPABILITIES",
    ctaLink: "/manufacturing",
    isActive: true,
    sortOrder: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };
  const slogans = [
    {
      id: 1,
      text: "Crafting Excellence in Every Thread",
      position: 1,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 2,
      text: "Where Innovation Meets Athletic Performance",
      position: 2,
      isActive: true,
      sortOrder: 2,
    },
  ];
  const sections = [
    {
      id: 1,
      name: "intro",
      title: "Our Story",
      heroTitle: null,
      content: "Our story...",
      sectionType: "text",
      mediaIds: [],
      isActive: true,
      sortOrder: 1,
    },
  ];
  const processCards = [
    {
      id: 1,
      title: "Inquiry & R&D",
      description: "Material sourcing",
      step: "01",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 2,
      title: "Prototyping",
      description: "Rapid sampling",
      step: "02",
      sortOrder: 2,
      isActive: true,
    },
  ];
  const featuredSettings = {
    id: 1,
    title: "Featured Products",
    maxProducts: 8,
    autoSelect: true,
    isActive: true,
    isEnabled: true,
  };

  return {
    homepageRepository: {
      getHomepageHero: vi.fn().mockResolvedValue(hero),
      updateHomepageHero: vi.fn().mockImplementation(async (data: Record<string, unknown>) => ({
        ...hero,
        ...data,
        updatedAt: new Date(),
      })),
      getHomepageSlogans: vi.fn().mockResolvedValue(slogans),
      getHomepageSlogan: vi
        .fn()
        .mockImplementation(async (id: number) => slogans.find((s) => s.id === id) ?? undefined),
      updateHomepageSlogan: vi
        .fn()
        .mockImplementation(async (_id: number, data: Record<string, unknown>) => ({
          ...slogans[0],
          ...data,
        })),
      createHomepageSlogan: vi.fn().mockResolvedValue({ id: 99, ...slogans[0] }),
      deleteHomepageSlogan: vi.fn().mockResolvedValue(true),
      reorderHomepageSlogans: vi.fn().mockResolvedValue(slogans),
      getHomepageSections: vi.fn().mockResolvedValue(sections),
      getHomepageSection: vi.fn().mockResolvedValue(sections[0]),
      updateHomepageSection: vi
        .fn()
        .mockImplementation(async (_name: string, data: Record<string, unknown>) => ({
          ...sections[0],
          ...data,
        })),
      getHomepageProcessCards: vi.fn().mockResolvedValue(processCards),
      getHomepageProcessCard: vi
        .fn()
        .mockImplementation(
          async (id: number) => processCards.find((c) => c.id === id) ?? undefined,
        ),
      updateHomepageProcessCard: vi
        .fn()
        .mockImplementation(async (_id: number, data: Record<string, unknown>) => ({
          ...processCards[0],
          ...data,
        })),
      createHomepageProcessCard: vi.fn().mockResolvedValue({ id: 99, ...processCards[0] }),
      deleteHomepageProcessCard: vi.fn().mockResolvedValue(true),
      reorderHomepageProcessCards: vi.fn().mockResolvedValue(processCards),
      getHomepageFeaturedProductsSettings: vi.fn().mockResolvedValue(featuredSettings),
      updateHomepageFeaturedProductsSettings: vi
        .fn()
        .mockImplementation(async (data: Record<string, unknown>) => ({
          ...featuredSettings,
          ...data,
        })),
      getHomepageSectionById: vi.fn().mockResolvedValue(sections[0]),
      updateHomepageSectionById: vi
        .fn()
        .mockImplementation(async (_id: number, data: Record<string, unknown>) => ({
          ...sections[0],
          ...data,
        })),
      createHomepageSection: vi.fn().mockResolvedValue({ id: 99, ...sections[0] }),
      deleteHomepageSection: vi.fn().mockResolvedValue(true),
    },
    productRepository: {
      getProducts: vi.fn().mockResolvedValue([]),
      getCategories: vi.fn().mockResolvedValue([]),
    },
    mediaRepository: {
      getMediaAssets: vi.fn().mockResolvedValue([]),
    },
    userRepository: {
      getUser: vi.fn().mockResolvedValue(null),
      getUserByEmail: vi.fn().mockResolvedValue(null),
    },
    systemRepository: {
      logAudit: vi.fn().mockResolvedValue(undefined),
    },
    miscRepository: {
      getFibers: vi.fn().mockResolvedValue([]),
      getFabrics: vi.fn().mockResolvedValue([]),
      getCertificates: vi.fn().mockResolvedValue([]),
      getSizeCharts: vi.fn().mockResolvedValue([]),
      getAccessories: vi.fn().mockResolvedValue([]),
    },
    accessoryRepository: {
      getAccessories: vi.fn().mockResolvedValue([]),
    },
    blogRepository: {
      getPosts: vi.fn().mockResolvedValue([]),
    },
    webhookRepository: {
      getLogs: vi.fn().mockResolvedValue([]),
    },
  };
});

// Re-export mock data for use in tests (defined outside mocks for easy access)
const mockHero = {
  id: 1,
  title: "Next-Generation Sportswear Manufacturing",
  subtitle: "Engineering high-performance athletic apparel",
  backgroundImageId: null,
  ctaText: "EXPLORE OUR CAPABILITIES",
  ctaLink: "/manufacturing",
  isActive: true,
  sortOrder: 0,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};
const mockSlogans = [
  { id: 1, text: "Crafting Excellence in Every Thread", position: 1, isActive: true, sortOrder: 1 },
  {
    id: 2,
    text: "Where Innovation Meets Athletic Performance",
    position: 2,
    isActive: true,
    sortOrder: 2,
  },
];
const mockSections = [
  {
    id: 1,
    name: "intro",
    title: "Our Story",
    heroTitle: null,
    content: "Our story...",
    sectionType: "text",
    mediaIds: [],
    isActive: true,
    sortOrder: 1,
  },
];
const mockProcessCards = [
  {
    id: 1,
    title: "Inquiry & R&D",
    description: "Material sourcing",
    step: "01",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    title: "Prototyping",
    description: "Rapid sampling",
    step: "02",
    sortOrder: 2,
    isActive: true,
  },
];
const mockFeaturedProductsSettings = {
  id: 1,
  title: "Featured Products",
  maxProducts: 8,
  autoSelect: true,
  isActive: true,
  isEnabled: true,
};

// Mock admin cache manager (used by auth-service requireAdmin)
vi.mock("../../../server/lib/cache/admin-cache.js", () => ({
  adminCacheManager: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

// ──────────────────────────────────────────────────────────────────────────────
// IMPORTS (after mocks)
// ──────────────────────────────────────────────────────────────────────────────

import { setupErrorHandling, setupMiddleware } from "../../../server/boot/middleware.js";
import { registerRoutes } from "../../../server/routes/index.js";

// ──────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ──────────────────────────────────────────────────────────────────────────────

describe("Homepage API — CMS Endpoint Coverage", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    await setupMiddleware(app);
    await registerRoutes(app);
    setupErrorHandling(app);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-hero
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-hero", () => {
    test("returns 200 with hero data shape", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValueOnce(mockHero);

      const res = await request(app).get("/api/homepage-hero");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("title");
      expect(res.body).toHaveProperty("subtitle");
      expect(res.body).toHaveProperty("ctaText");
      expect(res.body).toHaveProperty("ctaLink");
      expect(res.body).toHaveProperty("isActive");
    });

    test("title is a non-empty string", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValueOnce(mockHero);

      const res = await request(app).get("/api/homepage-hero");
      expect(typeof res.body.title).toBe("string");
      expect(res.body.title.length).toBeGreaterThan(0);
    });

    test("returns no-cache headers to prevent stale reads after admin updates", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValueOnce(mockHero);

      const res = await request(app).get("/api/homepage-hero");
      expect(res.status).toBe(200);
      // Route sets Cache-Control: no-cache, no-store, must-revalidate
      expect(res.headers["cache-control"]).toMatch(/no-cache|no-store/);
    });

    test("handles missing hero gracefully (returns 404 or empty body, not 500)", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValueOnce(undefined);

      const res = await request(app).get("/api/homepage-hero");
      expect([200, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-slogans
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-slogans", () => {
    test("returns 200 with array of slogans", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValueOnce(mockSlogans);

      const res = await request(app).get("/api/homepage-slogans");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test("each slogan has text and isActive fields", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValueOnce(mockSlogans);

      const res = await request(app).get("/api/homepage-slogans");
      for (const slogan of res.body as { text: unknown; isActive: unknown }[]) {
        expect(slogan).toHaveProperty("text");
        expect(slogan).toHaveProperty("isActive");
        expect(typeof slogan.text).toBe("string");
      }
    });

    test("returns empty array when no slogans exist", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValueOnce([]);

      const res = await request(app).get("/api/homepage-slogans");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-sections
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-sections", () => {
    test("returns 200 with sections array", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValueOnce(mockSections);

      const res = await request(app).get("/api/homepage-sections");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("each section has id, name, and mediaIds fields", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValueOnce(mockSections);

      const res = await request(app).get("/api/homepage-sections");
      for (const section of res.body as { id: unknown; name: unknown; mediaIds: unknown }[]) {
        expect(section).toHaveProperty("id");
        expect(section).toHaveProperty("name");
        expect(section).toHaveProperty("mediaIds");
        expect(Array.isArray(section.mediaIds)).toBe(true);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-batch (primary frontend endpoint)
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-batch", () => {
    test("returns 200 with aggregated batch shape", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValue(mockHero);
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValue(mockSlogans);
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValue(mockSections);
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-batch");
      expect(res.status).toBe(200);
    });

    test("batch response includes hero, slogans, sections, processCards keys", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValue(mockHero);
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValue(mockSlogans);
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValue(mockSections);
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-batch");
      expect(res.body).toHaveProperty("hero");
      expect(res.body).toHaveProperty("slogans");
      expect(res.body).toHaveProperty("sections");
      expect(res.body).toHaveProperty("processCards");
      expect(res.body).toHaveProperty("featuredProductsSettings");
    });

    test("each batch key wraps data in {result, timestamp} envelope", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValue(mockHero);
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValue(mockSlogans);
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValue(mockSections);
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-batch");
      expect(res.body.hero).toHaveProperty("result");
      expect(res.body.hero).toHaveProperty("timestamp");
      expect(res.body.slogans).toHaveProperty("result");
    });

    test("hero result inside batch contains the title", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValue(mockHero);
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValue(mockSlogans);
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValue(mockSections);
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-batch");
      expect(res.body.hero.result).toHaveProperty("title");
      expect(typeof res.body.hero.result.title).toBe("string");
    });

    test("sets X-Cache-Hit header", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageHero).mockResolvedValue(mockHero);
      vi.mocked(homepageRepository.getHomepageSlogans).mockResolvedValue(mockSlogans);
      vi.mocked(homepageRepository.getHomepageSections).mockResolvedValue(mockSections);
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-batch");
      expect(res.headers).toHaveProperty("x-cache-hit");
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-process-cards
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-process-cards", () => {
    test("returns 200 with process cards wrapped in {result, timestamp}", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);

      const res = await request(app).get("/api/homepage-process-cards");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("result");
      expect(Array.isArray(res.body.result)).toBe(true);
    });

    test("process cards have title, description, and step fields", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageProcessCards).mockResolvedValue(mockProcessCards);

      const res = await request(app).get("/api/homepage-process-cards");
      for (const card of res.body.result as {
        title: unknown;
        description: unknown;
        step: unknown;
      }[]) {
        expect(card).toHaveProperty("title");
        expect(card).toHaveProperty("description");
        expect(card).toHaveProperty("step");
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // PATCH /api/homepage-hero (admin mutation — requires auth)
  // ────────────────────────────────────────────────────────────
  describe("PATCH /api/homepage-hero", () => {
    test("returns 401 or 403 when request is unauthenticated", async () => {
      const res = await request(app)
        .patch("/api/homepage-hero")
        .set("Content-Type", "application/json")
        .send({
          title: "Unauthorized Title",
          subtitle: "Sub",
          ctaText: "CTA",
          ctaLink: "/manufacturing",
          isActive: true,
          sortOrder: 0,
        });
      // Not authenticated — must block with 401 (session expired) or 403 (CSRF missing)
      expect([401, 403]).toContain(res.status);
    });

    test("returns 403 when CSRF token is missing (double-submit cookie pattern)", async () => {
      // We send a session but no CSRF header — server should reject
      const res = await request(app)
        .patch("/api/homepage-hero")
        .set("Content-Type", "application/json")
        .set("Cookie", "connect.sid=fake-session")
        .send({
          title: "Test Hero",
          subtitle: "Sub",
          ctaText: "CTA",
          ctaLink: "/manufacturing",
          isActive: true,
          sortOrder: 0,
        });
      expect([401, 403]).toContain(res.status);
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/homepage-featured-products-settings
  // ────────────────────────────────────────────────────────────
  describe("GET /api/homepage-featured-products-settings", () => {
    test("returns 200 with featured products settings", async () => {
      const { homepageRepository } = await import("../../../server/lib/db/repositories/index.js");
      vi.mocked(homepageRepository.getHomepageFeaturedProductsSettings).mockResolvedValue(
        mockFeaturedProductsSettings,
      );

      const res = await request(app).get("/api/homepage-featured-products-settings");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("maxProducts");
      expect(res.body).toHaveProperty("isActive");
    });
  });

  // ────────────────────────────────────────────────────────────
  // Data integrity: constants (pure unit, no HTTP)
  // ────────────────────────────────────────────────────────────
  describe("Homepage constants (HERO_TEXT fallback, KEY_STATS)", () => {
    test("HERO_TEXT fallback is a non-empty array of strings", async () => {
      const { HERO_TEXT } = await import("../../../client/app/components/homepage/constants.js");
      expect(Array.isArray(HERO_TEXT)).toBe(true);
      expect(HERO_TEXT.length).toBeGreaterThan(0);
      for (const line of HERO_TEXT) {
        expect(typeof line).toBe("string");
        expect(line.length).toBeGreaterThan(0);
      }
    });

    test("KEY_STATS has value and label on each entry", async () => {
      const { KEY_STATS } = await import("../../../client/app/components/homepage/constants.js");
      expect(Array.isArray(KEY_STATS)).toBe(true);
      for (const stat of KEY_STATS) {
        expect(stat).toHaveProperty("value");
        expect(stat).toHaveProperty("label");
        expect(typeof stat.value).toBe("string");
        expect(typeof stat.label).toBe("string");
      }
    });

    test("HERO_TEXT contains at least 2 lines (multi-line hero layout)", async () => {
      const { HERO_TEXT } = await import("../../../client/app/components/homepage/constants.js");
      expect(HERO_TEXT.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // GET /api/performance-monitoring (batch route)
  // ────────────────────────────────────────────────────────────
  describe("GET /api/performance-monitoring", () => {
    test("returns 200 with cache metrics shape", async () => {
      const res = await request(app).get("/api/performance-monitoring");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("batchCacheMetrics");
      expect(res.body).toHaveProperty("successCriteria");
      expect(res.body).toHaveProperty("timestamp");
    });

    test("batchCacheMetrics includes hitRate and totalRequests", async () => {
      const res = await request(app).get("/api/performance-monitoring");
      const { batchCacheMetrics } = res.body as {
        batchCacheMetrics: { hitRate: unknown; totalRequests: unknown };
      };
      expect(batchCacheMetrics).toHaveProperty("hitRate");
      expect(batchCacheMetrics).toHaveProperty("totalRequests");
    });
  });
});
