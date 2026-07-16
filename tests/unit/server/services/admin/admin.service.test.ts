import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue([{ count: 10 }]),
  },
}));

vi.mock("../../../../../server/lib/encryption.js", () => ({
  encrypt: vi.fn((val) => `encrypted_${val}`),
  getBlindIndex: vi.fn((val) => `blind_${val}`),
}));

const mockScheduler = {
  runCleanup: vi.fn().mockResolvedValue({ cleanedFiles: [], orphanedFiles: [], spaceSaved: 100 }),
};
vi.mock("../../../../../server/lib/integrations/storage-lifecycle-scheduler.js", () => ({
  getLifecycleScheduler: vi.fn(() => mockScheduler),
}));

vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/resilience/circuit-breaker.js", () => ({
  DB_CIRCUIT_OPTIONS: {},
  withCircuit: vi.fn(async (_name, fn) => fn()),
}));

vi.mock("../../../../../server/lib/resilience/request-timeout.js", () => ({
  withTimeout: vi.fn(async (fn) => fn),
}));

vi.mock("../../../../../server/services/about.service.js", () => ({
  aboutService: {
    getTimelineEntries: vi.fn(),
    createTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    deleteTimelineEntry: vi.fn(),
    getTimelineEntry: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/repositories/index.js", () => ({
  systemRepository: {
    createAuditLog: vi.fn().mockResolvedValue(true),
    setAuditTrailEnabled: vi.fn(),
    configureTrackedTables: vi.fn(),
  },
  productRepository: {
    getCategories: vi.fn().mockResolvedValue([]),
    getProductsIncludingDeleted: vi.fn().mockResolvedValue([]),
    getProductsCount: vi.fn().mockResolvedValue(0),
    createProduct: vi.fn().mockResolvedValue({ id: 1, name: "Prod" }),
    getProduct: vi.fn(),
    updateProduct: vi.fn().mockResolvedValue({ id: 1, name: "Prod Updated" }),
    updateCategory: vi.fn().mockResolvedValue(true),
    restoreCategory: vi.fn().mockResolvedValue(true),
    restoreProduct: vi.fn().mockResolvedValue(true),
    deleteProduct: vi.fn().mockResolvedValue(true),
    permanentlyDeleteProduct: vi.fn().mockResolvedValue(true),
    getProductBySlug: vi.fn(),
  },
  mediaRepository: {
    getMediaAssetsByIds: vi.fn().mockResolvedValue([]),
    getMediaAssets: vi.fn().mockResolvedValue([]),
    restoreMediaAsset: vi.fn().mockResolvedValue(true),
  },
  miscRepository: {
    getFabrics: vi.fn().mockResolvedValue([]),
    getCertificates: vi.fn().mockResolvedValue([]),
    createCertificate: vi.fn().mockResolvedValue({ id: 1 }),
    getCertificate: vi.fn(),
    updateCertificate: vi.fn().mockResolvedValue({ id: 1 }),
    deleteCertificate: vi.fn().mockResolvedValue(true),
    getFibers: vi.fn().mockResolvedValue([]),
    createFiber: vi.fn().mockResolvedValue({ id: 1 }),
    getFiber: vi.fn(),
    updateFiber: vi.fn().mockResolvedValue({ id: 1 }),
    deleteFiber: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("@run-remix/shared", () => ({
  insertCertificateSchema: { parse: vi.fn((data) => data) },
  insertFiberSchema: { parse: vi.fn((data) => data) },
  insertAboutTimelineEntrySchema: { parse: vi.fn((data) => data) },
  products: "products_table",
  categories: "categories_table",
  mediaAssets: "media_assets_table",
  fabrics: "fabrics_table",
  fibers: "fibers_table",
  certificates: "certificates_table",
  sizeCharts: "size_charts_table",
  accessories: "accessories_table",
  navigationItems: "navigation_items_table",
  inquiries: "inquiries_table",
}));

vi.mock("../../../../../server/lib/utilities/slug-utils.js", () => ({
  normalizeSlug: vi.fn((s) => s.toLowerCase().replace(/\s+/g, "-")),
}));

import { err, ok } from "neverthrow";
import { db } from "../../../../../server/db.js";
import { InternalError, NotFoundError } from "../../../../../server/lib/errors.js";
import { getLifecycleScheduler } from "../../../../../server/lib/integrations/storage-lifecycle-scheduler.js";
import { aboutService } from "../../../../../server/services/about.service.js";
import { adminService } from "../../../../../server/services/admin/admin.service.js";
import {
  mediaRepository,
  miscRepository,
  productRepository,
  systemRepository,
} from "../../../../../server/services/repositories/index.js";

describe("AdminService", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockAuditContext = {
    user: { id: 1, claims: { sub: "123", email: "test@test.com" } } as any,
    userAgent: "test-agent",
    ipAddress: "127.0.0.1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logAudit", () => {
    it("should log audit successfully", async () => {
      await adminService.logAudit({
        action: "TEST",
        tableName: "test_table",
        recordId: "1",
        ...mockAuditContext,
      });
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should log audit without optional fields", async () => {
      await adminService.logAudit({
        action: "TEST",
        tableName: "test_table",
        recordId: "1",
      });
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("getInitialProductsData", () => {
    it("should return initial products data on success", async () => {
      // Mock data
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([
        { id: 1, isActive: true, primaryImageId: 10, imageIds: [11, "invalid"] } as any,
        { id: 2, isActive: false, deletedAt: new Date() } as any, // Should be filtered out
      ]);
      vi.mocked(productRepository.getProductsCount).mockResolvedValueOnce(1);
      vi.mocked(productRepository.getCategories).mockResolvedValueOnce([{ id: 1 }] as any);
      vi.mocked(miscRepository.getFabrics).mockResolvedValueOnce([{ id: 1 }] as any);
      vi.mocked(mediaRepository.getMediaAssetsByIds).mockResolvedValueOnce([
        { id: 10, filename: "f1" } as any,
        { id: 11, filename: "f2" } as any,
      ]);

      const result = await adminService.getInitialProductsData(1, 50, { includeRecentMedia: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.products.length).toBe(1);
        expect(result.value.mediaAssets.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should skip metadata when skipMetadata is true", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([]);
      vi.mocked(productRepository.getProductsCount).mockResolvedValueOnce(0);
      const result = await adminService.getInitialProductsData(1, 50, { skipMetadata: true });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.categories).toEqual([]);
        expect(result.value.fabrics).toEqual([]);
      }
    });

    it("should handle repository failure and return error", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockRejectedValueOnce(
        new Error("DB error"),
      );
      const result = await adminService.getInitialProductsData();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InternalError);
      }
    });

    it("should return AppError if thrown", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockRejectedValueOnce(
        new NotFoundError("Missing"),
      );
      const result = await adminService.getInitialProductsData();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("getProductsList", () => {
    it("should filter and return products list on success", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([
        { id: 1, name: "Shirt", sku: "S-01", categoryId: 1, isActive: true } as any,
        { id: 2, name: "Pant", sku: "P-01", categoryId: 2, isFeatured: true } as any,
        { id: 3, name: "Deleted", sku: "D-01", deletedAt: new Date() } as any,
        { id: 4, name: "Draft", sku: "DR-01", isActive: false } as any,
      ]);

      const result = await adminService.getProductsList({
        page: 1,
        limit: 50,
        search: "shirt",
        categoryId: "1",
        status: "active",
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.products.length).toBe(1);
      }

      // test other statuses
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([
        { id: 1, name: "Shirt", sku: "S-01", categoryId: 1, isActive: true } as any,
        { id: 2, name: "Pant", sku: "P-01", categoryId: 2, isFeatured: true } as any,
        { id: 3, name: "Deleted", sku: "D-01", deletedAt: new Date() } as any,
        { id: 4, name: "Draft", sku: "DR-01", isActive: false } as any,
      ]);
      const resFeatured = await adminService.getProductsList({
        page: 1,
        limit: 50,
        status: "featured",
      });
      expect(resFeatured.isOk()).toBe(true);

      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([
        { id: 3, name: "Deleted", sku: "D-01", deletedAt: new Date() } as any,
      ]);
      const resDeleted = await adminService.getProductsList({
        page: 1,
        limit: 50,
        status: "deleted",
      });
      expect(resDeleted.isOk()).toBe(true);

      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValueOnce([
        { id: 4, name: "Draft", sku: "DR-01", isActive: false } as any,
      ]);
      const resDraft = await adminService.getProductsList({ page: 1, limit: 50, status: "draft" });
      expect(resDraft.isOk()).toBe(true);
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockRejectedValueOnce(
        new Error("fail"),
      );
      const result = await adminService.getProductsList({ page: 1, limit: 50 });
      expect(result.isErr()).toBe(true);
    });
  });

  describe("createProduct", () => {
    it("should create product and log audit", async () => {
      const result = await adminService.createProduct(mockAuditContext, {} as any);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.createProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.createProduct(mockAuditContext, {} as any);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("updateProduct", () => {
    it("should update product and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.updateProduct(mockAuditContext, 1, {});
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should return error if product not found", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce(undefined);
      const result = await adminService.updateProduct(mockAuditContext, 1, {});
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should handle db failures", async () => {
      vi.mocked(productRepository.getProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.updateProduct(mockAuditContext, 1, {});
      expect(result.isErr()).toBe(true);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("should fix corrupted media and log audit", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValueOnce([
        {
          id: 1,
          name: "C1",
          featuredContent: {
            card1: { mediaUrl: "undefined" },
            card2: { mediaUrl: "/api/media/undefined/content" },
            card3: { mediaUrl: "good-url" },
          },
        } as any,
        {
          id: 2,
          name: "C2",
          featuredContent: null,
        } as any,
      ]);

      const result = await adminService.fixCorruptedMedia(mockAuditContext);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.fixedCount).toBe(1);
      }
      expect(productRepository.updateCategory).toHaveBeenCalled();
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should do nothing if no corrupted media", async () => {
      vi.mocked(productRepository.getCategories).mockResolvedValueOnce([
        { id: 1, name: "C1", featuredContent: { card1: { mediaUrl: "good" } } } as any,
      ]);
      const result = await adminService.fixCorruptedMedia(mockAuditContext);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.fixedCount).toBe(0);
      }
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getCategories).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.fixCorruptedMedia(mockAuditContext);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("triggerCleanup", () => {
    it("should trigger cleanup and log audit", async () => {
      const result = await adminService.triggerCleanup(mockAuditContext, true);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      const scheduler = getLifecycleScheduler();
      vi.mocked(scheduler.runCleanup).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.triggerCleanup(mockAuditContext, true);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("updateAuditConfig", () => {
    it("should update audit config and log audit", async () => {
      const result = await adminService.updateAuditConfig(mockAuditContext, {
        enabled: true,
        trackedTables: ["users"],
      });
      expect(result.isOk()).toBe(true);
      expect(systemRepository.setAuditTrailEnabled).toHaveBeenCalledWith(true);
      expect(systemRepository.configureTrackedTables).toHaveBeenCalledWith(["users"]);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      vi.mocked(systemRepository.setAuditTrailEnabled).mockImplementationOnce(() => {
        throw new Error("fail");
      });
      const result = await adminService.updateAuditConfig(mockAuditContext, { enabled: true });
      expect(result.isErr()).toBe(true);
    });
  });

  describe("restoreCategory", () => {
    it("should restore category and log audit", async () => {
      const result = await adminService.restoreCategory(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.restoreCategory).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.restoreCategory(mockAuditContext, 1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("restoreProduct", () => {
    it("should restore product and log audit", async () => {
      const result = await adminService.restoreProduct(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.restoreProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.restoreProduct(mockAuditContext, 1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("restoreMediaAsset", () => {
    it("should restore media asset and log audit", async () => {
      const result = await adminService.restoreMediaAsset(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should handle failures", async () => {
      vi.mocked(mediaRepository.restoreMediaAsset).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.restoreMediaAsset(mockAuditContext, 1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getDashboardStats", () => {
    it("should return dashboard stats", async () => {
      const result = await adminService.getDashboardStats();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.products).toBe(10);
      }
    });

    it("should handle failures", async () => {
      vi.mocked(db.select).mockImplementationOnce(() => {
        throw new Error("fail");
      });
      const result = await adminService.getDashboardStats();
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getProductById", () => {
    it("should return product", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.getProductById(1);
      expect(result.isOk()).toBe(true);
    });

    it("should throw NotFoundError if not found", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce(undefined);
      const result = await adminService.getProductById(1);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.getProductById(1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("softDeleteProduct", () => {
    it("should soft delete and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce({ id: 1, name: "A" } as any);
      const result = await adminService.softDeleteProduct(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should error if product not found", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce(undefined);
      const result = await adminService.softDeleteProduct(mockAuditContext, 1);
      expect(result.isErr()).toBe(true);
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.softDeleteProduct(mockAuditContext, 1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getMediaAssetsList", () => {
    it("should return assets", async () => {
      vi.mocked(mediaRepository.getMediaAssets).mockResolvedValueOnce([]);
      const result = await adminService.getMediaAssetsList();
      expect(result.isOk()).toBe(true);
    });

    it("should handle failures", async () => {
      vi.mocked(mediaRepository.getMediaAssets).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.getMediaAssetsList();
      expect(result.isErr()).toBe(true);
    });
  });

  describe("hardDeleteProduct", () => {
    it("should hard delete and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce({ id: 1, name: "A" } as any);
      const result = await adminService.hardDeleteProduct(mockAuditContext, 1, "DELETE");
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should error if confirm is wrong", async () => {
      const result = await adminService.hardDeleteProduct(mockAuditContext, 1, "WRONG");
      expect(result.isErr()).toBe(true);
    });

    it("should error if product not found", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValueOnce(undefined);
      const result = await adminService.hardDeleteProduct(mockAuditContext, 1, "DELETE");
      expect(result.isErr()).toBe(true);
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getProduct).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.hardDeleteProduct(mockAuditContext, 1, "DELETE");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("checkSlugAvailability", () => {
    it("should return available if slug not found", async () => {
      vi.mocked(productRepository.getProductBySlug).mockResolvedValueOnce(undefined);
      const result = await adminService.checkSlugAvailability("test-slug");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.available).toBe(true);
    });

    it("should return available if slug belongs to excluded id", async () => {
      vi.mocked(productRepository.getProductBySlug).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.checkSlugAvailability("test-slug", 1);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.available).toBe(true);
    });

    it("should return false if slug belongs to another id", async () => {
      vi.mocked(productRepository.getProductBySlug).mockResolvedValueOnce({ id: 2 } as any);
      const result = await adminService.checkSlugAvailability("test-slug", 1);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.available).toBe(false);
    });

    it("should handle failures", async () => {
      vi.mocked(productRepository.getProductBySlug).mockRejectedValueOnce(new Error("fail"));
      const result = await adminService.checkSlugAvailability("test-slug");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("Certificates", () => {
    it("getCertificatesList", async () => {
      const result = await adminService.getCertificatesList();
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getCertificates).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.getCertificatesList();
      expect(resErr.isErr()).toBe(true);
    });

    it("createCertificate", async () => {
      const result = await adminService.createCertificate(mockAuditContext, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.createCertificate).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.createCertificate(mockAuditContext, {});
      expect(resErr.isErr()).toBe(true);
    });

    it("updateCertificate", async () => {
      vi.mocked(miscRepository.getCertificate).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.updateCertificate(mockAuditContext, 1, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getCertificate).mockResolvedValueOnce(undefined);
      const resErrNotFound = await adminService.updateCertificate(mockAuditContext, 1, {});
      expect(resErrNotFound.isErr()).toBe(true);

      vi.mocked(miscRepository.getCertificate).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.updateCertificate(mockAuditContext, 1, {});
      expect(resErr.isErr()).toBe(true);
    });

    it("deleteCertificate", async () => {
      vi.mocked(miscRepository.getCertificate).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.deleteCertificate(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getCertificate).mockResolvedValueOnce(undefined);
      const resErrNotFound = await adminService.deleteCertificate(mockAuditContext, 1);
      expect(resErrNotFound.isErr()).toBe(true);

      vi.mocked(miscRepository.getCertificate).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.deleteCertificate(mockAuditContext, 1);
      expect(resErr.isErr()).toBe(true);
    });
  });

  describe("Fibers", () => {
    it("getFibersList", async () => {
      const result = await adminService.getFibersList();
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getFibers).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.getFibersList();
      expect(resErr.isErr()).toBe(true);
    });

    it("createFiber", async () => {
      const result = await adminService.createFiber(mockAuditContext, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.createFiber).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.createFiber(mockAuditContext, {});
      expect(resErr.isErr()).toBe(true);
    });

    it("updateFiber", async () => {
      vi.mocked(miscRepository.getFiber).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.updateFiber(mockAuditContext, 1, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getFiber).mockResolvedValueOnce(undefined);
      const resErrNotFound = await adminService.updateFiber(mockAuditContext, 1, {});
      expect(resErrNotFound.isErr()).toBe(true);

      vi.mocked(miscRepository.getFiber).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.updateFiber(mockAuditContext, 1, {});
      expect(resErr.isErr()).toBe(true);
    });

    it("deleteFiber", async () => {
      vi.mocked(miscRepository.getFiber).mockResolvedValueOnce({ id: 1 } as any);
      const result = await adminService.deleteFiber(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);

      vi.mocked(miscRepository.getFiber).mockResolvedValueOnce(undefined);
      const resErrNotFound = await adminService.deleteFiber(mockAuditContext, 1);
      expect(resErrNotFound.isErr()).toBe(true);

      vi.mocked(miscRepository.getFiber).mockRejectedValueOnce(new Error("fail"));
      const resErr = await adminService.deleteFiber(mockAuditContext, 1);
      expect(resErr.isErr()).toBe(true);
    });
  });

  describe("AboutTimeline", () => {
    it("getAboutTimelineEntries", async () => {
      vi.mocked(aboutService.getTimelineEntries).mockResolvedValueOnce(ok([]));
      const result = await adminService.getAboutTimelineEntries();
      expect(result.isOk()).toBe(true);
    });

    it("createAboutTimelineEntry", async () => {
      vi.mocked(aboutService.createTimelineEntry).mockResolvedValueOnce(ok({ id: 1 } as any));
      const result = await adminService.createAboutTimelineEntry(mockAuditContext, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(aboutService.createTimelineEntry).mockResolvedValueOnce(
        err(new InternalError("fail")),
      );
      const resErr = await adminService.createAboutTimelineEntry(mockAuditContext, {});
      expect(resErr.isErr()).toBe(true);

      vi.mocked(aboutService.createTimelineEntry).mockRejectedValueOnce(new Error("fail"));
      const resErr2 = await adminService.createAboutTimelineEntry(mockAuditContext, {});
      expect(resErr2.isErr()).toBe(true);
    });

    it("updateAboutTimelineEntry", async () => {
      vi.mocked(aboutService.getTimelineEntry).mockResolvedValueOnce(ok({ id: 1 } as any));
      vi.mocked(aboutService.updateTimelineEntry).mockResolvedValueOnce(ok({ id: 1 } as any));
      const result = await adminService.updateAboutTimelineEntry(mockAuditContext, 1, {});
      expect(result.isOk()).toBe(true);

      vi.mocked(aboutService.getTimelineEntry).mockResolvedValueOnce(
        err(new NotFoundError("fail")),
      );
      const resErr1 = await adminService.updateAboutTimelineEntry(mockAuditContext, 1, {});
      expect(resErr1.isErr()).toBe(true);

      vi.mocked(aboutService.getTimelineEntry).mockResolvedValueOnce(ok({ id: 1 } as any));
      vi.mocked(aboutService.updateTimelineEntry).mockResolvedValueOnce(
        err(new InternalError("fail")),
      );
      const resErr2 = await adminService.updateAboutTimelineEntry(mockAuditContext, 1, {});
      expect(resErr2.isErr()).toBe(true);

      vi.mocked(aboutService.getTimelineEntry).mockRejectedValueOnce(new Error("fail"));
      const resErr3 = await adminService.updateAboutTimelineEntry(mockAuditContext, 1, {});
      expect(resErr3.isErr()).toBe(true);
    });

    it("deleteAboutTimelineEntry", async () => {
      vi.mocked(aboutService.getTimelineEntry).mockResolvedValueOnce(ok({ id: 1 } as any));
      vi.mocked(aboutService.deleteTimelineEntry).mockResolvedValueOnce(ok(true));
      const result = await adminService.deleteAboutTimelineEntry(mockAuditContext, 1);
      expect(result.isOk()).toBe(true);

      vi.mocked(aboutService.getTimelineEntry).mockResolvedValueOnce(err(new NotFoundError("")));
      vi.mocked(aboutService.deleteTimelineEntry).mockResolvedValueOnce(
        err(new InternalError("fail")),
      );
      const resErr = await adminService.deleteAboutTimelineEntry(mockAuditContext, 1);
      expect(resErr.isErr()).toBe(true);

      vi.mocked(aboutService.getTimelineEntry).mockRejectedValueOnce(new Error("fail"));
      const resErr2 = await adminService.deleteAboutTimelineEntry(mockAuditContext, 1);
      expect(resErr2.isErr()).toBe(true);
    });
  });

  describe("Jobs", () => {
    it("getFailedJobs", async () => {
      const result = await adminService.getFailedJobs();
      expect(result.isOk()).toBe(true);
    });

    it("retryJob", async () => {
      const result = await adminService.retryJob("queue", "1");
      expect(result.isErr()).toBe(true);
    });
  });
});
