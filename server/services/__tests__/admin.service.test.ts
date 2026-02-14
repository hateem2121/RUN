import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorage } from "../../lib/storage-singleton.js";
import { adminService } from "../admin/admin.service.js";

vi.mock("../../lib/storage-singleton.js", () => ({
  getStorage: vi.fn(),
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../lib/encryption.js", () => ({
  encrypt: vi.fn((val) => `enc_${val}`),
  getBlindIndex: vi.fn((val) => `idx_${val}`),
}));

vi.mock("../../lib/integrations/storage-lifecycle-scheduler.js", () => ({
  getLifecycleScheduler: vi.fn(() => ({
    runCleanup: vi.fn().mockResolvedValue({
      cleanedFiles: ["f1"],
      orphanedFiles: [],
      spaceSaved: 100,
    }),
  })),
}));

describe("AdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logAudit", () => {
    it("should encrypt sensitive data and call storage", async () => {
      const mockStorage = { createAuditLog: vi.fn().mockResolvedValue({ id: 1 }) };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const auditData = {
        action: "UPDATE",
        tableName: "products",
        recordId: "123",
        user: { id: "u1", email: "test@example.com" } as any,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      await adminService.logAudit(auditData);

      expect(mockStorage.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          userEmail: "enc_test@example.com",
          userEmailIndex: "idx_test@example.com",
          ipAddress: "enc_127.0.0.1",
          userAgent: "enc_test-agent",
        }),
      );
    });
  });

  describe("getInitialProductsData", () => {
    it("fetches and aggregates data correctly", async () => {
      const mockProducts = [
        { id: 1, name: "P1", isActive: true, deletedAt: null, primaryImageId: 10 },
        { id: 2, name: "P2", isActive: false, deletedAt: null }, // Inactive
      ];
      const mockMedia = [{ id: 10, filename: "img.jpg", type: "image", url: "/url" }];

      const mockStorage = {
        getProductsIncludingDeleted: vi.fn().mockResolvedValue(mockProducts),
        getProductsCount: vi.fn().mockResolvedValue(2),
        getCategories: vi.fn().mockResolvedValue([]),
        getFabrics: vi.fn().mockResolvedValue([]),
        getMediaAssetsByIds: vi.fn().mockResolvedValue(mockMedia),
        getMediaAssets: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.getInitialProductsData(1, 50);

      expect(result.products).toHaveLength(1); // Only active and not deleted
      expect(result.products[0].name).toBe("P1");
      expect(result.meta.totalProducts).toBe(2);
      expect(result.mediaAssets).toHaveLength(1);
    });

    it("handles empty data gracefully", async () => {
      const mockStorage = {
        getProductsIncludingDeleted: vi.fn().mockResolvedValue([]),
        getProductsCount: vi.fn().mockResolvedValue(0),
        getCategories: vi.fn().mockResolvedValue([]),
        getFabrics: vi.fn().mockResolvedValue([]),
        getMediaAssetsByIds: vi.fn().mockResolvedValue([]),
        getMediaAssets: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.getInitialProductsData();

      expect(result.products).toEqual([]);
      expect(result.meta.totalProducts).toBe(0);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("identifies and fixes corrupted media URLs", async () => {
      const categories = [
        {
          id: 1,
          name: "Cat 1",
          featuredContent: {
            card1: { mediaUrl: "/api/media/undefined/content" }, // Corrupted
            card2: { mediaUrl: "/valid/url" },
          },
        },
        {
          id: 2,
          name: "Cat 2",
          featuredContent: { card1: { mediaUrl: "/valid/url" } },
        },
      ];

      const mockStorage = {
        getCategories: vi.fn().mockResolvedValue(categories),
        updateCategory: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn(),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const auditCtx = {
        user: { id: "u1", email: "a@b.com" } as any,
        userAgent: "ua",
        ipAddress: "ip",
      };
      const result = await adminService.fixCorruptedMedia(auditCtx);

      expect(result.fixedCount).toBe(1);
      expect(result.fixedCategories).toContain("Cat 1");
      expect(mockStorage.updateCategory).toHaveBeenCalled();
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("triggerCleanup", () => {
    it("should call scheduler and log audit", async () => {
      const mockStorage = { createAuditLog: vi.fn() };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const auditCtx = {
        user: { id: "u1", email: "a@b.com" } as any,
        userAgent: "ua",
        ipAddress: "ip",
      };
      const report = await adminService.triggerCleanup(auditCtx, true);

      expect(report.cleanedFiles).toContain("f1");
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("updateAuditConfig", () => {
    it("should update storage and log audit", async () => {
      const mockStorage = {
        setAuditTrailEnabled: vi.fn(),
        configureTrackedTables: vi.fn(),
        createAuditLog: vi.fn(),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const auditCtx = {
        user: { id: "u1", email: "a@b.com" } as any,
        userAgent: "ua",
        ipAddress: "ip",
      };
      const config = { enabled: true, trackedTables: ["users"] };

      const result = await adminService.updateAuditConfig(auditCtx, config);

      expect(result).toBe(true);
      expect(mockStorage.setAuditTrailEnabled).toHaveBeenCalledWith(true);
      expect(mockStorage.configureTrackedTables).toHaveBeenCalledWith(["users"]);
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("restore methods", () => {
    it("restoreCategory calls storage and logs audit", async () => {
      const mockStorage = {
        restoreCategory: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn(),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const auditCtx = { user: { id: "u1" } as any, userAgent: "ua", ipAddress: "ip" };
      await adminService.restoreCategory(auditCtx, 1);

      expect(mockStorage.restoreCategory).toHaveBeenCalledWith(1);
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });
});
