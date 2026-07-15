import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../../server/db.js";
import { StorageSingleton } from "../../../../../../server/lib/storage-singleton.js";
import { sustainabilityRepository } from "../../../../../../server/services/repositories/page-content/sustainability.repository.js";

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

vi.mock("../../../../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateSustainability: vi.fn(),
  },
}));

vi.mock("../../../../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock("../../../../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn(),
    getInstance: vi.fn(),
  },
}));

describe("SustainabilityRepository", () => {
  const repository = sustainabilityRepository;
  let mockStorageInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageInstance = {
      getSustainabilityHero: vi.fn(),
      updateSustainabilityHero: vi.fn(),
      getSustainabilityGoals: vi.fn(),
      getSustainabilityGoal: vi.fn(),
      createSustainabilityGoal: vi.fn(),
      updateSustainabilityGoal: vi.fn().mockResolvedValue({}),
      deleteSustainabilityGoal: vi.fn(),
      reorderSustainabilityGoals: vi.fn(),
      getSustainabilityMetrics: vi.fn(),
      getSustainabilityMetric: vi.fn(),
      createSustainabilityMetric: vi.fn(),
      updateSustainabilityMetric: vi.fn().mockResolvedValue({}),
      deleteSustainabilityMetric: vi.fn(),
      reorderSustainabilityMetrics: vi.fn(),
      getSustainabilityInitiatives: vi.fn(),
      getSustainabilityInitiative: vi.fn(),
      createSustainabilityInitiative: vi.fn(),
      updateSustainabilityInitiative: vi.fn().mockResolvedValue({}),
      deleteSustainabilityInitiative: vi.fn(),
      reorderSustainabilityInitiatives: vi.fn(),
      getUnifiedSustainability: vi.fn(),
      updateUnifiedSustainability: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);
  });

  describe("when StorageSingleton has instance", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    it("getSustainabilityHero delegates", async () => {
      await repository.getSustainabilityHero();
      expect(mockStorageInstance.getSustainabilityHero).toHaveBeenCalled();
    });

    it("updateSustainabilityHero delegates", async () => {
      await repository.updateSustainabilityHero({});
      expect(mockStorageInstance.updateSustainabilityHero).toHaveBeenCalled();
    });

    it("getSustainabilityGoals delegates", async () => {
      await repository.getSustainabilityGoals();
      expect(mockStorageInstance.getSustainabilityGoals).toHaveBeenCalled();
    });

    it("updateSustainabilityGoal delegates", async () => {
      await repository.updateSustainabilityGoal(1, {});
      expect(mockStorageInstance.updateSustainabilityGoal).toHaveBeenCalled();
    });

    it("createSustainabilityMetric delegates", async () => {
      await repository.createSustainabilityMetric({} as any);
      expect(mockStorageInstance.createSustainabilityMetric).toHaveBeenCalled();
    });

    it("getUnifiedSustainability delegates", async () => {
      await repository.getUnifiedSustainability();
      expect(mockStorageInstance.getUnifiedSustainability).toHaveBeenCalled();
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
        returning: vi.fn().mockResolvedValue(result),
        $dynamic: vi.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => resolve(result);
      return chain;
    };

    it("getSustainabilityHero uses db", async () => {
      const chain = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getSustainabilityHero();
      expect(db.select).toHaveBeenCalled();
    });

    it("updateSustainabilityHero uses db", async () => {
      // Mock existing hero to trigger update branch
      const chainGet = createMockDbChain([{ id: 1 }]);
      const chainUpdate = createMockDbChain([{ id: 1 }]);

      vi.mocked(db.select).mockReturnValue(chainGet);
      vi.mocked(db.update).mockReturnValue(chainUpdate);

      await repository.updateSustainabilityHero({});
      expect(db.update).toHaveBeenCalled();
    });

    it("getSustainabilityGoals uses db", async () => {
      const chain = createMockDbChain([]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getSustainabilityGoals();
      expect(db.select).toHaveBeenCalled();
    });

    it("createSustainabilityGoal uses db", async () => {
      const chainSelect = createMockDbChain([{ max: 1 }]);
      const chainInsert = createMockDbChain([{ id: 1 }]);

      vi.mocked(db.select).mockReturnValue(chainSelect);
      vi.mocked(db.insert).mockReturnValue(chainInsert);

      await repository.createSustainabilityGoal({} as any);
      expect(db.insert).toHaveBeenCalled();
    });

    it("updateSustainabilityGoal uses db", async () => {
      const chainUpdate = createMockDbChain([{ id: 1 }]);
      vi.mocked(db.update).mockReturnValue(chainUpdate);

      await repository.updateSustainabilityGoal(1, {});
      expect(db.update).toHaveBeenCalled();
    });

    it("deleteSustainabilityGoal uses db", async () => {
      const chainDelete = createMockDbChain({ rowCount: 1 });
      vi.mocked(db.delete).mockReturnValue(chainDelete);

      await repository.deleteSustainabilityGoal(1);
      expect(db.delete).toHaveBeenCalled();
    });

    it("reorderSustainabilityGoals uses db", async () => {
      await repository.reorderSustainabilityGoals([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });

    it("getSustainabilityMetricHistory uses db", async () => {
      const chain = createMockDbChain([]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.getSustainabilityMetricHistory(1);
      expect(db.select).toHaveBeenCalled();
    });

    it("migrateLegacySustainabilityData uses db", async () => {
      const chain = createMockDbChain([]);
      vi.mocked(db.select).mockReturnValue(chain);
      await repository.migrateLegacySustainabilityData();
      // Should not throw, should return migrated: 0
    });
  });
});
