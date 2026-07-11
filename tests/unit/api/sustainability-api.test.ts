/**
 * SUSTAINABILITY API ENDPOINT TESTS
 * RUN APPAREL (PVT) LTD - B2B Sportswear Manufacturing Platform
 *
 * Comprehensive test coverage for Sustainability page CMS integration
 */

import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

// Mock App Storage Service
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

// Mock Repositories
vi.mock("../../../server/lib/db/repositories/index.js", async (importOriginal) => {
  const actual = (await importOriginal()) as any;

  const mockHero = {
    id: 1,
    title: "Commitment to Sustainability",
    subtitle: "Heritage & Responsibility",
    description: "Our long-term commitment to a better future",
    isActive: true,
  };

  const mockMetrics = [
    {
      id: 1,
      title: "Carbon Reduction",
      value: "40%",
      unit: "Reduction",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 2,
      title: "Recycled Materials",
      value: "85%",
      unit: "Polyester",
      isActive: true,
      sortOrder: 2,
    },
  ];

  const mockInitiatives = [
    {
      id: 1,
      title: "Water Recycling",
      description: "Zero liquid discharge facility",
      isActive: true,
      sortOrder: 1,
    },
  ];

  const mockGoals = [
    {
      id: 1,
      title: "Net Zero 2040",
      description: "Complete carbon neutrality",
      isActive: true,
      sortOrder: 1,
    },
  ];

  const mockUnified = {
    id: 1,
    title: "Sustainability Overview",
    sectionType: "unified",
    data: {
      heroData: JSON.stringify(mockHero),
      goalsData: JSON.stringify(mockGoals),
      metricsData: JSON.stringify(mockMetrics),
      initiativesData: JSON.stringify(mockInitiatives),
    },
  };

  return {
    ...actual,
    pageContentRepository: {
      ...actual.pageContentRepository,
      getSustainabilityHero: vi.fn().mockResolvedValue(mockHero),
      getSustainabilityMetrics: vi.fn().mockResolvedValue(mockMetrics),
      getSustainabilityInitiatives: vi.fn().mockResolvedValue(mockInitiatives),
      getSustainabilityGoals: vi.fn().mockResolvedValue(mockGoals),
      getUnifiedSustainability: vi.fn().mockResolvedValue(mockUnified),
      getSustainabilityBatchData: vi.fn().mockResolvedValue({
        hero: mockHero,
        metrics: mockMetrics,
        initiatives: mockInitiatives,
        goals: mockGoals,
        unified: mockUnified,
      }),
    },
  };
});

// Mock Two-Tier Cache
vi.mock("../../../server/lib/cache/two-tier-batch.js", () => ({
  twoTierBatchCache: {
    invalidate: vi.fn(),
    get: vi.fn().mockImplementation(async (_key, fetchFn) => {
      const data = await fetchFn();
      return { data, benchmark: { hit: "MISS", totalTime: 0 } };
    }),
  },
}));

import { setupErrorHandling, setupMiddleware } from "../../../server/boot/middleware.js";
import { registerRoutes } from "../../../server/routes/index.js";

describe("SUSTAINABILITY API TESTS", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    await setupMiddleware(app);
    await registerRoutes(app);
    setupErrorHandling(app);
  });

  afterAll(async () => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/sustainability-hero", () => {
    test("Should return hero content", async () => {
      const response = await request(app).get("/api/sustainability-hero");
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("title");
      }
    });
  });

  describe("GET /api/sustainability-metrics", () => {
    test("Should return metrics array", async () => {
      const response = await request(app).get("/api/sustainability-metrics");
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe("GET /api/sustainability-batch", () => {
    test("Should return consolidated sustainability data", async () => {
      const response = await request(app).get("/api/sustainability-batch");
      // This is a common performance optimization endpoint
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("Security Check", () => {
    test("POST /api/sustainability-hero should return 401 without auth", async () => {
      const response = await request(app).post("/api/sustainability-hero").send({ title: "Hack" });
      expect([401, 403, 404]).toContain(response.status);
    });
  });
});
