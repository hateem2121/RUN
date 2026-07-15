import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeQuery } from "../../../../server/db.js";
import { CacheOperations } from "../../../../server/lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../../../../server/lib/cache/two-tier-batch.js";
import { unifiedCache } from "../../../../server/lib/cache/unified-cache.js";
import { AppError } from "../../../../server/lib/errors.js";
import { NavigationService } from "../../../../server/services/navigation-service.js";
import { miscRepository } from "../../../../server/services/repositories/index.js";

vi.mock("../../../../server/services/repositories/index.js", () => ({
  miscRepository: {
    getNavigationItems: vi.fn(),
    getNavigationItem: vi.fn(),
    createNavigationItem: vi.fn(),
    updateNavigationItem: vi.fn(),
    deleteNavigationItem: vi.fn(),
    reorderNavigationItems: vi.fn(),
    getNavigationGlassmorphismSettings: vi.fn(),
    updateNavigationGlassmorphismSettings: vi.fn(),
  },
}));

vi.mock("../../../../server/db.js", () => ({
  safeQuery: vi.fn((promise) =>
    promise
      .then((value: any) => ({ isErr: () => false, value }))
      .catch((error: any) => ({ isErr: () => true, error })),
  ),
}));

vi.mock("../../../../server/lib/cache/two-tier-batch.js", () => ({
  twoTierBatchCache: {
    get: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/cache/unified-cache.js", () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/cache/cache-strategies.js", () => ({
  CacheKeys: {
    navigation: {
      items: () => "nav-items",
    },
  },
  CacheOperations: {
    invalidateNavigation: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, cb) => cb()),
  DB_CIRCUIT_OPTIONS: {},
}));

vi.mock("../../../../server/lib/resilience/request-timeout.js", () => ({
  withTimeout: vi.fn((promise) => promise),
}));

describe("NavigationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getItems", () => {
    it("should fetch and normalize items using cache", async () => {
      const mockItems = [{ id: 1, title: "Test", href: "/test" }];
      vi.mocked(twoTierBatchCache.get).mockResolvedValue({
        data: mockItems,
        benchmark: { hit: "HIT_L1" },
      });

      const result = await NavigationService.getItems();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.data).toEqual(mockItems);
        expect(result.value.metadata.cacheHit).toBe("HIT_L1");
      }
    });

    it("should return empty array if cache returns null", async () => {
      vi.mocked(twoTierBatchCache.get).mockResolvedValue(null as any);

      const result = await NavigationService.getItems();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.data).toEqual([]);
        expect(result.value.metadata.cacheHit).toBe("MISS");
      }
    });

    it("should handle safeQuery errors gracefully during fetch", async () => {
      vi.mocked(twoTierBatchCache.get).mockImplementation(async (_key, fetcher) => {
        vi.mocked(safeQuery).mockResolvedValueOnce({
          isErr: () => true,
          error: new AppError("test error"),
        } as any);
        await fetcher();
        return null as any;
      });

      const result = await NavigationService.getItems();
      expect(result.isErr()).toBe(true);
    });
  });

  describe("getItem", () => {
    it("should fetch single item", async () => {
      const mockItem = { id: 1, title: "Test" };
      vi.mocked(miscRepository.getNavigationItem).mockResolvedValue(mockItem as any);

      const result = await NavigationService.getItem(1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockItem);
      }
    });

    it("should return error if item not found", async () => {
      vi.mocked(miscRepository.getNavigationItem).mockResolvedValue(null);

      const result = await NavigationService.getItem(1);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("createItem", () => {
    it("should format and create item, then invalidate cache", async () => {
      const mockItem = { id: 1, title: "Test" };
      vi.mocked(miscRepository.createNavigationItem).mockResolvedValue(mockItem as any);

      const result = await NavigationService.createItem({ title: "Test" });

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateNavigation).toHaveBeenCalled();
    });
  });

  describe("updateItem", () => {
    it("should update item and invalidate cache", async () => {
      const mockItem = { id: 1, title: "Test Updated" };
      vi.mocked(miscRepository.updateNavigationItem).mockResolvedValue(mockItem as any);

      const result = await NavigationService.updateItem(1, { title: "Test Updated" });

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateNavigation).toHaveBeenCalled();
    });

    it("should return error if item not found", async () => {
      vi.mocked(miscRepository.updateNavigationItem).mockResolvedValue(null);

      const result = await NavigationService.updateItem(1, { title: "Test" });

      expect(result.isErr()).toBe(true);
    });
  });

  describe("deleteItem", () => {
    it("should delete item and invalidate cache", async () => {
      vi.mocked(miscRepository.deleteNavigationItem).mockResolvedValue(true as any);

      const result = await NavigationService.deleteItem(1);

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateNavigation).toHaveBeenCalled();
    });

    it("should return error if item not found", async () => {
      vi.mocked(miscRepository.deleteNavigationItem).mockResolvedValue(null as any);

      const result = await NavigationService.deleteItem(1);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("reorderItems", () => {
    it("should reorder items and invalidate cache", async () => {
      vi.mocked(miscRepository.reorderNavigationItems).mockResolvedValue([] as any);
      vi.mocked(twoTierBatchCache.get).mockResolvedValue({
        data: [],
        benchmark: { hit: "MISS" },
      });

      const result = await NavigationService.reorderItems([{ id: 1, sortOrder: 1 }]);

      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateNavigation).toHaveBeenCalled();
    });
  });

  describe("getGlassmorphismSettings", () => {
    it("should return cached settings if available", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValue({ enabled: true });

      const result = await NavigationService.getGlassmorphismSettings();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ enabled: true });
      }
    });

    it("should fetch and cache if not in cache", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValue(null);
      vi.mocked(miscRepository.getNavigationGlassmorphismSettings).mockResolvedValue({
        enabled: false,
      } as any);

      const result = await NavigationService.getGlassmorphismSettings();

      expect(result.isOk()).toBe(true);
      expect(unifiedCache.set).toHaveBeenCalled();
    });
  });

  describe("updateGlassmorphismSettings", () => {
    it("should update settings and invalidate cache", async () => {
      vi.mocked(miscRepository.updateNavigationGlassmorphismSettings).mockResolvedValue({
        enabled: true,
      } as any);

      const result = await NavigationService.updateGlassmorphismSettings({ enabled: true });

      expect(result.isOk()).toBe(true);
      expect(unifiedCache.delete).toHaveBeenCalledWith("navigation-glassmorphism-settings");
    });
  });
});
