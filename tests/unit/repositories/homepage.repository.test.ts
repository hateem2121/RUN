import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { StorageSingleton } from "../../../server/lib/storage-singleton.js";
import { homepageRepository } from "../../../server/services/repositories/page-content/homepage.repository.js";

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

import { unifiedCache } from "../../../server/lib/cache/unified-cache.js";

vi.mock("../../../server/lib/cache/unified-cache.js", () => {
  const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn(() => mockCache),
    },
    unifiedCache: mockCache,
  };
});

vi.mock("../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn(),
}));

vi.mock("../../../server/lib/storage-singleton.js", () => {
  const mockStorageInstance = {
    getHomepageHero: vi.fn().mockResolvedValue({ id: 2 }),
  };
  return {
    StorageSingleton: {
      hasInstance: vi.fn(() => false),
      getInstance: vi.fn(() => mockStorageInstance),
    },
  };
});

vi.mock("../../../server/middleware/ssr-cache.js", () => ({
  invalidateHtmlCache: vi.fn(),
}));

describe("HomepageRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hero", () => {
    it("should fetch hero from cache", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValueOnce({ id: 1, title: "Cached" });
      const result = await homepageRepository.getHomepageHero();
      expect(result).toBeDefined();
      expect(result?.title).toBe("Cached");
      expect(vi.mocked(unifiedCache.get)).toHaveBeenCalled();
    });

    it("should fetch hero from db if not in cache", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageHero();
      expect(result).toBeDefined();
      expect(vi.mocked(unifiedCache.set)).toHaveBeenCalled();
    });

    it("should update hero (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, title: "Updated" }] as any));
      const result = await homepageRepository.updateHomepageHero({ title: "Updated" } as any);
      expect(result.title).toBe("Updated");
      expect(vi.mocked(unifiedCache.del)).toHaveBeenCalled();
    });

    it("should update hero (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, title: "New" }] as any));
      const result = await homepageRepository.updateHomepageHero({ title: "New" } as any);
      expect(result.title).toBe("New");
    });
  });

  describe("Slogans", () => {
    it("should fetch slogans from cache", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValueOnce([{ id: 1 }]);
      const result = await homepageRepository.getHomepageSlogans();
      expect(result).toHaveLength(1);
    });

    it("should fetch slogans from db", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageSlogans();
      expect(result).toBeDefined();
    });

    it("should fetch slogan item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageSlogan(1);
      expect(result).toBeDefined();
    });

    it("should create slogan", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.createHomepageSlogan({ text: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update slogan", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateHomepageSlogan(1, { text: "Updated" } as any);
      expect(result).toBeDefined();
    });

    it("should delete slogan", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await homepageRepository.deleteHomepageSlogan(1);
      expect(result).toBe(true);
    });

    it("should reorder slogans", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.reorderHomepageSlogans([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Process Cards", () => {
    it("should fetch process cards from db", async () => {
      vi.mocked(unifiedCache.get).mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageProcessCards(true);
      expect(result).toBeDefined();
    });

    it("should fetch process card item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageProcessCard(1);
      expect(result).toBeDefined();
    });

    it("should create process card", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.createHomepageProcessCard({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update process card", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateHomepageProcessCard(1, { title: "Updated" });
      expect(result).toBeDefined();
    });

    it("should delete process card", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await homepageRepository.deleteHomepageProcessCard(1);
      expect(result).toBe(true);
    });

    it("should reorder process cards", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.reorderHomepageProcessCards([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Sections", () => {
    it("should fetch sections from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageSections();
      expect(result).toBeDefined();
    });

    it("should fetch section item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageSection("test-section");
      expect(result).toBeDefined();
    });

    it("should update section", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateHomepageSection("test-section", {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Featured Products", () => {
    it("should fetch featured products settings", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getHomepageFeaturedProductsSettings();
      expect(result).toBeDefined();
    });

    it("should update featured products settings (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateHomepageFeaturedProductsSettings({
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should update featured products settings (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateHomepageFeaturedProductsSettings({
        title: "New",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Logo Animation", () => {
    it("should fetch logo animation settings", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.getLogoAnimationSettings();
      expect(result).toBeDefined();
    });

    it("should update logo animation settings (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateLogoAnimationSettings({
        density: "medium",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update logo animation settings (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await homepageRepository.updateLogoAnimationSettings({
        density: "medium",
      } as any);
      expect(result).toBeDefined();
    });
  });

  describe("StorageSingleton delegation", () => {
    it("should use StorageSingleton when available", async () => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValueOnce(true);

      const instance = StorageSingleton.getInstance();
      const result = await homepageRepository.getHomepageHero();
      expect(instance.getHomepageHero).toHaveBeenCalled();
      expect(result?.id).toBe(2);
    });
  });
});
