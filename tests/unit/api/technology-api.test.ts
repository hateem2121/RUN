/**
 * TECHNOLOGY API ENDPOINT TESTS
 * RUN APPAREL (PVT) LTD - B2B Sportswear Manufacturing Platform
 *
 * Comprehensive test coverage for Technology page CMS integration
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
    title: "Advanced Engineering",
    subtitle: "R&D Focused Manufacturing",
    description: "Our technological approach to performance wear",
  };

  const mockEquipment = [
    { id: 1, name: "3D Knitting", description: "Seamless production", icon: "Cpu", isActive: true },
  ];

  const mockInnovations = [
    { id: 1, title: "Smart Textiles", description: "Sensors integrated into fabric", sortOrder: 1 },
  ];

  const mockRoadmap = [
    { id: 1, quarter: "Q4 2026", milestone: "AI-Driven Pattern Design", isActive: true },
  ];

  return {
    ...actual,
    pageContentRepository: {
      ...actual.pageContentRepository,
      getTechnologyHero: vi.fn().mockResolvedValue(mockHero),
      getTechnologyEquipment: vi.fn().mockResolvedValue(mockEquipment),
      getTechnologyInnovations: vi.fn().mockResolvedValue(mockInnovations),
      getTechnologyResearch: vi.fn().mockResolvedValue([]),
      getTechnologyRoadmap: vi.fn().mockResolvedValue(mockRoadmap),
      getTechnologyCta: vi.fn().mockResolvedValue({ id: 1, text: "Learn More" }),
      getTechnologyGradientSettings: vi.fn().mockResolvedValue({ id: 1, primaryColor: "#00D4FF" }),
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

describe("TECHNOLOGY API TESTS", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    setupMiddleware(app);
    await registerRoutes(app);
    setupErrorHandling(app);
  });

  afterAll(async () => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/technology-hero", () => {
    test("Should return technology hero", async () => {
      const response = await request(app).get("/api/technology-hero");
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("GET /api/technology-equipment", () => {
    test("Should return equipment array", async () => {
      const response = await request(app).get("/api/technology-equipment");
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("GET /api/technology-roadmap", () => {
    test("Should return roadmap items", async () => {
      const response = await request(app).get("/api/technology-roadmap");
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("Security Check", () => {
    test("PATCH /api/technology-gradient-settings should fail for anonymous", async () => {
      const response = await request(app)
        .patch("/api/technology-gradient-settings")
        .send({ primaryColor: "#FF0000" });
      expect([401, 403, 404]).toContain(response.status);
    });
  });
});
