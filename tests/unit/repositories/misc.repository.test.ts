import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { MiscRepository } from "../../../server/services/repositories/misc-repository.js";

const { mockUnifiedCache } = vi.hoisted(() => ({
  mockUnifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delete: vi.fn(),
    clearPattern: vi.fn(),
  },
}));

const { mockDbCircuitBreaker } = vi.hoisted(() => ({
  mockDbCircuitBreaker: {
    execute: vi.fn(async (fn) => fn()),
  },
}));

vi.mock("../../../server/db.js", () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    rightJoin: vi.fn().mockReturnThis(),
    fullJoin: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    and: vi.fn(),
    eq: vi.fn(),
    isNull: vi.fn(),
    or: vi.fn(),
    like: vi.fn(),
    count: vi.fn(),
    asc: vi.fn(),
    desc: vi.fn(),
    sql: vi.fn(),
    getTableColumns: vi.fn().mockReturnValue({}),
    execute: vi.fn(function (this: any) {
      return { rowCount: 1 };
    }),
    then: function (this: any, onFullfilled: any) {
      const res = this.__result || [];
      res.rowCount = 1;
      return Promise.resolve(res).then(onFullfilled);
    },
    __result: [{ id: 1, name: "Test" }] as any,
  };
  return { db: chainable };
});

vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn(() => mockUnifiedCache),
  },
  unifiedCache: mockUnifiedCache,
}));

vi.mock("../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../server/lib/db/db-circuit-breaker.js", () => ({
  dbCircuitBreaker: mockDbCircuitBreaker,
}));

vi.mock("../../../server/lib/encryption.js", () => ({
  decrypt: vi.fn((val) => (val?.includes("enc:") ? val.split(":")[1] : val)),
  encrypt: vi.fn((val) => `enc:${val}`),
  getBlindIndex: vi.fn((val) => `blind:${val}`),
}));

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn().mockReturnValue(false),
    getInstance: vi.fn(),
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    and: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    like: vi.fn(),
    isNull: vi.fn(),
    asc: vi.fn(),
    desc: vi.fn(),
    count: vi.fn(),
    sql: vi.fn(),
    getTableColumns: vi.fn().mockReturnValue({}),
  };
});

describe("MiscRepository", () => {
  let repository: MiscRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MiscRepository();
    (db as any).__result = [{ id: 1, name: "Test Item" }];
  });

  const standardEntities = [
    {
      entity: "Fiber",
      list: "getFibers",
      get: "getFiber",
      create: "createFiber",
      update: "updateFiber",
      del: "deleteFiber",
      listDeleted: "getFibersIncludingDeleted",
      restore: "restoreFiber",
      permDel: "permanentlyDeleteFiber",
    },
    {
      entity: "Fabric",
      list: "getFabrics",
      get: "getFabric",
      create: "createFabric",
      update: "updateFabric",
      del: "deleteFabric",
      listDeleted: "getFabricsIncludingDeleted",
      restore: "restoreFabric",
      permDel: "permanentlyDeleteFabric",
    },
    {
      entity: "Certificate",
      list: "getCertificates",
      get: "getCertificate",
      create: "createCertificate",
      update: "updateCertificate",
      del: "deleteCertificate",
      listDeleted: "getCertificatesIncludingDeleted",
      restore: "restoreCertificate",
      permDel: "permanentlyDeleteCertificate",
    },
    {
      entity: "SizeChart",
      list: "getSizeCharts",
      get: "getSizeChart",
      create: "createSizeChart",
      update: "updateSizeChart",
      del: "deleteSizeChart",
      listDeleted: "getSizeChartsIncludingDeleted",
      restore: "restoreSizeChart",
      permDel: "permanentlyDeleteSizeChart",
    },
    {
      entity: "Accessory",
      list: "getAccessories",
      get: "getAccessory",
      create: "createAccessory",
      update: "updateAccessory",
      del: "deleteAccessory",
    },
  ];

  describe.each(standardEntities)("Standard CRUD for $entity", ({
    list,
    get,
    create,
    update,
    del,
    listDeleted,
    restore,
    permDel,
  }) => {
    it(`should ${list}`, async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue(null);
      const res = await (repository as any)[list]();
      expect(res).toBeDefined();
    });

    it(`should ${list} from cache`, async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue([{ id: 1 }]);
      const res = await (repository as any)[list]();
      expect(res).toEqual([{ id: 1 }]);
    });

    it(`should ${get}`, async () => {
      const res = await (repository as any)[get](1);
      expect(res).toBeDefined();
    });

    it(`should ${create}`, async () => {
      const res = await (repository as any)[create]({ name: "New" });
      expect(res).toBeDefined();
    });

    it(`should ${update}`, async () => {
      const res = await (repository as any)[update](1, { name: "Updated" });
      expect(res).toBeDefined();
    });

    it(`should ${del}`, async () => {
      const res = await (repository as any)[del](1);
      expect(res).toBe(true);
    });

    if (listDeleted) {
      it(`should ${listDeleted}`, async () => {
        const res = await (repository as any)[listDeleted]();
        expect(res).toBeDefined();
      });
    }

    if (restore) {
      it(`should ${restore}`, async () => {
        const res = await (repository as any)[restore](1);
        expect(res).toBe(true);
      });
    }

    if (permDel) {
      it(`should ${permDel}`, async () => {
        const res = await (repository as any)[permDel](1);
        expect(res).toBe(true);
      });
    }
  });

  describe("Specific Entities", () => {
    it("should getNavigationItems", async () => {
      const res = await repository.getNavigationItems();
      expect(res).toBeDefined();
    });
    it("should getNavigationItem", async () => {
      const res = await repository.getNavigationItem(1);
      expect(res).toBeDefined();
    });
    it("should createNavigationItem", async () => {
      const res = await repository.createNavigationItem({ label: "Nav", href: "/" });
      expect(res).toBeDefined();
    });
    it("should updateNavigationItem", async () => {
      const res = await repository.updateNavigationItem(1, { label: "Nav2" });
      expect(res).toBeDefined();
    });
    it("should deleteNavigationItem", async () => {
      const res = await repository.deleteNavigationItem(1);
      expect(res).toBe(true);
    });
    it("should reorderNavigationItems", async () => {
      (db as any).transaction = vi.fn(async (cb) => {
        const tx = {
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        };
        await cb(tx);
      });
      await repository.reorderNavigationItems([{ id: 1, sortOrder: 2 }]);
      expect((db as any).transaction).toHaveBeenCalled();
    });

    it("should getNavigationGlassmorphismSettings", async () => {
      const res = await repository.getNavigationGlassmorphismSettings();
      expect(res).toBeDefined();
    });
    it("should updateNavigationGlassmorphismSettings", async () => {
      const res = await repository.updateNavigationGlassmorphismSettings({ enabled: true });
      expect(res).toBeDefined();
    });

    it("should getContactPageConfiguration", async () => {
      const res = await repository.getContactPageConfiguration();
      expect(res).toBeDefined();
    });
    it("should createContactPageConfiguration", async () => {
      const res = await repository.createContactPageConfiguration({ title: "Contact" } as any);
      expect(res).toBeDefined();
    });
    it("should updateContactPageConfiguration", async () => {
      const res = await repository.updateContactPageConfiguration(1, { title: "Contact2" });
      expect(res).toBeDefined();
    });

    it("should getFooterConfiguration", async () => {
      const res = await repository.getFooterConfiguration();
      expect(res).toBeDefined();
    });
    it("should updateFooterConfiguration", async () => {
      const res = await repository.updateFooterConfiguration({ copyrightText: "2026" });
      expect(res).toBeDefined();
    });
    it("should createFooterLink", async () => {
      (db as any).__result = [{ id: 1, navigationColumns: [] }];
      const res = await repository.createFooterLink({ label: "Link", href: "/" });
      expect(res).toBeDefined();
    });
  });

  describe("Inquiries", () => {
    it("should listInquiries with search", async () => {
      (db as any).__result = [{ name: "enc:John", email: "enc:john@doe.com" }];
      const res = await repository.listInquiries({ search: "john@doe.com" });
      expect(res.inquiries[0].name).toBe("John");
    });
    it("should createInquiry", async () => {
      const res = await repository.createInquiry({
        name: "John",
        email: "john@doe.com",
        message: "Hi",
      } as any);
      expect(res).toBeDefined();
    });
    it("should getInquiryById", async () => {
      const res = await repository.getInquiryById(1);
      expect(res).toBeDefined();
    });
    it("should updateInquiry", async () => {
      const res = await repository.updateInquiry(1, { status: "read" });
      expect(res).toBeDefined();
    });
    it("should addCrmLog", async () => {
      (db as any).__result = [{ id: 1, crmLogs: [] }];
      const res = await repository.addCrmLog(1, { action: "called", note: "left voicemail" });
      expect(res).toBeDefined();
    });
    it("should deleteInquiry", async () => {
      const res = await repository.deleteInquiry(1);
      expect(res).toBe(true);
    });
    it("should getInquiryStats", async () => {
      (db as any).__result = [{ count: 5, status: "new", source: "web" }];
      const res = await repository.getInquiryStats();
      expect(res).toBeDefined();
    });
  });

  describe("NewsletterSubscribers", () => {
    it("should subscribeToNewsletter", async () => {
      const res = await repository.subscribeToNewsletter("sub@do.com");
      expect(res).toBe(true);
    });
  });
});
