import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import adminRouter from "./admin.ts";

// Use vi.hoisted to ensure the mock is available to the hoisted vi.mock call
const { mockAdminService } = vi.hoisted(() => {
  const mock: {
    getInitialProductsData: ReturnType<typeof vi.fn>;
    fixCorruptedMedia: ReturnType<typeof vi.fn>;
    triggerCleanup: ReturnType<typeof vi.fn>;
    logAudit: ReturnType<typeof vi.fn>;
    updateAuditConfig: ReturnType<typeof vi.fn>;
    restoreCategory: ReturnType<typeof vi.fn>;
    restoreProduct: ReturnType<typeof vi.fn>;
    restoreMediaAsset: ReturnType<typeof vi.fn>;
    getAboutTimelineEntries: ReturnType<typeof vi.fn>;
    createAboutTimelineEntry: ReturnType<typeof vi.fn>;
    updateAboutTimelineEntry: ReturnType<typeof vi.fn>;
    deleteAboutTimelineEntry: ReturnType<typeof vi.fn>;
  } = {
    getInitialProductsData: vi.fn(),
    fixCorruptedMedia: vi.fn(),
    triggerCleanup: vi.fn(),
    logAudit: vi.fn(),
    updateAuditConfig: vi.fn(),
    restoreCategory: vi.fn(),
    restoreProduct: vi.fn(),
    restoreMediaAsset: vi.fn(),
    getAboutTimelineEntries: vi.fn(),
    createAboutTimelineEntry: vi.fn(),
    updateAboutTimelineEntry: vi.fn(),
    deleteAboutTimelineEntry: vi.fn(),
  };

  mock.fixCorruptedMedia.mockImplementation(async (audit: Record<string, unknown>) => {
    const result = { fixedCount: 5, fixedCategories: ["cat1"] };
    await mock.logAudit({
      action: "UPDATE",
      tableName: "categories",
      recordId: "BULK_FIX",
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
      metadata: { operation: "fix-corrupted-media", result },
    });
    return result;
  });

  mock.triggerCleanup.mockImplementation(
    async (audit: Record<string, unknown>, autoClean: boolean) => {
      const report = { cleanedFiles: [], orphanedFiles: [], spaceSaved: 0 };
      await mock.logAudit({
        action: "DELETE",
        tableName: "storage",
        recordId: "CLEANUP",
        user: audit.user,
        userAgent: audit.userAgent,
        ipAddress: audit.ipAddress,
        metadata: { operation: "cleanup", autoClean, report },
      });
      return report;
    },
  );

  mock.updateAuditConfig.mockImplementation(async (audit: Record<string, unknown>) => {
    await mock.logAudit({
      action: "UPDATE",
      tableName: "audit_configuration",
      recordId: "CONFIG",
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
    });
    return true;
  });

  mock.restoreCategory.mockImplementation(async (audit: Record<string, unknown>, id: number) => {
    await mock.logAudit({
      action: "RESTORE",
      tableName: "categories",
      recordId: id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
    });
    return true;
  });

  mock.restoreProduct.mockImplementation(async (audit: Record<string, unknown>, id: number) => {
    await mock.logAudit({
      action: "RESTORE",
      tableName: "products",
      recordId: id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
    });
    return true;
  });

  mock.restoreMediaAsset.mockImplementation(async (audit: Record<string, unknown>, id: number) => {
    await mock.logAudit({
      action: "RESTORE",
      tableName: "media_assets",
      recordId: id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
    });
    return true;
  });

  return { mockAdminService: mock };
});

// Mock dependencies
vi.mock("../../services/admin/index.js", () => ({
  adminService: mockAdminService,
}));

vi.mock("../../services/auth-service.js", () => ({
  authService: {
    requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
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
  withTimeout: (promise: Promise<unknown>) => promise,
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
      mockAdminService.getInitialProductsData.mockResolvedValue(mockData);

      const response = await request(app).get("/api/admin/products/initial-data");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });
  });

  describe("POST /api/admin/fix-corrupted-media", () => {
    it("should trigger fix and return result", async () => {
      const response = await request(app)
        .post("/api/admin/fix-corrupted-media")
        .send({ timeout: 1000 });

      if (response.status !== 200) {
        console.error("Fix corrupted media failed:", response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fixedCount).toBe(5);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          recordId: "BULK_FIX",
        }),
      );
    });
  });

  describe("POST /api/admin/cleanup/trigger", () => {
    it("should trigger cleanup and log audit", async () => {
      const response = await request(app)
        .post("/api/admin/cleanup/trigger")
        .send({ autoClean: true });

      if (response.status !== 200) {
        console.error("Trigger cleanup failed:", response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          recordId: "CLEANUP",
        }),
      );
    });
  });

  describe("POST /api/admin/enterprise/audit-config", () => {
    it("should update audit config", async () => {
      const response = await request(app)
        .post("/api/admin/enterprise/audit-config")
        .send({ enabled: true, trackedTables: ["products"] });

      if (response.status !== 200) {
        console.error("Update audit config failed:", response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          recordId: "CONFIG",
        }),
      );
    });
  });

  describe("POST /api/admin/categories/:id/restore", () => {
    it("should restore category", async () => {
      const response = await request(app).post("/api/admin/categories/123/restore").send({});

      if (response.status !== 200) {
        console.error("Restore failed:", response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESTORE",
          recordId: "123",
          tableName: "categories",
        }),
      );
    });
  });

  describe("GET /api/admin/test", () => {
    it("should return router check message", async () => {
      const response = await request(app).get("/api/admin/test");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("API routing works");
    });
  });

  describe("GET /api/admin/enterprise/audit-config", () => {
    it("should return audit config", async () => {
      const response = await request(app).get("/api/admin/enterprise/audit-config");
      expect(response.status).toBe(200);
      expect(response.body.enabled).toBe(true);
      expect(Array.isArray(response.body.trackedTables)).toBe(true);
    });
  });

  describe("POST /api/admin/products/:id/restore", () => {
    it("should restore product", async () => {
      const response = await request(app).post("/api/admin/products/456/restore").send({});
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESTORE",
          recordId: "456",
          tableName: "products",
        }),
      );
    });
  });

  describe("POST /api/admin/media-assets/:id/restore", () => {
    it("should restore media asset", async () => {
      const response = await request(app).post("/api/admin/media-assets/789/restore").send({});
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAdminService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESTORE",
          recordId: "789",
          tableName: "media_assets",
        }),
      );
    });

    it("should return 400 for invalid ID", async () => {
      const response = await request(app).post("/api/admin/media-assets/invalid/restore").send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("expected numeric ID");
    });
  });

  describe("About Timeline Routes", () => {
    const mockEntry = { id: 1, title: "Test Entry", year: 2024 };

    it("GET /api/admin/about/timeline - should return timeline entries", async () => {
      mockAdminService.getAboutTimelineEntries.mockResolvedValue([mockEntry]);
      const response = await request(app).get("/api/admin/about/timeline");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockEntry]);
    });

    it("POST /api/admin/about/timeline - should create entry", async () => {
      mockAdminService.createAboutTimelineEntry.mockResolvedValue(mockEntry);
      const response = await request(app)
        .post("/api/admin/about/timeline")
        .send({ title: "New", year: 2025 });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockEntry);
    });

    it("PATCH /api/admin/about/timeline/:id - should update entry", async () => {
      mockAdminService.updateAboutTimelineEntry.mockResolvedValue(mockEntry);
      const response = await request(app)
        .patch("/api/admin/about/timeline/1")
        .send({ title: "Updated" });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntry);
    });

    it("DELETE /api/admin/about/timeline/:id - should delete entry", async () => {
      mockAdminService.deleteAboutTimelineEntry.mockResolvedValue(true);
      const response = await request(app).delete("/api/admin/about/timeline/1");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
