import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { CacheOperations } from "../../../server/lib/cache/cache-strategies.js";
import { UnifiedCache } from "../../../server/lib/cache/unified-cache.js";
import { StorageSingleton } from "../../../server/lib/storage-singleton.js";
import { sustainabilityRepository } from "../../../server/services/repositories/page-content/sustainability.repository.js";

// Mock dependencies
vi.mock("../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
    transaction: vi.fn((cb) => cb(db)),
    then: vi.fn((resolve: any) => resolve([])),
  },
}));

vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    }),
  },
}));

vi.mock("../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateSustainability: vi.fn(),
  },
}));

vi.mock("../../../server/lib/storage-singleton.js", () => {
  const mockStorageInstance = {
    getSustainabilityHero: vi.fn().mockResolvedValue({ id: 2 }),
    updateSustainabilityHero: vi.fn().mockResolvedValue({ id: 2 }),
    getSustainabilityGoals: vi.fn().mockResolvedValue([{ id: 2 }]),
    getSustainabilityGoal: vi.fn().mockResolvedValue({ id: 2 }),
    createSustainabilityGoal: vi.fn().mockResolvedValue({ id: 2 }),
    updateSustainabilityGoal: vi.fn().mockResolvedValue({ id: 2 }),
    deleteSustainabilityGoal: vi.fn().mockResolvedValue(true),
    reorderSustainabilityGoals: vi.fn().mockResolvedValue(undefined),
    getSustainabilityMetrics: vi.fn().mockResolvedValue([{ id: 2 }]),
    getSustainabilityMetric: vi.fn().mockResolvedValue({ id: 2 }),
    createSustainabilityMetric: vi.fn().mockResolvedValue({ id: 2 }),
    updateSustainabilityMetric: vi.fn().mockResolvedValue({ id: 2 }),
    deleteSustainabilityMetric: vi.fn().mockResolvedValue(true),
    reorderSustainabilityMetrics: vi.fn().mockResolvedValue(undefined),
    getSustainabilityInitiatives: vi.fn().mockResolvedValue([{ id: 2 }]),
    getSustainabilityInitiative: vi.fn().mockResolvedValue({ id: 2 }),
    createSustainabilityInitiative: vi.fn().mockResolvedValue({ id: 2 }),
    updateSustainabilityInitiative: vi.fn().mockResolvedValue({ id: 2 }),
    deleteSustainabilityInitiative: vi.fn().mockResolvedValue(true),
    reorderSustainabilityInitiatives: vi.fn().mockResolvedValue(undefined),
    getUnifiedSustainability: vi.fn().mockResolvedValue({ id: 2 }),
    updateUnifiedSustainability: vi.fn().mockResolvedValue({ id: 2 }),
  };
  return {
    StorageSingleton: {
      hasInstance: vi.fn(() => false),
      getInstance: vi.fn(() => mockStorageInstance),
    },
  };
});

describe("SustainabilityRepository", () => {
  let unifiedCache: any;

  beforeEach(() => {
    vi.clearAllMocks();
    unifiedCache = UnifiedCache.getInstance();
  });

  describe("Hero", () => {
    it("should fetch hero from cache", async () => {
      unifiedCache.get.mockResolvedValueOnce({ id: 1 });
      const result = await sustainabilityRepository.getSustainabilityHero();
      expect(result).toBeDefined();
      expect(unifiedCache.get).toHaveBeenCalled();
    });

    it("should fetch hero from db", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityHero();
      expect(result).toBeDefined();
    });

    it("should update hero (existing)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateSustainabilityHero({ title: "Updated" });
      expect(result).toBeDefined();
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });

    it("should update hero (create new)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any)) // no existing
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)); // create new
      const result = await sustainabilityRepository.updateSustainabilityHero({
        title: "New",
      } as any);
      expect(result).toBeDefined();
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });
  });

  describe("Goals", () => {
    it("should fetch goals from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityGoals();
      expect(result).toBeDefined();
    });

    it("should fetch goal item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityGoal(1);
      expect(result).toBeDefined();
    });

    it("should create goal", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.createSustainabilityGoal({
        title: "New",
      } as any);
      expect(result).toBeDefined();
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });

    it("should update goal", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateSustainabilityGoal(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });

    it("should delete goal", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await sustainabilityRepository.deleteSustainabilityGoal(1);
      expect(result).toBe(true);
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });

    it("should reorder goals", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.reorderSustainabilityGoals([1]);
      expect(result).toBeUndefined();
      expect(CacheOperations.invalidateSustainability).toHaveBeenCalled();
    });
  });

  describe("Metrics", () => {
    it("should fetch metrics from cache", async () => {
      unifiedCache.get.mockResolvedValueOnce([{ id: 1 }]);
      const result = await sustainabilityRepository.getSustainabilityMetrics();
      expect(result).toBeDefined();
    });

    it("should fetch metrics from db", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityMetrics();
      expect(result).toBeDefined();
    });

    it("should fetch metric item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityMetric(1);
      expect(result).toBeDefined();
    });

    it("should create metric", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, value: 10 }] as any)) // returning metric
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)); // history insert
      const result = await sustainabilityRepository.createSustainabilityMetric({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update metric", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, value: 20 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateSustainabilityMetric(1, {
        title: "Updated",
        value: 20,
      });
      expect(result).toBeDefined();
    });

    it("should delete metric", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await sustainabilityRepository.deleteSustainabilityMetric(1);
      expect(result).toBe(true);
    });

    it("should reorder metrics", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.reorderSustainabilityMetrics([1]);
      expect(result).toBeUndefined();
    });

    it("should fetch metric history", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityMetricHistory(1);
      expect(result).toBeDefined();
    });
  });

  describe("Initiatives", () => {
    it("should fetch initiatives from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityInitiatives();
      expect(result).toBeDefined();
    });

    it("should fetch initiative item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getSustainabilityInitiative(1);
      expect(result).toBeDefined();
    });

    it("should create initiative", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.createSustainabilityInitiative({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update initiative", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateSustainabilityInitiative(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete initiative", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await sustainabilityRepository.deleteSustainabilityInitiative(1);
      expect(result).toBe(true);
    });

    it("should reorder initiatives", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.reorderSustainabilityInitiatives([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Unified Sustainability", () => {
    it("should fetch unified sustainability from cache", async () => {
      unifiedCache.get.mockResolvedValueOnce({ id: 1 });
      const result = await sustainabilityRepository.getUnifiedSustainability();
      expect(result).toBeDefined();
    });

    it("should fetch unified sustainability from db", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.getUnifiedSustainability();
      expect(result).toBeDefined();
    });

    it("should update unified sustainability (existing)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateUnifiedSustainability({
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should update unified sustainability (create new)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await sustainabilityRepository.updateUnifiedSustainability({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });
  });

  describe("Migrate Legacy Data", () => {
    it("should migrate legacy data when present", async () => {
      // Mock existing legacy data
      unifiedCache.get.mockResolvedValue(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)) // getSustainabilityHero
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)) // getSustainabilityGoals
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)) // getSustainabilityMetrics
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)) // getSustainabilityInitiatives
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)) // getUnifiedSustainability
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)); // updateUnifiedSustainability

      const result = await sustainabilityRepository.migrateLegacySustainabilityData();
      expect(result.migrated).toBe(4);
    });

    it("should not migrate when no legacy data", async () => {
      unifiedCache.get.mockResolvedValue(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any)) // hero
        .mockImplementationOnce((resolve: any) => resolve([] as any)) // goals
        .mockImplementationOnce((resolve: any) => resolve([] as any)) // metrics
        .mockImplementationOnce((resolve: any) => resolve([] as any)); // initiatives

      const result = await sustainabilityRepository.migrateLegacySustainabilityData();
      expect(result.migrated).toBe(0);
    });
  });

  describe("StorageSingleton Fallbacks", () => {
    it("should use StorageSingleton when available", async () => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValueOnce(true);
      const instance = StorageSingleton.getInstance();
      const result = await sustainabilityRepository.getSustainabilityHero();
      expect(instance.getSustainabilityHero).toHaveBeenCalled();
      expect(result?.id).toBe(2);
    });
  });
});
