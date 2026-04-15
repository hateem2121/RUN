import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, test, vi } from "vitest";
import { mediaRepository, miscRepository } from "../../server/lib/db/repositories/index.js";
import { registerRoutes } from "../../server/routes/index.js";

// Mock Repositories
vi.mock("../../server/lib/db/repositories/index.js", () => ({
  mediaRepository: {
    getMediaAssets: vi.fn(),
    getMediaAssetsWithCount: vi.fn(),
  },
  miscRepository: {
    getFibers: vi.fn(),
    getCertificates: vi.fn(),
  },
  userRepository: {
    getUser: vi.fn(),
  },
  pageContentRepository: {},
  productRepository: {},
  accessoryRepository: {},
  blogRepository: {},
  systemRepository: {},
  webhookRepository: {},
}));

// Mock Auth
vi.mock("../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
    isAuthenticated: (_req: unknown, _res: unknown, next: () => void) => next(),
  },
}));

let app: Express;

describe("CMS API Integration Tests", () => {
  beforeAll(async () => {
    // Force bypass for testing
    process.env.BYPASS_RBAC_FOR_TESTING = "true";

    // Import app dynamically after mocks are set
    const express = (await import("express")).default;
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  afterAll(() => {
    delete process.env.BYPASS_RBAC_FOR_TESTING;
  });

  describe("Media Assets", () => {
    test("GET /api/media - Success", async () => {
      vi.mocked(mediaRepository.getMediaAssetsWithCount).mockResolvedValue({
        assets: [{ id: 1, filename: "test.jpg", url: "/test.jpg" }],
        total: 1,
      } as any);

      const response = await request(app).get("/api/media");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ data: expect.any(Array) });
    });
  });

  describe("Admin Misc Content", () => {
    test("GET /api/fibers - Success", async () => {
      vi.mocked(miscRepository.getFibers).mockResolvedValue([{ id: 1, name: "Fiber A" }] as any);

      const response = await request(app).get("/api/fibers");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    test("GET /api/certificates - Success", async () => {
      vi.mocked(miscRepository.getCertificates).mockResolvedValue([
        { id: 1, name: "Cert A" },
      ] as any);

      const response = await request(app).get("/api/certificates");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });
});
