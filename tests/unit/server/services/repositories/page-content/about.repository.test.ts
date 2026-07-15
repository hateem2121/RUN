import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../../../../server/db.js";
import { StorageSingleton } from "../../../../../../server/lib/storage-singleton.js";
import { aboutRepository } from "../../../../../../server/services/repositories/page-content/about.repository.js";
import { emitCacheInvalidation } from "../../../../../../server/lib/cache/cache-events.js";
import { UnifiedCache } from "../../../../../../server/lib/cache/unified-cache.js";
import { logger } from "../../../../../../server/lib/monitoring/logger.js";
import { mediaRepository } from "../../../../../../server/services/repositories/media-repository.js";

vi.mock("../../../../../../server/db.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
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

vi.mock("../../../../../../server/lib/cache/unified-cache.js", () => {
  const instance = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn(() => instance),
    },
  };
});

vi.mock("../../../../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../../../../server/services/repositories/media-repository.js", () => ({
  mediaRepository: {
    getMediaAssetsByIds: vi.fn(),
  },
}));

describe("AboutRepository", () => {
  let mockStorageInstance: any;
  let mockCache: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageInstance = {
      getAboutHero: vi.fn(),
      updateAboutHero: vi.fn(),
      getAboutTimelineEntries: vi.fn(),
      getAboutTimelineEntry: vi.fn(),
      createAboutTimelineEntry: vi.fn(),
      updateAboutTimelineEntry: vi.fn(),
      deleteAboutTimelineEntry: vi.fn(),
      reorderAboutTimelineEntries: vi.fn(),
      getAboutMapLocations: vi.fn(),
      getAboutMapLocation: vi.fn(),
      createAboutMapLocation: vi.fn(),
      updateAboutMapLocation: vi.fn(),
      deleteAboutMapLocation: vi.fn(),
      reorderAboutMapLocations: vi.fn(),
      getAboutSections: vi.fn(),
      getAboutSection: vi.fn(),
      createAboutSection: vi.fn(),
      updateAboutSection: vi.fn(),
      deleteAboutSection: vi.fn(),
      reorderAboutSections: vi.fn(),
      getAboutStatistics: vi.fn(),
      getAboutStatistic: vi.fn(),
      createAboutStatistic: vi.fn(),
      updateAboutStatistic: vi.fn(),
      deleteAboutStatistic: vi.fn(),
      reorderAboutStatistics: vi.fn(),
      getAboutTeamMessage: vi.fn(),
      updateAboutTeamMessage: vi.fn(),
      getAboutBatch: vi.fn(),
    };

    vi.mocked(StorageSingleton.getInstance).mockReturnValue(mockStorageInstance);

    mockCache = UnifiedCache.getInstance();
    vi.mocked(mockCache.get).mockResolvedValue(null);
  });

  const createMockDbChain = (result: any) => {
    const chain: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      $dynamic: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(result),
    };
    chain.then = (resolve: any) => resolve(result);
    return chain;
  };

  describe("StorageSingleton delegation", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    const delegates = [
      "getAboutHero",
      "updateAboutHero",
      "getAboutTimelineEntries",
      "getAboutTimelineEntry",
      "createAboutTimelineEntry",
      "updateAboutTimelineEntry",
      "deleteAboutTimelineEntry",
      "reorderAboutTimelineEntries",
      "getAboutMapLocations",
      "getAboutMapLocation",
      "createAboutMapLocation",
      "updateAboutMapLocation",
      "deleteAboutMapLocation",
      "reorderAboutMapLocations",
      "getAboutSections",
      "getAboutSection",
      "createAboutSection",
      "updateAboutSection",
      "deleteAboutSection",
      "reorderAboutSections",
      "getAboutStatistics",
      "getAboutStatistic",
      "createAboutStatistic",
      "updateAboutStatistic",
      "deleteAboutStatistic",
      "reorderAboutStatistics",
      "updateAboutTeamMessage",
      "getAboutBatch",
    ];

    delegates.forEach((method) => {
      it(`${method} delegates`, async () => {
        const repoMethod = aboutRepository[method as keyof typeof aboutRepository] as any;
        const mockReturn = { some: "data" };
        mockStorageInstance[method].mockResolvedValue(mockReturn);

        // Some methods require specific argument lengths or types, pass generic ones
        const args = [1, { data: "test" }];
        const res = await repoMethod(...args);

        expect(mockStorageInstance[method]).toHaveBeenCalled();
        expect(res).toEqual(mockReturn);
      });
    });
    
    // Test update method throws if storage returns undefined
    it("updateAboutTimelineEntry throws if undefined returned", async () => {
      mockStorageInstance.updateAboutTimelineEntry.mockResolvedValue(undefined);
      await expect(aboutRepository.updateAboutTimelineEntry(1, {})).rejects.toThrow("updateAboutTimelineEntry returned undefined for id 1");
    });
    it("updateAboutMapLocation throws if undefined returned", async () => {
      mockStorageInstance.updateAboutMapLocation.mockResolvedValue(undefined);
      await expect(aboutRepository.updateAboutMapLocation(1, {})).rejects.toThrow("updateAboutMapLocation returned undefined for id 1");
    });
    it("updateAboutSection throws if undefined returned", async () => {
      mockStorageInstance.updateAboutSection.mockResolvedValue(undefined);
      await expect(aboutRepository.updateAboutSection(1, {})).rejects.toThrow("updateAboutSection returned undefined for id 1");
    });
  });

  describe("DB and Cache logic", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    describe("getAboutHero", () => {
      it("returns from cache if available", async () => {
        vi.mocked(mockCache.get).mockResolvedValue({ id: 1, headline: "cached" });
        const res = await aboutRepository.getAboutHero();
        expect(res).toEqual({ id: 1, headline: "cached" });
        expect(db.select).not.toHaveBeenCalled();
      });

      it("fetches from db and caches if missing (includeInactive=false)", async () => {
        const chain = createMockDbChain([{ id: 1, headline: "db" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutHero(false);
        expect(chain.where).toHaveBeenCalled(); // checks eq(isActive, true)
        expect(mockCache.set).toHaveBeenCalledWith("about:hero", { id: 1, headline: "db" }, 1800, "data");
        expect(res).toEqual({ id: 1, headline: "db" });
      });

      it("fetches from db and caches if missing (includeInactive=true)", async () => {
        const chain = createMockDbChain([{ id: 1, headline: "db" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutHero(true);
        expect(chain.where).not.toHaveBeenCalled();
        expect(mockCache.set).toHaveBeenCalledWith("about:hero:all", { id: 1, headline: "db" }, 1800, "data");
        expect(res).toEqual({ id: 1, headline: "db" });
      });

      it("returns undefined if db returns no results", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutHero();
        expect(res).toBeUndefined();
      });
    });

    describe("updateAboutHero", () => {
      it("creates a new hero if none exists", async () => {
        const selectChain = createMockDbChain([]);
        const insertChain = createMockDbChain([{ id: 2, headline: "new" }]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.insert).mockReturnValue(insertChain);

        const res = await aboutRepository.updateAboutHero({ headline: "new" });
        expect(mockCache.del).toHaveBeenCalledWith("about:hero");
        expect(mockCache.del).toHaveBeenCalledWith("about:batch");
        expect(db.insert).toHaveBeenCalled();
        expect(emitCacheInvalidation).toHaveBeenCalledWith("about:hero", "create");
        expect(res).toEqual({ id: 2, headline: "new" });
      });

      it("throws error if creating new hero fails", async () => {
        const selectChain = createMockDbChain([]);
        const insertChain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.insert).mockReturnValue(insertChain);

        await expect(aboutRepository.updateAboutHero({ headline: "new" })).rejects.toThrow("Failed to create about hero");
      });

      it("updates existing hero if one exists", async () => {
        const selectChain = createMockDbChain([{ id: 1 }]);
        const updateChain = createMockDbChain([{ id: 1, headline: "updated" }]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.update).mockReturnValue(updateChain);

        const res = await aboutRepository.updateAboutHero({ headline: "updated" });
        expect(db.update).toHaveBeenCalled();
        expect(emitCacheInvalidation).toHaveBeenCalledWith("about:hero", "update");
        expect(res).toEqual({ id: 1, headline: "updated" });
      });

      it("throws error if updating existing hero fails", async () => {
        const selectChain = createMockDbChain([{ id: 1 }]);
        const updateChain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.update).mockReturnValue(updateChain);

        await expect(aboutRepository.updateAboutHero({ headline: "updated" })).rejects.toThrow("Failed to update about hero");
      });
    });

    describe("TimelineEntries", () => {
      it("getAboutTimelineEntries applies isActive filter when includeInactive=false", async () => {
        const chain = createMockDbChain([{ id: 1, mediaUrl: "url" }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutTimelineEntries(false);
        expect(chain.where).toHaveBeenCalled();
        expect(res).toEqual([{ id: 1, imageUrl: "url" }]); // hydrates mediaUrl -> imageUrl
      });

      it("getAboutTimelineEntries doesn't apply isActive filter when includeInactive=true", async () => {
        const chain = createMockDbChain([{ id: 1, mediaUrl: null }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutTimelineEntries(true);
        expect(chain.where).not.toHaveBeenCalled();
        expect(res).toEqual([{ id: 1, imageUrl: null }]);
      });

      it("getAboutTimelineEntry gets by id", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutTimelineEntry(1);
        expect(res).toEqual({ id: 1 });
      });

      it("createAboutTimelineEntry handles cache errors gracefully", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("cache err"));

        const res = await aboutRepository.createAboutTimelineEntry({} as any);
        expect(res).toEqual({ id: 1 });
        expect(logger.debug).toHaveBeenCalledWith("[Cache] Failed to emit invalidation event:", expect.any(Error));
      });

      it("updateAboutTimelineEntry throws if not found", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        await expect(aboutRepository.updateAboutTimelineEntry(1, {})).rejects.toThrow("About timeline entry 1 not found");
      });

      it("updateAboutTimelineEntry updates successfully", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        const res = await aboutRepository.updateAboutTimelineEntry(1, {});
        expect(res).toEqual({ id: 1 });
        expect(emitCacheInvalidation).toHaveBeenCalledWith("about:timeline", "update");
      });

      it("deleteAboutTimelineEntry handles errors gracefully", async () => {
        const chain = createMockDbChain({ rowCount: 1 });
        vi.mocked(db.delete).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("cache err"));

        const res = await aboutRepository.deleteAboutTimelineEntry(1);
        expect(res).toBe(true);
        expect(logger.debug).toHaveBeenCalledWith("[Cache] Failed to emit invalidation event:", expect.any(Error));
      });

      it("reorderAboutTimelineEntries iterates over IDs", async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
          await cb({
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
          });
        });
        await aboutRepository.reorderAboutTimelineEntries([1, 2]);
        expect(mockCache.del).toHaveBeenCalledWith("about:timeline");
        expect(emitCacheInvalidation).toHaveBeenCalledWith("about:timeline", "update");
      });
    });

    describe("MapLocations", () => {
      it("getAboutMapLocations returns cached", async () => {
        vi.mocked(mockCache.get).mockResolvedValue([{ id: 1 }]);
        const res = await aboutRepository.getAboutMapLocations();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutMapLocations queries db when cache misses", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutMapLocations(true);
        expect(chain.where).not.toHaveBeenCalled();
        expect(mockCache.set).toHaveBeenCalled();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutMapLocation gets by id", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutMapLocation(1);
        expect(res).toEqual({ id: 1 });
      });

      it("createAboutMapLocation inserts and handles cache err", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));

        await aboutRepository.createAboutMapLocation({} as any);
        expect(logger.debug).toHaveBeenCalled();
      });

      it("updateAboutMapLocation throws if not found", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        await expect(aboutRepository.updateAboutMapLocation(1, {})).rejects.toThrow("About map location 1 not found");
      });

      it("deleteAboutMapLocation", async () => {
        const chain = createMockDbChain({ rowCount: 0 });
        vi.mocked(db.delete).mockReturnValue(chain);
        const res = await aboutRepository.deleteAboutMapLocation(1);
        expect(res).toBe(false);
      });

      it("reorderAboutMapLocations iterations", async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
          await cb({
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
          });
        });
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));
        await aboutRepository.reorderAboutMapLocations([1, 2]);
        expect(logger.debug).toHaveBeenCalled();
      });
    });

    describe("Sections", () => {
      it("getAboutSections returning cached", async () => {
        vi.mocked(mockCache.get).mockResolvedValue([{ id: 1 }]);
        const res = await aboutRepository.getAboutSections();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutSections queries db when cache misses", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutSections(false);
        expect(chain.where).toHaveBeenCalled();
        expect(mockCache.set).toHaveBeenCalled();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutSection gets by id", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutSection(1);
        expect(res).toEqual({ id: 1 });
      });

      it("createAboutSection inserts and handles cache err", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));

        await aboutRepository.createAboutSection({} as any);
        expect(logger.debug).toHaveBeenCalled();
      });

      it("updateAboutSection throws if not found", async () => {
        const chain = createMockDbChain([]);
        vi.mocked(db.update).mockReturnValue(chain);
        await expect(aboutRepository.updateAboutSection(1, {})).rejects.toThrow("About section 1 not found");
      });

      it("deleteAboutSection deletes and catches cache err", async () => {
        const chain = createMockDbChain({ rowCount: 1 });
        vi.mocked(db.delete).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));
        const res = await aboutRepository.deleteAboutSection(1);
        expect(res).toBe(true);
      });

      it("reorderAboutSections handles tx and cache err", async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
          await cb({
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
          });
        });
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));
        await aboutRepository.reorderAboutSections([1]);
        expect(logger.debug).toHaveBeenCalled();
      });
    });

    describe("Statistics", () => {
      it("getAboutStatistics returning cached", async () => {
        vi.mocked(mockCache.get).mockResolvedValue([{ id: 1 }]);
        const res = await aboutRepository.getAboutStatistics();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutStatistics queries db when cache misses", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutStatistics(false);
        expect(chain.where).toHaveBeenCalled();
        expect(mockCache.set).toHaveBeenCalled();
        expect(res).toEqual([{ id: 1 }]);
      });

      it("getAboutStatistic gets by id", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        const res = await aboutRepository.getAboutStatistic(1);
        expect(res).toEqual({ id: 1 });
      });

      it("createAboutStatistic inserts and handles cache err", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.insert).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));

        await aboutRepository.createAboutStatistic({} as any);
        expect(logger.debug).toHaveBeenCalled();
      });

      it("updateAboutStatistic updates and catches err", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.update).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));
        const res = await aboutRepository.updateAboutStatistic(1, {});
        expect(res).toEqual({ id: 1 });
        expect(logger.debug).toHaveBeenCalled();
      });

      it("deleteAboutStatistic deletes and catches cache err", async () => {
        const chain = createMockDbChain({ rowCount: 1 });
        vi.mocked(db.delete).mockReturnValue(chain);
        vi.mocked(emitCacheInvalidation).mockRejectedValueOnce(new Error("err"));
        const res = await aboutRepository.deleteAboutStatistic(1);
        expect(res).toBe(true);
      });

      it("reorderAboutStatistics handles tx", async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb: any) => {
          await cb({
            update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
          });
        });
        await aboutRepository.reorderAboutStatistics([1]);
        expect(emitCacheInvalidation).toHaveBeenCalled();
      });
    });

    describe("TeamMessage", () => {
      it("getAboutTeamMessage applies isActive correctly", async () => {
        const chain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(chain);
        
        await aboutRepository.getAboutTeamMessage(false);
        expect(chain.where).toHaveBeenCalled();

        await aboutRepository.getAboutTeamMessage(true);
        expect(chain.where).toHaveBeenCalledTimes(1); // not called on true branch
      });

      it("updateAboutTeamMessage creates if existing not found", async () => {
        const selectChain = createMockDbChain([]);
        const insertChain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.insert).mockReturnValue(insertChain);

        const res = await aboutRepository.updateAboutTeamMessage({});
        expect(db.insert).toHaveBeenCalled();
        expect(res).toEqual({ id: 1 });
      });

      it("updateAboutTeamMessage updates if existing found", async () => {
        const selectChain = createMockDbChain([{ id: 1 }]);
        const updateChain = createMockDbChain([{ id: 1 }]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.update).mockReturnValue(updateChain);

        const res = await aboutRepository.updateAboutTeamMessage({});
        expect(db.update).toHaveBeenCalled();
        expect(res).toEqual({ id: 1 });
      });

      it("updateAboutTeamMessage throws if insert fails", async () => {
        const selectChain = createMockDbChain([]);
        const insertChain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.insert).mockReturnValue(insertChain);

        await expect(aboutRepository.updateAboutTeamMessage({})).rejects.toThrow("Failed to create about team message");
      });

      it("updateAboutTeamMessage throws if update fails", async () => {
        const selectChain = createMockDbChain([{ id: 1 }]);
        const updateChain = createMockDbChain([]);
        vi.mocked(db.select).mockReturnValue(selectChain);
        vi.mocked(db.update).mockReturnValue(updateChain);

        await expect(aboutRepository.updateAboutTeamMessage({})).rejects.toThrow("Failed to update about team message");
      });
    });

    describe("getAboutBatch", () => {
      it("returns cached batch if available", async () => {
        vi.mocked(mockCache.get).mockResolvedValue({ some: "batch" });
        const res = await aboutRepository.getAboutBatch();
        expect(res).toEqual({ some: "batch" });
      });

      it("hydrates batch from individual queries and resolves media assets", async () => {
        vi.mocked(mockCache.get).mockResolvedValue(null);

        // We will mock db queries one by one since they are run in parallel,
        // it's easier to spy on the methods or just mock db.select generally.
        // Or we can mock the class methods.
        vi.spyOn(aboutRepository, "getAboutHero").mockResolvedValue({ id: 1, imageId: 10, videoId: 11, backgroundMediaId: 12 } as any);
        vi.spyOn(aboutRepository, "getAboutTimelineEntries").mockResolvedValue([{ id: 1, imageId: 13, imageUrl: "test" }] as any);
        vi.spyOn(aboutRepository, "getAboutMapLocations").mockResolvedValue([{ id: 1 }] as any);
        vi.spyOn(aboutRepository, "getAboutSections").mockResolvedValue([{ id: 1, imageId: 14, mediaIds: [15] }, { id: 2, mediaIds: "invalid" }] as any);
        vi.spyOn(aboutRepository, "getAboutStatistics").mockResolvedValue([{ id: 1 }] as any);
        vi.spyOn(aboutRepository, "getAboutTeamMessage").mockResolvedValue({ id: 1, imageId: 16 } as any);

        vi.mocked(mediaRepository.getMediaAssetsByIds).mockResolvedValue([{ id: 10, url: "media10" }] as any);

        const res = await aboutRepository.getAboutBatch();
        
        expect(res.hero?.id).toBe(1);
        expect(res.timeline.length).toBe(1);
        expect(res.locations.length).toBe(1);
        expect(res.sections.length).toBe(2);
        expect(res.statistics.length).toBe(1);
        expect(res.teamMessage?.id).toBe(1);
        expect(res.mediaAssets).toEqual([{ id: 10, url: "media10" }]);
        expect(mediaRepository.getMediaAssetsByIds).toHaveBeenCalledWith(["10", "11", "12", "13", "14", "15", "16"]);
        expect(mockCache.set).toHaveBeenCalledWith("about:batch", res, 1800, "data");
      });
      
      it("handles null return values for batch elements and no mediaIds", async () => {
        vi.mocked(mockCache.get).mockResolvedValue(null);

        vi.spyOn(aboutRepository, "getAboutHero").mockResolvedValue(undefined);
        vi.spyOn(aboutRepository, "getAboutTimelineEntries").mockResolvedValue([]);
        vi.spyOn(aboutRepository, "getAboutMapLocations").mockResolvedValue([]);
        vi.spyOn(aboutRepository, "getAboutSections").mockResolvedValue([]);
        vi.spyOn(aboutRepository, "getAboutStatistics").mockResolvedValue([]);
        vi.spyOn(aboutRepository, "getAboutTeamMessage").mockResolvedValue(undefined);

        const res = await aboutRepository.getAboutBatch();
        expect(res.hero).toBeNull();
        expect(res.teamMessage).toBeNull();
        expect(res.mediaAssets).toEqual([]);
        expect(mediaRepository.getMediaAssetsByIds).not.toHaveBeenCalled();
      });
    });
  });
});
