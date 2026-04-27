import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { MediaRepository } from "../../../server/lib/db/repositories/media-repository.js";

const { mockUnifiedCache } = vi.hoisted(() => ({
  mockUnifiedCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clearPattern: vi.fn(),
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
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    and: vi.fn(),
    eq: vi.fn(),
    execute: vi.fn(),
    // biome-ignore lint/suspicious/noThenProperty: Mocking a promise
    then: function (this: any, onFullfilled: any) {
      return Promise.resolve(this.__result || []).then(onFullfilled);
    },
    __result: [] as any,
  };
  return { db: chainable };
});

vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn(() => mockUnifiedCache),
    TTL_PRESETS: {
      MEDIA: 21600000,
    },
  },
}));

describe("MediaRepository", () => {
  let repository: MediaRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MediaRepository();
    (db as any).__result = [];
  });

  describe("getMediaAsset", () => {
    const mockAsset = { id: 1, filename: "test.jpg", isActive: true, deletedAt: null };

    it("should return cached asset if available", async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue(mockAsset);

      const result = await repository.getMediaAsset(1);

      expect(result).toEqual(mockAsset);
      expect(db.select).not.toHaveBeenCalled();
    });

    it("should fetch from DB on cache miss", async () => {
      vi.mocked(mockUnifiedCache.get).mockResolvedValue(null);
      (db as any).__result = [mockAsset];

      const result = await repository.getMediaAsset(1);

      expect(result).toEqual(mockAsset);
      expect(db.select).toHaveBeenCalled();
      expect(mockUnifiedCache.set).toHaveBeenCalled();
    });
  });

  describe("createMediaAsset", () => {
    it("should insert asset and invalidate cache", async () => {
      const createdAsset = { id: 2, filename: "new.jpg" };
      (db as any).__result = [createdAsset];

      const result = await repository.createMediaAsset({ filename: "new.jpg" } as any);

      expect(result).toEqual(createdAsset);
      expect(mockUnifiedCache.clearPattern).toHaveBeenCalledWith("media:paginated:");
    });
  });
});
