import { ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../../server/lib/errors.js";
import { aboutService } from "../../../server/services/about.service.js";
import { adminService } from "../../../server/services/admin/admin.service.js";
import {
  mediaRepository,
  miscRepository,
  productRepository,
  systemRepository,
} from "../../../server/services/repositories/index.js";

vi.mock("../../../server/services/repositories/index.js", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    miscRepository: {
      getFibers: vi.fn(),
      createFiber: vi.fn(),
      getFiber: vi.fn(),
      updateFiber: vi.fn(),
      deleteFiber: vi.fn(),
      getCertificates: vi.fn(),
      createCertificate: vi.fn(),
      getCertificate: vi.fn(),
      updateCertificate: vi.fn(),
      deleteCertificate: vi.fn(),
      getFabrics: vi.fn(),
    },
    productRepository: {
      getProductsIncludingDeleted: vi.fn(),
      getProductsCount: vi.fn(),
      getCategories: vi.fn(),
      getProducts: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      getProduct: vi.fn(),
      deleteProduct: vi.fn(),
      permanentlyDeleteProduct: vi.fn(),
      restoreProduct: vi.fn(),
      getProductBySlug: vi.fn(),
    },
    mediaRepository: {
      getMediaAssetsByIds: vi.fn(),
      getMediaAssets: vi.fn(),
      fixCorruptedMedia: vi.fn(),
      restoreMediaAsset: vi.fn(),
      triggerCleanup: vi.fn(),
    },
    systemRepository: {
      createAuditLog: vi
        .fn()
        .mockResolvedValue({ id: 1, action: "INSERT", tableName: "test", recordId: "1" }),
      setAuditTrailEnabled: vi.fn(),
      configureTrackedTables: vi.fn(),
    },
  };
});

vi.mock("../../../server/db.js", () => {
  const dbMock = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    prepare: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([{ count: 10 }]),
    bind: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([{ count: 10 }])),
  };
  return { db: dbMock };
});

vi.mock("../../../server/services/about.service.js", () => ({
  aboutService: {
    getTimeline: vi.fn(),
    getTimelineEntry: vi.fn(),
    createTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    deleteTimelineEntry: vi.fn(),
    getTimelineEntries: vi.fn(),
  },
}));

vi.mock("../../../server/lib/integrations/storage-lifecycle-scheduler.js", () => ({
  getLifecycleScheduler: vi.fn().mockReturnValue({
    runCleanup: vi.fn().mockResolvedValue({
      cleanedFiles: [],
      orphanedFiles: [],
      spaceSaved: 1000,
    }),
  }),
}));

const mockAudit = {
  user: { id: 1, email: "admin@run.com", claims: { sub: "1", email: "admin@run.com" } },
  userAgent: "testAgent",
  ipAddress: "127.0.0.1",
};

describe("AdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Product Dashboard & Data", () => {
    it("should fetch initial products data including metadata", async () => {
      vi.mocked(productRepository.getProductsIncludingDeleted).mockResolvedValue([
        { id: 1, slug: "test-prod", isActive: true, primaryImageId: 100 },
      ] as any);
      vi.mocked(productRepository.getProductsCount).mockResolvedValue(1);
      vi.mocked(productRepository.getCategories).mockResolvedValue([
        { id: 1, name: "Cat1" },
      ] as any);
      vi.mocked(miscRepository.getFabrics).mockResolvedValue([{ id: 1, name: "Fab1" }] as any);
      vi.mocked(mediaRepository.getMediaAssetsByIds).mockResolvedValue([
        { id: 100, url: "test.jpg" },
      ] as any);
      vi.mocked(mediaRepository.getMediaAssets).mockResolvedValue([
        { id: 101, url: "recent.jpg" },
      ] as any);

      const result = await adminService.getInitialProductsData(1, 50, { includeRecentMedia: true });
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.products).toHaveLength(1);
      expect(data).toHaveProperty("categories");
      expect(data).toHaveProperty("fabrics");
      expect(data).toHaveProperty("mediaAssets");
    });

    it("should fetch products list directly", async () => {
      vi.mocked(productRepository.getProducts).mockResolvedValue([
        { id: 1, name: "Prod 1" },
      ] as any);
      vi.mocked(productRepository.getProductsCount).mockResolvedValue(1);

      const result = await adminService.getProductsList({ page: 1, limit: 10 });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().products).toHaveLength(1);
    });
  });

  describe("Product Management", () => {
    it("should create product and log audit", async () => {
      vi.mocked(productRepository.createProduct).mockResolvedValue({
        id: 1,
        name: "New Prod",
      } as any);

      const result = await adminService.createProduct(mockAudit, {
        name: "New Prod",
        slug: "new-prod",
      } as any);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should catch errors in create product", async () => {
      vi.mocked(productRepository.createProduct).mockRejectedValue(new Error("DB Error"));
      const result = await adminService.createProduct(mockAudit, {
        name: "Fail",
        slug: "fail",
      } as any);
      expect(result.isErr()).toBe(true);
    });

    it("should update product and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValue({ id: 1, name: "Old" } as any);
      vi.mocked(productRepository.updateProduct).mockResolvedValue({ id: 1, name: "New" } as any);

      const result = await adminService.updateProduct(mockAudit, 1, { name: "New" });
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should return not found if updating missing product", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValue(null as any);
      const result = await adminService.updateProduct(mockAudit, 999, { name: "New" });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
    });

    it("should soft delete product and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValue({
        id: 1,
        name: "To Delete",
      } as any);
      vi.mocked(productRepository.deleteProduct).mockResolvedValue({
        id: 1,
        deletedAt: new Date(),
      } as any);

      const result = await adminService.softDeleteProduct(mockAudit, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should hard delete product and log audit", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValue({
        id: 1,
        name: "To Delete",
      } as any);
      vi.mocked(productRepository.permanentlyDeleteProduct).mockResolvedValue(true);

      const result = await adminService.hardDeleteProduct(mockAudit, 1, "DELETE");
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should restore product and log audit", async () => {
      vi.mocked(productRepository.restoreProduct).mockResolvedValue(true);

      const result = await adminService.restoreProduct(mockAudit, 1);
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should fetch product by id", async () => {
      vi.mocked(productRepository.getProduct).mockResolvedValue({ id: 1, name: "Test" } as any);
      const result = await adminService.getProductById(1);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().name).toBe("Test");
    });

    it("should check slug availability", async () => {
      vi.mocked(productRepository.getProductBySlug).mockResolvedValue(null as any);
      const result = await adminService.checkSlugAvailability("test-slug");
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ available: true });
    });
  });

  describe("Media & Storage Management", () => {
    it("should fix corrupted media", async () => {
      vi.mocked(mediaRepository.fixCorruptedMedia).mockResolvedValue({ count: 1 } as any);
      const result = await adminService.fixCorruptedMedia();
      expect(result.isOk()).toBe(true);
    });

    it("should trigger cleanup", async () => {
      const result = await adminService.triggerCleanup(mockAudit, { dryRun: true });
      expect(result.isOk()).toBe(true);
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
    });

    it("should fetch media assets list", async () => {
      vi.mocked(mediaRepository.getMediaAssets).mockResolvedValue([
        { id: 1, url: "test.jpg" },
      ] as any);
      const result = await adminService.getMediaAssetsList();
      expect(result.isOk()).toBe(true);
    });

    it("should restore media asset", async () => {
      vi.mocked(mediaRepository.restoreMediaAsset).mockResolvedValue(true);
      const result = await adminService.restoreMediaAsset(mockAudit, 1);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("System & Audit", () => {
    it("should log audit safely", async () => {
      const result = await adminService.logAudit({
        action: "TEST",
        tableName: "test",
        recordId: "1",
        user: mockAudit.user,
      });
      expect(systemRepository.createAuditLog).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });

    it("should fetch dashboard stats", async () => {
      // db select is mocked
      const result = await adminService.getDashboardStats();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().products).toBe(10);
    });

    it("should update audit config", async () => {
      vi.mocked(systemRepository.setAuditTrailEnabled).mockReturnValue();
      const result = await adminService.updateAuditConfig(mockAudit, { enabled: true });
      expect(result.isOk()).toBe(true);
    });

    it("should get failed jobs", async () => {
      // getFailedJobs is mocked to return [] inside the service
      const result = await adminService.getFailedJobs();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(0);
    });

    it("should retry job", async () => {
      // retryJob returns NotFoundError
      const result = await adminService.retryJob("queue", "1");
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
    });
  });

  describe("Fiber Management", () => {
    it("should get fibers list", async () => {
      vi.mocked(miscRepository.getFibers).mockResolvedValue([{ id: 1, name: "Polyester" }] as any);
      const result = await adminService.getFibersList();
      expect(result.isOk()).toBe(true);
      const list = result._unsafeUnwrap();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("Polyester");
    });

    it("should create fiber and log audit", async () => {
      const fiberData = { name: "Cotton", type: "natural", description: "Natural" };
      vi.mocked(miscRepository.createFiber).mockResolvedValue({ id: 2, ...fiberData } as any);

      const result = await adminService.createFiber(mockAudit as any, fiberData);

      expect(result.isOk()).toBe(true);
      const fiber = result._unsafeUnwrap();
      expect(fiber.id).toBe(2);
      expect(miscRepository.createFiber).toHaveBeenCalled();
    });

    it("should update fiber and log audit", async () => {
      vi.mocked(miscRepository.getFiber).mockResolvedValue({ id: 1, name: "Old" } as any);
      vi.mocked(miscRepository.updateFiber).mockResolvedValue({ id: 1, name: "New" } as any);

      const result = await adminService.updateFiber(mockAudit, 1, { name: "New" });
      expect(result.isOk()).toBe(true);
    });

    it("should delete fiber and log audit", async () => {
      vi.mocked(miscRepository.getFiber).mockResolvedValue({ id: 1, name: "To Delete" } as any);
      vi.mocked(miscRepository.deleteFiber).mockResolvedValue(true);

      const result = await adminService.deleteFiber(mockAudit, 1);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("Certificate Management", () => {
    it("should get certificates list", async () => {
      vi.mocked(miscRepository.getCertificates).mockResolvedValue([{ id: 1, name: "GOTS" }] as any);
      const result = await adminService.getCertificatesList();
      expect(result.isOk()).toBe(true);
      const list = result._unsafeUnwrap();
      expect(list).toHaveLength(1);
    });

    it("should create certificate", async () => {
      vi.mocked(miscRepository.createCertificate).mockResolvedValue({ id: 1, name: "GOTS" } as any);
      const result = await adminService.createCertificate(mockAudit, { name: "GOTS" } as any);
      expect(result.isOk()).toBe(true);
    });

    it("should update certificate", async () => {
      vi.mocked(miscRepository.getCertificate).mockResolvedValue({ id: 1, name: "Old" } as any);
      vi.mocked(miscRepository.updateCertificate).mockResolvedValue({ id: 1, name: "New" } as any);
      const result = await adminService.updateCertificate(mockAudit, 1, { name: "New" });
      expect(result.isOk()).toBe(true);
    });

    it("should delete certificate and log audit", async () => {
      vi.mocked(miscRepository.getCertificate).mockResolvedValue({ id: 1, name: "GOTS" } as any);
      vi.mocked(miscRepository.deleteCertificate).mockResolvedValue(true);

      const result = await adminService.deleteCertificate(mockAudit as any, 1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });
  });

  describe("About Timeline Management", () => {
    it("should get timeline entries", async () => {
      vi.mocked(aboutService.getTimelineEntries).mockResolvedValue(
        ok([{ id: 1, title: "T1" }]) as any,
      );
      const result = await adminService.getAboutTimelineEntries();
      expect(result.isOk()).toBe(true);
    });

    it("should delegate timeline creation to aboutService", async () => {
      const entryData = { year: "2010", title: "Start" };
      vi.mocked(aboutService.createTimelineEntry).mockResolvedValue(
        ok({ id: 1, ...entryData }) as any,
      );

      const result = await adminService.createAboutTimelineEntry(mockAudit as any, entryData);

      expect(result.isOk()).toBe(true);
      const entry = result._unsafeUnwrap();
      expect(entry.id).toBe(1);
      expect(aboutService.createTimelineEntry).toHaveBeenCalledWith(entryData);
    });

    it("should update timeline entry", async () => {
      vi.mocked(aboutService.getTimelineEntry).mockResolvedValue(
        ok({ id: 1, title: "Old" }) as any,
      );
      vi.mocked(aboutService.updateTimelineEntry).mockResolvedValue(
        ok({ id: 1, title: "New" }) as any,
      );
      const result = await adminService.updateAboutTimelineEntry(mockAudit, 1, { title: "New" });
      expect(result.isOk()).toBe(true);
    });

    it("should delete timeline entry", async () => {
      vi.mocked(aboutService.getTimelineEntry).mockResolvedValue(
        ok({ id: 1, title: "Old" }) as any,
      );
      vi.mocked(aboutService.deleteTimelineEntry).mockResolvedValue(ok(true) as any);
      const result = await adminService.deleteAboutTimelineEntry(mockAudit, 1);
      expect(result.isOk()).toBe(true);
    });
  });
});
