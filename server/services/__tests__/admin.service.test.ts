import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaRepository } from "../../lib/db/repositories/media-repository.js";
import type { MiscRepository } from "../../lib/db/repositories/misc-repository.js";
import type { ProductRepository } from "../../lib/db/repositories/product-repository.js";
import type { SystemRepository } from "../../lib/db/repositories/system-repository.js";
import type { SessionUser } from "../../types/session.js";
import { AdminService } from "../admin/admin.service.js";

// Mock Repositories Interface
const mockProductRepository = {
  getProductsIncludingDeleted: vi.fn(),
  getProductsCount: vi.fn(),
  getCategories: vi.fn(),
  updateCategory: vi.fn(),
  restoreCategory: vi.fn(),
  restoreProduct: vi.fn(),
};

const mockMiscRepository = {
  getFabrics: vi.fn(),
  getFibers: vi.fn(),
};

const mockMediaRepository = {
  getMediaAssetsByIds: vi.fn(),
  getMediaAssets: vi.fn(),
  restoreMediaAsset: vi.fn(),
};

const mockSystemRepository = {
  createAuditLog: vi.fn().mockResolvedValue({ id: 1 }),
  setAuditTrailEnabled: vi.fn(),
  configureTrackedTables: vi.fn(),
};

// Mock other dependencies
vi.mock("../../lib/encryption.js", () => ({
  encrypt: vi.fn((val) => `enc_${val}`),
  getBlindIndex: vi.fn((val) => `idx_${val}`),
}));

vi.mock("../../lib/integrations/storage-lifecycle-scheduler.js", () => ({
  getLifecycleScheduler: vi.fn(() => ({
    runCleanup: vi.fn().mockResolvedValue({
      cleanedFiles: ["file1.jpg"],
      orphanedFiles: [],
      spaceSaved: 1024,
    }),
  })),
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("../../lib/resilience/request-timeout.js", () => ({
  withTimeout: vi.fn((promise) => promise),
}));

describe("AdminService", () => {
  let adminService: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Inject mocks
    adminService = new AdminService(
      mockSystemRepository as unknown as SystemRepository,
      mockProductRepository as unknown as ProductRepository,
      mockMediaRepository as unknown as MediaRepository,
      mockMiscRepository as unknown as MiscRepository,
    );
  });

  const mockAuditContext = {
    user: { 
      id: "user-1", 
      email: "admin@example.com", 
      role: "admin",
      claims: { sub: "user-1", email: "admin@example.com" }
    } as unknown as SessionUser,
    userAgent: "Mozilla/5.0",
    ipAddress: "127.0.0.1",
  };

  describe("logAudit", () => {
    it("should encrypt sensitive data and call systemRepository", async () => {
      const auditData = {
        action: "UPDATE",
        tableName: "products",
        recordId: "123",
        user: { 
          id: "u1", 
          email: "test@example.com",
          claims: { sub: "u1", email: "test@example.com" }
        } as unknown as SessionUser,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      await adminService.logAudit(auditData);

      expect(mockSystemRepository.createAuditLog).toHaveBeenCalledWith(
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
    it("fetches products and metadata successfully", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Test Product",
          isActive: true,
          deletedAt: null,
          primaryImageId: 10,
          imageIds: [11],
        },
      ];

      vi.mocked(mockProductRepository.getProductsIncludingDeleted).mockResolvedValue(mockProducts);
      vi.mocked(mockProductRepository.getProductsCount).mockResolvedValue(1);
      vi.mocked(mockProductRepository.getCategories).mockResolvedValue([]);
      vi.mocked(mockMiscRepository.getFabrics).mockResolvedValue([]);
      vi.mocked(mockMediaRepository.getMediaAssetsByIds).mockResolvedValue([
        { id: 10, filename: "img10.jpg" },
        { id: 11, filename: "img11.jpg" },
      ]);
      vi.mocked(mockMediaRepository.getMediaAssets).mockResolvedValue([]);

      const result = await adminService.getInitialProductsData(1, 50);

      expect(result.products).toHaveLength(1);
      expect(result.mediaAssets).toHaveLength(2);
      expect(mockProductRepository.getProductsIncludingDeleted).toHaveBeenCalledWith(50, 0);
    });

    it("handles empty results gracefully", async () => {
      vi.mocked(mockProductRepository.getProductsIncludingDeleted).mockResolvedValue([]);
      vi.mocked(mockProductRepository.getProductsCount).mockResolvedValue(0);
      vi.mocked(mockProductRepository.getCategories).mockResolvedValue([]);
      vi.mocked(mockMiscRepository.getFabrics).mockResolvedValue([]);

      const result = await adminService.getInitialProductsData();

      expect(result.products).toHaveLength(0);
      expect(result.meta.totalProducts).toBe(0);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("identifies and fixes corrupted media URLs", async () => {
      const mockCategories = [
        {
          id: 1,
          name: "Category 1",
          featuredContent: {
            card1: { mediaUrl: "/api/media/undefined/content" },
          },
        },
      ];

      vi.mocked(mockProductRepository.getCategories).mockResolvedValue(mockCategories);
      vi.mocked(mockProductRepository.updateCategory).mockResolvedValue({
        id: 1,
      } as unknown as Category);

      const result = await adminService.fixCorruptedMedia(mockAuditContext);

      expect(result.fixedCount).toBe(1);
      expect(result.fixedCategories).toContain("Category 1");
      expect(mockProductRepository.updateCategory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          featuredContent: expect.objectContaining({
            card1: expect.objectContaining({ mediaUrl: "" }),
          }),
        }),
      );
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("skips categories without corruption", async () => {
      const mockCategories = [
        {
          id: 1,
          name: "Clean Category",
          featuredContent: {
            card1: { mediaUrl: "/api/media/123/content" },
          },
        },
      ];

      vi.mocked(mockProductRepository.getCategories).mockResolvedValue(mockCategories);

      const result = await adminService.fixCorruptedMedia(mockAuditContext);

      expect(result.fixedCount).toBe(0);
      expect(mockProductRepository.updateCategory).not.toHaveBeenCalled();
    });
  });

  describe("triggerCleanup", () => {
    it("triggers storage cleanup and logs audit", async () => {
      const result = await adminService.triggerCleanup(mockAuditContext, true);

      expect(result.cleanedFiles).toContain("file1.jpg");
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          recordId: "CLEANUP",
        }),
      );
    });
  });

  describe("updateAuditConfig", () => {
    it("updates configuration and logs audit", async () => {
      const config = { enabled: true, trackedTables: ["users"] };

      await adminService.updateAuditConfig(mockAuditContext, config);

      expect(mockSystemRepository.setAuditTrailEnabled).toHaveBeenCalledWith(true);
      expect(mockSystemRepository.configureTrackedTables).toHaveBeenCalledWith(["users"]);
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          tableName: "audit_configuration",
          recordId: "CONFIG",
        }),
      );
    });
  });

  describe("restore methods", () => {
    it("restores category", async () => {
      vi.mocked(mockProductRepository.restoreCategory).mockResolvedValue(true);

      const result = await adminService.restoreCategory(mockAuditContext, 1);

      expect(result).toBe(true);
      expect(mockProductRepository.restoreCategory).toHaveBeenCalledWith(1);
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESTORE",
          tableName: "categories",
          recordId: "1",
        }),
      );
    });

    it("restores product", async () => {
      vi.mocked(mockProductRepository.restoreProduct).mockResolvedValue(true);

      const result = await adminService.restoreProduct(mockAuditContext, 1);

      expect(result).toBe(true);
      expect(mockProductRepository.restoreProduct).toHaveBeenCalledWith(1);
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("restores media asset", async () => {
      vi.mocked(mockMediaRepository.restoreMediaAsset).mockResolvedValue(true);

      const result = await adminService.restoreMediaAsset(mockAuditContext, 1);

      expect(result).toBe(true);
      expect(mockMediaRepository.restoreMediaAsset).toHaveBeenCalledWith(1);
      expect(mockSystemRepository.createAuditLog).toHaveBeenCalled();
    });
  });
});
