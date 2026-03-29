import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorage } from "../../../lib/storage-singleton";
import type { IStorage } from "../../../repositories/storage-interfaces.js";
import { adminService } from "../admin.service";
import type { AuditContext } from "../admin.service.js";

// Mock dependencies
vi.mock("../../../lib/storage-singleton", () => ({
  getStorage: vi.fn(),
}));

vi.mock("../../../lib/resilience/request-timeout", () => ({
  withTimeout: vi.fn((p) => p),
}));

vi.mock("../../../lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../lib/encryption", () => ({
  encrypt: vi.fn((val) => `enc_${val}`),
  getBlindIndex: vi.fn((val) => `idx_${val}`),
}));

vi.mock("../../../lib/integrations/storage-lifecycle-scheduler", () => ({
  getLifecycleScheduler: vi.fn(() => ({
    runCleanup: vi.fn().mockResolvedValue({
      cleanedFiles: ["file1"],
      orphanedFiles: [],
      spaceSaved: 1024,
    }),
  })),
}));

describe("AdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logAudit", () => {
    it("creates audit log with encrypted values", async () => {
      const mockStorage = {
        createAuditLog: vi.fn().mockResolvedValue({ id: "log-123" }),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const auditData = {
        action: "UPDATE",
        tableName: "products",
        recordId: "1",
        user: { id: "user-1", email: "admin@test.com" } as unknown as AuditContext["user"],
        ipAddress: "127.0.0.1",
      };

      await adminService.logAudit(auditData);

      expect(mockStorage.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          userEmail: "enc_admin@test.com",
          userEmailIndex: "idx_admin@test.com",
          ipAddress: "enc_127.0.0.1",
        }),
      );
    });
  });

  describe("getInitialProductsData", () => {
    it("returns processed dashboard data", async () => {
      const mockStorage = {
        getProductsIncludingDeleted: vi
          .fn()
          .mockResolvedValue([{ id: 1, name: "Product 1", slug: "p1", isActive: true }]),
        getProductsCount: vi.fn().mockResolvedValue(1),
        getCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Cat 1" }]),
        getFabrics: vi.fn().mockResolvedValue([]),
        getMediaAssetsByIds: vi.fn().mockResolvedValue([]),
        getMediaAssets: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const result = await adminService.getInitialProductsData(1, 10);

      expect(result.products).toHaveLength(1);
      expect(result.meta.totalProducts).toBe(1);
      expect(result.categories).toHaveLength(1);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("fixes corrupted media URLs in categories", async () => {
      const mockStorage = {
        getCategories: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: "Cat 1",
            featuredContent: {
              card1: { mediaUrl: "/api/media/undefined/content" },
            },
          },
        ]),
        updateCategory: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const auditContext = {
        user: { id: "user-1" } as unknown as AuditContext["user"],
        userAgent: "ua",
        ipAddress: "127.0.0.1",
      };

      const result = await adminService.fixCorruptedMedia(auditContext);

      expect(result.fixedCount).toBe(1);
      expect(mockStorage.updateCategory).toHaveBeenCalledWith(1, {
        featuredContent: {
          card1: { mediaUrl: "" },
        },
      });
    });
  });

  describe("triggerCleanup", () => {
    it("runs cleanup and logs audit", async () => {
      const mockStorage = {
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const auditContext = {
        user: { id: "user-1" } as unknown as AuditContext["user"],
        userAgent: "ua",
        ipAddress: "127.0.0.1",
      };

      const result = await adminService.triggerCleanup(auditContext, true);

      expect(result.cleanedFiles).toContain("file1");
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("restore methods", () => {
    it("restores category", async () => {
      const mockStorage = {
        restoreCategory: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const result = await adminService.restoreCategory({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(mockStorage.restoreCategory).toHaveBeenCalledWith(1);
    });

    it("restores product", async () => {
      const mockStorage = {
        restoreProduct: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const result = await adminService.restoreProduct({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(mockStorage.restoreProduct).toHaveBeenCalledWith(1);
    });

    it("restores media asset", async () => {
      const mockStorage = {
        restoreMediaAsset: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      const result = await adminService.restoreMediaAsset({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(mockStorage.restoreMediaAsset).toHaveBeenCalledWith(1);
    });
  });

  describe("updateAuditConfig", () => {
    it("updates configuration and logs audit", async () => {
      const mockStorage = {
        setAuditTrailEnabled: vi.fn().mockResolvedValue(true),
        configureTrackedTables: vi.fn().mockResolvedValue(true),
        createAuditLog: vi.fn().mockResolvedValue({}),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as unknown as IStorage);

      await adminService.updateAuditConfig({} as unknown as AuditContext, {
        enabled: true,
        trackedTables: ["products"],
      });

      expect(mockStorage.setAuditTrailEnabled).toHaveBeenCalledWith(true);
      expect(mockStorage.configureTrackedTables).toHaveBeenCalledWith(["products"]);
      expect(mockStorage.createAuditLog).toHaveBeenCalled();
    });
  });
});
