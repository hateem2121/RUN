import { beforeEach, describe, expect, it, vi } from "vitest";
import { productRepository, systemRepository, mediaRepository, miscRepository } from "../../../lib/db/repositories/index.js";
import { adminService } from "../admin.service";
import type { AuditContext } from "../admin.service.js";

// Mock dependencies
vi.mock("../../../lib/db/repositories/index.js", () => ({
  productRepository: {
    getCategories: vi.fn(),
    getProductsIncludingDeleted: vi.fn(),
    getProductsCount: vi.fn(),
    updateCategory: vi.fn(),
    restoreCategory: vi.fn(),
    restoreProduct: vi.fn(),
  },
  systemRepository: {
    createAuditLog: vi.fn().mockResolvedValue({ id: "log-123" }),
    setAuditTrailEnabled: vi.fn(),
    configureTrackedTables: vi.fn(),
  },
  mediaRepository: {
    getMediaAssetsByIds: vi.fn(),
    getMediaAssets: vi.fn(),
    restoreMediaAsset: vi.fn(),
  },
  miscRepository: {
    getFabrics: vi.fn(),
  }
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
    vi.mocked(systemRepository.createAuditLog).mockResolvedValue({ id: "log-123" } as any);
  });

  describe("logAudit", () => {
    it("creates audit log with encrypted values", async () => {
      const auditData = {
        action: "UPDATE",
        tableName: "products",
        recordId: "1",
        user: { id: "user-1", claims: { email: "admin@test.com" } } as unknown as AuditContext["user"],
        ipAddress: "127.0.0.1",
      };

      await adminService.logAudit(auditData);

      expect(systemRepository.createAuditLog).toHaveBeenCalledWith(
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
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValue([{ id: 1, name: "Product 1", slug: "p1", isActive: true }] as any);
      vi.mocked(productRepository.getProductsCount).mockResolvedValue(1 as any);
      vi.mocked(productRepository.getCategories).mockResolvedValue([{ id: 1, name: "Cat 1" }] as any);
      vi.mocked(miscRepository.getFabrics).mockResolvedValue([] as any);
      vi.mocked(mediaRepository.getMediaAssetsByIds).mockResolvedValue([] as any);
      vi.mocked(mediaRepository.getMediaAssets).mockResolvedValue([] as any);

      const result = await adminService.getInitialProductsData(1, 10);

      expect(result.products).toHaveLength(1);
      expect((result.meta as any).totalProducts).toBe(1);
      expect(result.categories).toHaveLength(1);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("fixes corrupted media URLs in categories", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValue([
        {
          id: 1,
          name: "Cat 1",
          featuredContent: {
            card1: { mediaUrl: "/api/media/undefined/content" },
          },
        },
      ] as any);
      vi.mocked(productRepository.updateCategory).mockResolvedValue(true as any);

      const auditContext = {
        user: { id: "user-1" } as unknown as AuditContext["user"],
        userAgent: "ua",
        ipAddress: "127.0.0.1",
      };

      const result = await adminService.fixCorruptedMedia(auditContext);

      expect(result.fixedCount).toBe(1);
      expect(productRepository.updateCategory).toHaveBeenCalledWith(1, {
        featuredContent: {
          card1: { mediaUrl: "" },
        },
      });
    });
  });

  describe("triggerCleanup", () => {
    it("runs cleanup and logs audit", async () => {
      const auditContext = {
        user: { id: "user-1" } as unknown as AuditContext["user"],
        userAgent: "ua",
        ipAddress: "127.0.0.1",
      };

      const result = await adminService.triggerCleanup(auditContext, true);

      expect(result.cleanedFiles).toContain("file1");
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("restore methods", () => {
    it("restores category", async () => {
      vi.mocked(productRepository.restoreCategory).mockResolvedValue(true);

      const result = await adminService.restoreCategory({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(productRepository.restoreCategory).toHaveBeenCalledWith(1);
    });

    it("restores product", async () => {
      vi.mocked(productRepository.restoreProduct).mockResolvedValue(true);

      const result = await adminService.restoreProduct({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(productRepository.restoreProduct).toHaveBeenCalledWith(1);
    });

    it("restores media asset", async () => {
      vi.mocked(mediaRepository.restoreMediaAsset).mockResolvedValue(true);

      const result = await adminService.restoreMediaAsset({} as unknown as AuditContext, 1);
      expect(result).toBe(true);
      expect(mediaRepository.restoreMediaAsset).toHaveBeenCalledWith(1);
    });
  });

  describe("updateAuditConfig", () => {
    it("updates configuration and logs audit", async () => {
      vi.mocked(systemRepository.setAuditTrailEnabled).mockResolvedValue(true as any);
      vi.mocked(systemRepository.configureTrackedTables).mockResolvedValue(true as any);

      await adminService.updateAuditConfig({} as unknown as AuditContext, {
        enabled: true,
        trackedTables: ["products"],
      });

      expect(systemRepository.setAuditTrailEnabled).toHaveBeenCalledWith(true);
      expect(systemRepository.configureTrackedTables).toHaveBeenCalledWith(["products"]);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });
  });
});
