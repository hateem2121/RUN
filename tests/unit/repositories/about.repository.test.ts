import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { StorageSingleton } from "../../../server/lib/storage-singleton.js";
import { aboutRepository } from "../../../server/services/repositories/page-content/about.repository.js";

vi.mock("../../../server/db.js", () => {
  const dbMock = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation(async (cb) => cb(dbMock)),
    then: vi.fn((resolve) => resolve([])),
  };
  return { db: dbMock };
});

vi.mock("../../../server/lib/cache/cache-events.js", () => ({
  emitCacheInvalidation: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      invalidate: vi.fn(),
    }),
  },
}));

vi.mock("../../../server/services/repositories/media-repository.js", () => ({
  mediaRepository: {
    getMediaAssetsByIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn().mockReturnValue(false),
    getInstance: vi.fn().mockReturnValue({
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
    }),
  },
}));

describe("AboutRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hero", () => {
    it("should fetch hero", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([{ id: 1, title: "Hero" }] as any);
      const result = await aboutRepository.getAboutHero(true);
      expect(result).toBeDefined();
      expect(result?.title).toBe("Hero");
    });

    it("should update hero (create new)", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([] as any);
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "New" }] as any);
      const result = await aboutRepository.updateAboutHero({ title: "New" });
      expect(result.title).toBe("New");
    });

    it("should update hero (existing)", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([{ id: 1, title: "Old" }] as any);
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "Updated" }] as any);
      const result = await aboutRepository.updateAboutHero({ title: "Updated" });
      expect(result.title).toBe("Updated");
    });
  });

  describe("Timeline Entries", () => {
    it("should fetch timeline entries", async () => {
      vi.mocked(db.orderBy).mockResolvedValueOnce([{ id: 1, title: "Entry 1" }] as any);
      const result = await aboutRepository.getAboutTimelineEntries(true);
      expect(result).toHaveLength(1);
    });

    it("should fetch timeline entry by id", async () => {
      vi.mocked(db.where).mockResolvedValueOnce([{ id: 1, title: "Entry 1" }] as any);
      const result = await aboutRepository.getAboutTimelineEntry(1);
      expect(result).toBeDefined();
    });

    it("should create timeline entry", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "New" }] as any);
      const result = await aboutRepository.createAboutTimelineEntry({
        title: "New",
        sortOrder: 1,
      } as any);
      expect(result.title).toBe("New");
    });

    it("should update timeline entry", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "Updated" }] as any);
      const result = await aboutRepository.updateAboutTimelineEntry(1, { title: "Updated" });
      expect(result.title).toBe("Updated");
    });

    it("should delete timeline entry", async () => {
      vi.mocked(db.where).mockResolvedValueOnce({ rowCount: 1 } as any);
      const result = await aboutRepository.deleteAboutTimelineEntry(1);
      expect(result).toBe(true);
    });

    it("should reorder timeline entries", async () => {
      await aboutRepository.reorderAboutTimelineEntries([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("Map Locations", () => {
    it("should fetch map locations", async () => {
      vi.mocked(db.orderBy).mockResolvedValueOnce([{ id: 1, name: "Location 1" }] as any);
      const result = await aboutRepository.getAboutMapLocations(true);
      expect(result).toHaveLength(1);
    });

    it("should fetch map location by id", async () => {
      vi.mocked(db.where).mockResolvedValueOnce([{ id: 1, name: "Location 1" }] as any);
      const result = await aboutRepository.getAboutMapLocation(1);
      expect(result).toBeDefined();
    });

    it("should create map location", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, name: "New" }] as any);
      const result = await aboutRepository.createAboutMapLocation({
        name: "New",
        sortOrder: 1,
      } as any);
      expect(result.name).toBe("New");
    });

    it("should update map location", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, name: "Updated" }] as any);
      const result = await aboutRepository.updateAboutMapLocation(1, { name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("should delete map location", async () => {
      vi.mocked(db.where).mockResolvedValueOnce({ rowCount: 1 } as any);
      const result = await aboutRepository.deleteAboutMapLocation(1);
      expect(result).toBe(true);
    });

    it("should reorder map locations", async () => {
      await aboutRepository.reorderAboutMapLocations([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("Sections", () => {
    it("should fetch sections", async () => {
      vi.mocked(db.orderBy).mockResolvedValueOnce([{ id: 1, title: "Section 1" }] as any);
      const result = await aboutRepository.getAboutSections(true);
      expect(result).toHaveLength(1);
    });

    it("should fetch section by id", async () => {
      vi.mocked(db.where).mockResolvedValueOnce([{ id: 1, title: "Section 1" }] as any);
      const result = await aboutRepository.getAboutSection(1);
      expect(result).toBeDefined();
    });

    it("should create section", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "New" }] as any);
      const result = await aboutRepository.createAboutSection({
        title: "New",
        sortOrder: 1,
      } as any);
      expect(result.title).toBe("New");
    });

    it("should update section", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, title: "Updated" }] as any);
      const result = await aboutRepository.updateAboutSection(1, { title: "Updated" });
      expect(result.title).toBe("Updated");
    });

    it("should delete section", async () => {
      vi.mocked(db.where).mockResolvedValueOnce({ rowCount: 1 } as any);
      const result = await aboutRepository.deleteAboutSection(1);
      expect(result).toBe(true);
    });

    it("should reorder sections", async () => {
      await aboutRepository.reorderAboutSections([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("Statistics", () => {
    it("should fetch statistics", async () => {
      vi.mocked(db.orderBy).mockResolvedValueOnce([{ id: 1, label: "Stat 1" }] as any);
      const result = await aboutRepository.getAboutStatistics(true);
      expect(result).toHaveLength(1);
    });

    it("should fetch statistic by id", async () => {
      vi.mocked(db.where).mockResolvedValueOnce([{ id: 1, label: "Stat 1" }] as any);
      const result = await aboutRepository.getAboutStatistic(1);
      expect(result).toBeDefined();
    });

    it("should create statistic", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, label: "New" }] as any);
      const result = await aboutRepository.createAboutStatistic({
        label: "New",
        sortOrder: 1,
      } as any);
      expect(result.label).toBe("New");
    });

    it("should update statistic", async () => {
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, label: "Updated" }] as any);
      const result = await aboutRepository.updateAboutStatistic(1, { label: "Updated" });
      expect(result?.label).toBe("Updated");
    });

    it("should delete statistic", async () => {
      vi.mocked(db.where).mockResolvedValueOnce({ rowCount: 1 } as any);
      const result = await aboutRepository.deleteAboutStatistic(1);
      expect(result).toBe(true);
    });

    it("should reorder statistics", async () => {
      await aboutRepository.reorderAboutStatistics([1, 2]);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("Team Message", () => {
    it("should fetch team message", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([{ id: 1, message: "Hello" }] as any);
      const result = await aboutRepository.getAboutTeamMessage(true);
      expect(result).toBeDefined();
    });

    it("should update team message (create new)", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([] as any); // get existing
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, message: "New" }] as any);
      const result = await aboutRepository.updateAboutTeamMessage({ message: "New" });
      expect(result.message).toBe("New");
    });

    it("should update team message (existing)", async () => {
      vi.mocked(db.limit).mockResolvedValueOnce([{ id: 1, message: "Old" }] as any); // get existing
      vi.mocked(db.returning).mockResolvedValueOnce([{ id: 1, message: "Updated" }] as any);
      const result = await aboutRepository.updateAboutTeamMessage({ message: "Updated" });
      expect(result.message).toBe("Updated");
    });
  });

  describe("Batch", () => {
    it("should fetch batch data", async () => {
      // Mock the respective methods inside aboutRepository
      vi.spyOn(aboutRepository, "getAboutHero").mockResolvedValueOnce({ id: 1 } as any);
      vi.spyOn(aboutRepository, "getAboutTimelineEntries").mockResolvedValueOnce([] as any);
      vi.spyOn(aboutRepository, "getAboutMapLocations").mockResolvedValueOnce([] as any);
      vi.spyOn(aboutRepository, "getAboutSections").mockResolvedValueOnce([] as any);
      vi.spyOn(aboutRepository, "getAboutStatistics").mockResolvedValueOnce([] as any);
      vi.spyOn(aboutRepository, "getAboutTeamMessage").mockResolvedValueOnce({ id: 1 } as any);

      const result = await aboutRepository.getAboutBatch();
      expect(result.hero).toBeDefined();
      expect(result._meta).toBeDefined();
    });
  });

  describe("StorageSingleton Fallbacks", () => {
    beforeEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(true);
    });

    afterEach(() => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValue(false);
    });

    it("should use StorageSingleton for hero methods", async () => {
      const instance = StorageSingleton.getInstance();
      vi.mocked(instance.getAboutHero).mockResolvedValue({ id: 1, title: "Hero" });
      const result = await aboutRepository.getAboutHero(true);
      expect(result).toBeDefined();
      expect(instance.getAboutHero).toHaveBeenCalled();

      await aboutRepository.updateAboutHero({ title: "Updated" });
      expect(instance.updateAboutHero).toHaveBeenCalled();
    });

    it("should use StorageSingleton for timeline entries", async () => {
      const instance = StorageSingleton.getInstance();

      await aboutRepository.getAboutTimelineEntries();
      expect(instance.getAboutTimelineEntries).toHaveBeenCalled();

      await aboutRepository.getAboutTimelineEntry(1);
      expect(instance.getAboutTimelineEntry).toHaveBeenCalled();

      await aboutRepository.createAboutTimelineEntry({ title: "New" } as any);
      expect(instance.createAboutTimelineEntry).toHaveBeenCalled();

      vi.mocked(instance.updateAboutTimelineEntry).mockResolvedValue({ id: 1 } as any);
      await aboutRepository.updateAboutTimelineEntry(1, { title: "Updated" });
      expect(instance.updateAboutTimelineEntry).toHaveBeenCalled();

      await aboutRepository.deleteAboutTimelineEntry(1);
      expect(instance.deleteAboutTimelineEntry).toHaveBeenCalled();

      await aboutRepository.reorderAboutTimelineEntries([1, 2]);
      expect(instance.reorderAboutTimelineEntries).toHaveBeenCalled();
    });

    it("should use StorageSingleton for map locations", async () => {
      const instance = StorageSingleton.getInstance();

      await aboutRepository.getAboutMapLocations();
      expect(instance.getAboutMapLocations).toHaveBeenCalled();

      await aboutRepository.getAboutMapLocation(1);
      expect(instance.getAboutMapLocation).toHaveBeenCalled();

      await aboutRepository.createAboutMapLocation({ name: "New" } as any);
      expect(instance.createAboutMapLocation).toHaveBeenCalled();

      vi.mocked(instance.updateAboutMapLocation).mockResolvedValue({ id: 1 } as any);
      await aboutRepository.updateAboutMapLocation(1, { name: "Updated" });
      expect(instance.updateAboutMapLocation).toHaveBeenCalled();

      await aboutRepository.deleteAboutMapLocation(1);
      expect(instance.deleteAboutMapLocation).toHaveBeenCalled();

      await aboutRepository.reorderAboutMapLocations([1, 2]);
      expect(instance.reorderAboutMapLocations).toHaveBeenCalled();
    });

    it("should use StorageSingleton for sections", async () => {
      const instance = StorageSingleton.getInstance();

      await aboutRepository.getAboutSections();
      expect(instance.getAboutSections).toHaveBeenCalled();

      await aboutRepository.getAboutSection(1);
      expect(instance.getAboutSection).toHaveBeenCalled();

      await aboutRepository.createAboutSection({ title: "New" } as any);
      expect(instance.createAboutSection).toHaveBeenCalled();

      vi.mocked(instance.updateAboutSection).mockResolvedValue({ id: 1 } as any);
      await aboutRepository.updateAboutSection(1, { title: "Updated" });
      expect(instance.updateAboutSection).toHaveBeenCalled();

      await aboutRepository.deleteAboutSection(1);
      expect(instance.deleteAboutSection).toHaveBeenCalled();

      await aboutRepository.reorderAboutSections([1, 2]);
      expect(instance.reorderAboutSections).toHaveBeenCalled();
    });

    it("should use StorageSingleton for statistics", async () => {
      const instance = StorageSingleton.getInstance();

      await aboutRepository.getAboutStatistics();
      expect(instance.getAboutStatistics).toHaveBeenCalled();

      await aboutRepository.getAboutStatistic(1);
      expect(instance.getAboutStatistic).toHaveBeenCalled();

      await aboutRepository.createAboutStatistic({ label: "New" } as any);
      expect(instance.createAboutStatistic).toHaveBeenCalled();

      await aboutRepository.updateAboutStatistic(1, { label: "Updated" });
      expect(instance.updateAboutStatistic).toHaveBeenCalled();

      await aboutRepository.deleteAboutStatistic(1);
      expect(instance.deleteAboutStatistic).toHaveBeenCalled();

      await aboutRepository.reorderAboutStatistics([1, 2]);
      expect(instance.reorderAboutStatistics).toHaveBeenCalled();
    });

    it("should use StorageSingleton for team message", async () => {
      const instance = StorageSingleton.getInstance();

      vi.spyOn(aboutRepository, "getAboutTeamMessage").mockRestore();
      await aboutRepository.updateAboutTeamMessage({ message: "New" } as any);
      expect(instance.updateAboutTeamMessage).toHaveBeenCalled();
    });

    it("should use StorageSingleton for batch", async () => {
      const instance = StorageSingleton.getInstance();

      vi.spyOn(aboutRepository, "getAboutBatch").mockRestore();
      await aboutRepository.getAboutBatch();
      expect(instance.getAboutBatch).toHaveBeenCalled();
    });
  });
});
