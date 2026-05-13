import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ok } from "neverthrow";
import adminRouter from "./admin.ts";

// Mock all dependencies admin.ts imports
vi.mock("../../services/admin/index.js", () => ({
  adminService: {
    checkSlugAvailability: vi.fn(),
    getInitialProductsData: vi.fn(),
    fixCorruptedMedia: vi.fn(),
    triggerCleanup: vi.fn(),
    logAudit: vi.fn(),
    updateAuditConfig: vi.fn(),
    restoreCategory: vi.fn(),
    restoreProduct: vi.fn(),
    restoreMediaAsset: vi.fn(),
    getMediaAssets: vi.fn().mockResolvedValue([]),
    getAboutTimelineEntries: vi.fn(),
    createAboutTimelineEntry: vi.fn(),
    updateAboutTimelineEntry: vi.fn(),
    deleteAboutTimelineEntry: vi.fn(),
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

vi.mock("../../services/auth-service.js", () => ({
  authService: {
    requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
    requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  },
}));

vi.mock("../../lib/storage-singleton.js", () => ({
  getStorage: vi.fn(() => ({
    getMediaAssets: vi.fn().mockResolvedValue([]),
    createAuditLog: vi.fn(),
    setAuditTrailEnabled: vi.fn(),
    configureTrackedTables: vi.fn(),
  })),
}));

vi.mock("../../lib/resilience/request-timeout.js", () => ({
  withTimeout: (promise: Promise<unknown>) => promise,
}));

import { adminService } from "../../services/admin/index.js";

const mockCheck = adminService.checkSlugAvailability as ReturnType<typeof vi.fn>;

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);
// Minimal error handler: ZodError → 400
app.use(
  (
    err: unknown,
    _req: import("express").Request,
    res: import("express").Response,
    _next: import("express").NextFunction,
  ) => {
    if (err instanceof Error && err.name === "ZodError") {
      res.status(400).json({ error: "Validation failed", detail: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

describe("Admin Routes — Slug Validation (Fix 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/products/check-slug", () => {
    it("returns 200 and availability result for a valid slug", async () => {
      mockCheck.mockResolvedValue(ok({ available: true, slug: "running-shorts" }));

      const response = await request(app)
        .get("/api/admin/products/check-slug")
        .query({ slug: "running-shorts" });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
      expect(mockCheck).toHaveBeenCalledWith("running-shorts", undefined);
    });

    it("normalizes uppercase slugs before availability check", async () => {
      mockCheck.mockResolvedValue(ok({ available: true, slug: "running-shorts" }));

      const response = await request(app)
        .get("/api/admin/products/check-slug")
        .query({ slug: "RUNNING-SHORTS" });

      expect(response.status).toBe(200);
      // normalizeSlug lowercases — adminService should receive "running-shorts"
      expect(mockCheck).toHaveBeenCalledWith("running-shorts", undefined);
    });

    it("coerces string excludeId to number before passing to service", async () => {
      mockCheck.mockResolvedValue(ok({ available: true, slug: "running-shorts" }));

      const response = await request(app)
        .get("/api/admin/products/check-slug")
        .query({ slug: "running-shorts", excludeId: "42" });

      expect(response.status).toBe(200);
      // z.coerce.number converts "42" → 42
      expect(mockCheck).toHaveBeenCalledWith("running-shorts", 42);
    });

    it("returns 400 and does not call service when slug is an empty string", async () => {
      const response = await request(app).get("/api/admin/products/check-slug").query({ slug: "" });

      expect(response.status).toBe(400);
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it("returns 400 and does not call service when slug query param is missing", async () => {
      const response = await request(app).get("/api/admin/products/check-slug");

      expect(response.status).toBe(400);
      expect(mockCheck).not.toHaveBeenCalled();
    });
  });
});
