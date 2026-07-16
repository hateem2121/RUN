import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../server/db.js";
import { emitCacheInvalidation } from "../../../../../server/lib/cache/cache-events.js";
import { UnifiedCache } from "../../../../../server/lib/cache/unified-cache.js";
import { dbCircuitBreaker } from "../../../../../server/lib/db/db-circuit-breaker.js";
import { logger } from "../../../../../server/lib/monitoring/logger.js";
import { StorageSingleton } from "../../../../../server/lib/storage-singleton.js";
import { accessoryRepository } from "../../../../../server/services/repositories/accessory-repository.js";

vi.mock("../../../../../server/db.js", () => {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    $dynamic: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    prepare: vi.fn().mockReturnThis(),
  };
  chain.then = (resolve: any) => resolve([]);
  return {
    db: {
      select: vi.fn().mockReturnValue(chain),
      insert: vi.fn().mockReturnValue(chain),
      update: vi.fn().mockReturnValue(chain),
      delete: vi.fn().mockReturnValue(chain),
    },
  };
});

vi.mock("../../../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../../../server/lib/cache/unified-cache.js", () => {
  const cacheMock = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clearPattern: vi.fn().mockResolvedValue(undefined),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn().mockReturnValue(cacheMock),
    },
  };
});

vi.mock("../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/db/db-circuit-breaker.js", () => ({
  dbCircuitBreaker: {
    execute: vi.fn((cb) => cb()),
  },
}));

vi.mock("../../../../../server/lib/db/query-performance.js", () => ({
  queryPerformanceMonitor: {
    startQuery: vi.fn().mockReturnValue({
      setCacheHit: vi.fn().mockReturnThis(),
      complete: vi.fn(),
    }),
  },
}));

vi.mock("../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const createMockDbChain = (result: any) => {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(result),
  };
  chain.then = (resolve: any) => resolve(result);
  return chain;
};

describe("AccessoryRepository", () => {
  let mockStorageInstance: any;
  let cacheInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    cacheInstance = UnifiedCache.getInstance();

    mockStorageInstance = {
      getAccessory: vi.fn(),
      getAccessories: vi.fn(),
      getAccessoriesCount: vi.fn(),
      createAccessory: vi.fn(),
      updateAccessory: vi.fn(),
      deleteAccessory: vi.fn(),
      getAccessoriesIncludingDeleted: vi.fn(),
      restoreAccessory: vi.fn(),
      permanentlyDeleteAccessory: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getAccessory delegates", async () => {
      await accessoryRepository.getAccessory(1);
      expect(mockStorageInstance.getAccessory).toHaveBeenCalledWith(1);
    });

    it("getAccessories delegates", async () => {
      await accessoryRepository.getAccessories(10, 0, { search: "test" });
      expect(mockStorageInstance.getAccessories).toHaveBeenCalledWith(10, 0, { search: "test" });
    });

    it("getAccessoriesCount delegates", async () => {
      await accessoryRepository.getAccessoriesCount({ search: "test" });
      expect(mockStorageInstance.getAccessoriesCount).toHaveBeenCalledWith({ search: "test" });
    });

    it("createAccessory delegates", async () => {
      await accessoryRepository.createAccessory({ name: "Acc" } as any);
      expect(mockStorageInstance.createAccessory).toHaveBeenCalledWith({ name: "Acc" });
    });

    it("updateAccessory delegates", async () => {
      await accessoryRepository.updateAccessory(1, { name: "Acc2" });
      expect(mockStorageInstance.updateAccessory).toHaveBeenCalledWith(1, { name: "Acc2" });
    });

    it("deleteAccessory delegates", async () => {
      await accessoryRepository.deleteAccessory(1);
      expect(mockStorageInstance.deleteAccessory).toHaveBeenCalledWith(1);
    });

    it("getAccessoriesIncludingDeleted delegates", async () => {
      await accessoryRepository.getAccessoriesIncludingDeleted();
      expect(mockStorageInstance.getAccessoriesIncludingDeleted).toHaveBeenCalled();
    });

    it("restoreAccessory delegates", async () => {
      await accessoryRepository.restoreAccessory(1);
      expect(mockStorageInstance.restoreAccessory).toHaveBeenCalledWith(1);
    });

    it("permanentlyDeleteAccessory delegates", async () => {
      await accessoryRepository.permanentlyDeleteAccessory(1);
      expect(mockStorageInstance.permanentlyDeleteAccessory).toHaveBeenCalledWith(1);
    });
  });

  describe("when StorageSingleton has no instance (db logic)", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
      vi.mocked(cacheInstance.get).mockResolvedValue(null);
      vi.mocked(cacheInstance.set).mockResolvedValue(undefined);
      vi.mocked(cacheInstance.clearPattern).mockResolvedValue(undefined);
    });

    describe("getAccessory", () => {
      it("returns cached accessory if available", async () => {
        vi.mocked(cacheInstance.get).mockResolvedValue({ id: 1, name: "Cached" });
        const result = await accessoryRepository.getAccessory(1);
        expect(result).toEqual({ id: 1, name: "Cached" });
        expect(db.select).not.toHaveBeenCalled();
      });

      it("fetches from db and caches if not in cache", async () => {
        const chain = createMockDbChain([{ id: 1, name: "DB" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessory(1);
        expect(result).toEqual({ id: 1, name: "DB" });
        expect(db.select).toHaveBeenCalled();
        expect(cacheInstance.set).toHaveBeenCalledWith(
          "accessory:1",
          { id: 1, name: "DB" },
          expect.any(Number),
        );
      });

      it("returns undefined if not found in db", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessory(1);
        expect(result).toBeUndefined();
        expect(cacheInstance.set).not.toHaveBeenCalled();
      });
    });

    describe("getAccessories", () => {
      it("returns cached accessories if available", async () => {
        vi.mocked(cacheInstance.get).mockResolvedValue([{ id: 1 }]);
        const result = await accessoryRepository.getAccessories(10, 0);
        expect(result).toEqual([{ id: 1 }]);
        expect(dbCircuitBreaker.execute).not.toHaveBeenCalled();
      });

      it("fetches from db with filters and caches if not in cache", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessories(10, 0, {
          category: "cat",
          search: "test",
        });
        expect(result).toEqual([{ id: 1 }]);
        expect(dbCircuitBreaker.execute).toHaveBeenCalled();
        expect(cacheInstance.set).toHaveBeenCalled();
      });

      it("normalizes filters sorting keys and ignoring undefined", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessories(10, 0, {
          search: "test",
          category: undefined,
        });
        expect(result).toEqual([{ id: 1 }]);
        // Expect cache key to contain '{"search":"test"}'
        expect(cacheInstance.set).toHaveBeenCalledWith(
          expect.stringContaining('{"search":"test"}'),
          [{ id: 1 }],
          expect.any(Number),
        );
      });
    });

    describe("getAccessoriesCount", () => {
      it("fetches count from db with filters", async () => {
        const chain = createMockDbChain([{ count: "5" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessoriesCount({
          category: "cat",
          search: "test",
        });
        expect(result).toBe(5);
        expect(db.select).toHaveBeenCalled();
      });

      it("handles undefined count safely", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessoriesCount();
        expect(result).toBe(0);
      });
    });

    describe("getAccessoriesWithCount", () => {
      it("returns cached result if available", async () => {
        vi.mocked(cacheInstance.get).mockResolvedValue({ accessories: [{ id: 1 }], total: 1 });
        const result = await accessoryRepository.getAccessoriesWithCount(10, 0);
        expect(result).toEqual({ accessories: [{ id: 1 }], total: 1 });
        expect(db.select).not.toHaveBeenCalled();
      });

      it("fetches both and caches if not in cache", async () => {
        // we mock db.select to always return a chain that evaluates to an object
        // with BOTH { id: 1, count: "1" } so that order doesn't matter
        const chain = createMockDbChain([{ id: 1, count: "1" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessoriesWithCount(10, 0);
        expect(result).toEqual({ accessories: [{ id: 1, count: "1" }], total: 1 });
        expect(cacheInstance.set).toHaveBeenCalled();
      });
    });

    describe("createAccessory", () => {
      it("inserts and invalidates cache", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        const result = await accessoryRepository.createAccessory({ name: "New" } as any);
        expect(result).toEqual({ id: 1 });
        expect(db.insert).toHaveBeenCalled();
        expect(cacheInstance.clearPattern).toHaveBeenCalledWith("accessories:");
        expect(cacheInstance.clearPattern).toHaveBeenCalledWith("accessory:");
        expect(emitCacheInvalidation).toHaveBeenCalledWith("accessories", "create");
      });

      it("inserts and logs non-critical error if cache invalidation fails", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        vi.mocked(cacheInstance.clearPattern).mockRejectedValue(new Error("Cache fail"));

        const result = await accessoryRepository.createAccessory({ name: "New" } as any);
        await new Promise(process.nextTick); // let background promise reject

        expect(result).toEqual({ id: 1 });
        expect(logger.debug).toHaveBeenCalledWith(
          "Cache invalidation failed (non-critical):",
          expect.any(Error),
        );
      });
    });

    describe("updateAccessory", () => {
      it("updates and invalidates cache if updated", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.updateAccessory(1, { name: "Updated" });
        expect(result).toEqual({ id: 1 });
        expect(db.update).toHaveBeenCalled();
        expect(cacheInstance.clearPattern).toHaveBeenCalledWith("accessories:");
        expect(cacheInstance.clearPattern).toHaveBeenCalledWith("accessory:");
        expect(emitCacheInvalidation).toHaveBeenCalledWith("accessories", "update");
      });

      it("does not invalidate cache if not updated", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.updateAccessory(1, { name: "Updated" });
        expect(result).toBeUndefined();
        expect(db.update).toHaveBeenCalled();
        expect(cacheInstance.clearPattern).not.toHaveBeenCalled();
      });

      it("updates and logs non-critical error if cache invalidation fails", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        vi.mocked(cacheInstance.clearPattern).mockRejectedValue(new Error("Cache fail"));

        const result = await accessoryRepository.updateAccessory(1, { name: "Updated" });
        await new Promise(process.nextTick);

        expect(result).toEqual({ id: 1 });
        expect(logger.debug).toHaveBeenCalledWith(
          "Cache invalidation failed (non-critical):",
          expect.any(Error),
        );
      });
    });

    describe("deleteAccessory", () => {
      it("invalidates cache then updates, returning true if found", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.deleteAccessory(1);
        expect(result).toBe(true);
        expect(cacheInstance.clearPattern).toHaveBeenCalledWith("accessories:");
        expect(db.update).toHaveBeenCalled();
      });

      it("returns false if accessory not found for deletion", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.deleteAccessory(1);
        expect(result).toBe(false);
      });

      it("throws error if cache invalidation fails", async () => {
        vi.mocked(cacheInstance.clearPattern).mockRejectedValueOnce(new Error("Cache fail"));
        await expect(accessoryRepository.deleteAccessory(1)).rejects.toThrow(
          "Cache invalidation failed",
        );
        expect(db.update).not.toHaveBeenCalled();
      });
    });

    describe("getAccessoriesIncludingDeleted", () => {
      it("fetches all from db", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const result = await accessoryRepository.getAccessoriesIncludingDeleted();
        expect(result).toEqual([{ id: 1 }]);
        expect(db.select).toHaveBeenCalled();
      });
    });

    describe("restoreAccessory", () => {
      it("updates and returns true if found", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.restoreAccessory(1);
        expect(result).toBe(true);
      });

      it("returns false if not found", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        const result = await accessoryRepository.restoreAccessory(1);
        expect(result).toBe(false);
      });
    });

    describe("permanentlyDeleteAccessory", () => {
      it("deletes and returns true if found", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.delete).mockReturnValue(chain);
        const result = await accessoryRepository.permanentlyDeleteAccessory(1);
        expect(result).toBe(true);
      });

      it("returns false if not found", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.delete).mockReturnValue(chain);
        const result = await accessoryRepository.permanentlyDeleteAccessory(1);
        expect(result).toBe(false);
      });
    });
  });
});
