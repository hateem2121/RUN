import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import adminRouter from "./admin.ts";

// Mock dependencies
vi.mock("../../services/admin/index.js", () => ({
  adminService: {
    getInitialProductsData: vi.fn(),
    fixCorruptedMedia: vi.fn(),
    triggerCleanup: vi.fn(),
    logAudit: vi.fn(),
  },
}));

vi.mock("../../services/auth-service.js", () => ({
  authService: {
    requireAdmin: (req: any, res: any, next: any) => next(),
  },
}));

vi.mock("../../lib/storage-singleton.js", () => ({
  getStorage: vi.fn(() => ({
    getMediaAssets: vi.fn().mockResolvedValue([]),
    createAuditLog: vi.fn(),
    setAuditTrailEnabled: vi.fn(),
    configureTrackedTables: vi.fn(),
    restoreCategory: vi.fn().mockResolvedValue(true),
    restoreProduct: vi.fn().mockResolvedValue(true),
    restoreMediaAsset: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock("../../lib/resilience/request-timeout.js", () => ({
  withTimeout: (promise: Promise<any>) => promise,
}));

// Initialize app with router
const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

describe("Admin Routes Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/media-assets", () => {
    it("should return media assets", async () => {
      const response = await request(app).get("/api/admin/media-assets");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/admin/products/initial-data", () => {
    it("should return initial products data", async () => {
      const mockData = { products: [], meta: { total: 0 } };
      const { adminService } = await import("../../services/admin/index.js");
      vi.mocked(adminService.getInitialProductsData).mockResolvedValue(mockData as any);

      const response = await request(app).get("/api/admin/products/initial-data");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });
  });

  describe("POST /api/admin/fix-corrupted-media", () => {
    it("should trigger fix and return result", async () => {
      const mockResult = { fixedCount: 5, fixedCategories: ["cat1"] };
      const { adminService } = await import("../../services/admin/index.js");
      vi.mocked(adminService.fixCorruptedMedia).mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/admin/fix-corrupted-media")
        .send({ timeout: 1000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fixedCount).toBe(5);
      expect(adminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          recordId: "BULK_FIX",
        }),
      );
    });
  });

  describe("POST /api/admin/cleanup/trigger", () => {
    it("should trigger cleanup and log audit", async () => {
      const mockReport = { cleanedFiles: [], orphanedFiles: [], spaceSaved: 0 };
      const { adminService } = await import("../../services/admin/index.js");
      vi.mocked(adminService.triggerCleanup).mockResolvedValue(mockReport as any);

      const response = await request(app)
        .post("/api/admin/cleanup/trigger")
        .send({ autoClean: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          recordId: "CLEANUP",
        }),
      );
    });
  });

  describe("POST /api/admin/enterprise/audit-config", () => {
    it("should update audit config", async () => {
      const { adminService } = await import("../../services/admin/index.js");
      const response = await request(app)
        .post("/api/admin/enterprise/audit-config")
        .send({ enabled: true, trackedTables: ["products"] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          recordId: "CONFIG",
        }),
      );
    });
  });

  describe("POST /api/admin/categories/:id/restore", () => {
    it("should restore category", async () => {
      const { adminService } = await import("../../services/admin/index.js");

      const response = await request(app).post("/api/admin/categories/123/restore").send({}); // Ensure body exists for strict schema validation

      if (response.status !== 200) {
        console.error("Restore failed:", response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(adminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESTORE",
          recordId: "123",
          tableName: "categories",
        }),
      );
    });
  });
});
