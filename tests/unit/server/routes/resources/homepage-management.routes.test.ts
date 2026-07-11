import express from "express";
import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { productionErrorHandler } from "../../../../../server/middleware/production-error-handler.js";
import homepageManagementRoutes from "../../../../../server/routes/resources/homepage-management.routes.js";
import { homepageService } from "../../../../../server/services/homepage.service.js";

vi.mock("../../../../../server/services/homepage.service.js", () => ({
  homepageService: {
    getHero: vi.fn(),
    updateHero: vi.fn(),
    getSlogans: vi.fn(),
    getSlogan: vi.fn(),
    createSlogan: vi.fn(),
    updateSlogan: vi.fn(),
    deleteSlogan: vi.fn(),
    reorderSlogans: vi.fn(),
    getProcessCards: vi.fn(),
    getProcessCard: vi.fn(),
    createProcessCard: vi.fn(),
    updateProcessCard: vi.fn(),
    deleteProcessCard: vi.fn(),
    reorderProcessCards: vi.fn(),
    getSections: vi.fn(),
    getSectionById: vi.fn(),
    updateSectionById: vi.fn(),
    getFeaturedProductsSettings: vi.fn(),
    updateFeaturedProductsSettings: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/auth-service.js", () => ({
  authService: {
    requireAdmin: vi.fn((_req, _res, next) => next()),
  },
}));

const app = express();
app.use(express.json());
app.use("/api", homepageManagementRoutes);
app.use(productionErrorHandler);

describe("Homepage Management Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/homepage-hero", () => {
    it("returns hero from service", async () => {
      const mockHero = { title: "Hero" };
      vi.mocked(homepageService.getHero).mockResolvedValue(ok(mockHero));

      const response = await request(app).get("/api/homepage-hero");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHero);
      expect(homepageService.getHero).toHaveBeenCalled();
    });

    it("handles service errors", async () => {
      vi.mocked(homepageService.getHero).mockResolvedValue(err(new Error("Service error") as any));

      const response = await request(app).get("/api/homepage-hero");

      expect(response.status).toBe(500);
    });
  });

  describe("PATCH /api/homepage-hero", () => {
    it("updates hero through service", async () => {
      const updateData = { title: "Updated Hero" };
      const updatedHero = { id: 1, ...updateData };
      vi.mocked(homepageService.updateHero).mockResolvedValue(ok(updatedHero));

      const response = await request(app).patch("/api/homepage-hero").send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedHero);
      expect(homepageService.updateHero).toHaveBeenCalledWith(expect.objectContaining(updateData));
    });

    it("returns 422 for invalid data", async () => {
      const invalidData = { title: 123 }; // Should be string
      const response = await request(app).patch("/api/homepage-hero").send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("detail");
    });
  });
});
