import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../../server/db.js";
import { StorageSingleton } from "../../../../../../server/lib/storage-singleton.js";
import { servicesRepository } from "../../../../../../server/services/repositories/page-content/services.repository.js";

vi.mock("../../../../../../server/db.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) =>
      cb({
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
        }),
      }),
    ),
  },
}));

vi.mock("../../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../../../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../../../../server/middleware/ssr-cache.js", () => ({
  invalidateHtmlCache: vi.fn(),
}));

vi.mock("../../../../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clearPattern: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe("ServicesRepository", () => {
  const repository = servicesRepository;
  let mockStorageInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageInstance = {
      getServices: vi.fn(),
      getService: vi.fn(),
      createService: vi.fn(),
      updateService: vi.fn(),
      deleteService: vi.fn(),
      reorderServices: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getServices delegates", async () => {
      await repository.getServices();
      expect(mockStorageInstance.getServices).toHaveBeenCalled();
    });

    it("getService delegates", async () => {
      await repository.getService(1);
      expect(mockStorageInstance.getService).toHaveBeenCalled();
    });

    it("createService delegates", async () => {
      await repository.createService({} as any);
      expect(mockStorageInstance.createService).toHaveBeenCalled();
    });

    it("updateService delegates", async () => {
      await repository.updateService(1, {});
      expect(mockStorageInstance.updateService).toHaveBeenCalled();
    });

    it("deleteService delegates", async () => {
      await repository.deleteService(1);
      expect(mockStorageInstance.deleteService).toHaveBeenCalled();
    });

    it("reorderServices delegates", async () => {
      await repository.reorderServices([1, 2]);
      expect(mockStorageInstance.reorderServices).toHaveBeenCalled();
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    const createMockDbChain = (result: any) => {
      const chain: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(result),
        $dynamic: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => resolve(result);
      return chain;
    };

    it("getServices uses db queries", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getServices();
      expect(db.select).toHaveBeenCalled();
    });

    it("getService uses db queries", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getService(1);
      expect(db.select).toHaveBeenCalled();
    });

    it("createService uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.insert).mockReturnValue(chain);
      await repository.createService({} as any);
      expect(db.insert).toHaveBeenCalled();
    });

    it("updateService uses db", async () => {
      const chainUpdate = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chainUpdate);
      await repository.updateService(1, { title: "test" });
      expect(db.update).toHaveBeenCalled();
    });

    it("deleteService uses db", async () => {
      const chainDelete = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.delete).mockReturnValue(chainDelete);
      await repository.deleteService(1);
      expect(db.delete).toHaveBeenCalled();
    });

    it("reorderServices uses db transaction", async () => {
      await repository.reorderServices([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
