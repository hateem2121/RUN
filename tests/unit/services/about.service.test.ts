import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../server/lib/cache/cache-strategies.js";
import { pageContentRepository } from "../../../server/lib/db/repositories/index.js";
import { aboutService } from "../../../server/services/about.service.js";

vi.mock("../../../server/lib/db/repositories/index.js", () => ({
  pageContentRepository: {
    getAboutHero: vi.fn(),
    updateAboutHero: vi.fn(),
    getAboutTimelineEntries: vi.fn(),
    getAboutTimelineEntry: vi.fn(),
    createAboutTimelineEntry: vi.fn(),
    updateAboutTimelineEntry: vi.fn(),
    deleteAboutTimelineEntry: vi.fn(),
    getAboutMapLocations: vi.fn(),
    getAboutMapLocation: vi.fn(),
    createAboutMapLocation: vi.fn(),
    updateAboutMapLocation: vi.fn(),
    deleteAboutMapLocation: vi.fn(),
    getAboutSections: vi.fn(),
    getAboutSection: vi.fn(),
    createAboutSection: vi.fn(),
    updateAboutSection: vi.fn(),
    deleteAboutSection: vi.fn(),
    getAboutStatistics: vi.fn(),
    getAboutStatistic: vi.fn(),
    createAboutStatistic: vi.fn(),
    updateAboutStatistic: vi.fn(),
    deleteAboutStatistic: vi.fn(),
    getAboutTeamMessage: vi.fn(),
    updateAboutTeamMessage: vi.fn(),
  },
}));

vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateAbout: vi.fn().mockResolvedValue(true),
  },
}));

describe("AboutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllAboutData", () => {
    it("should aggregate all about sections", async () => {
      vi.mocked(pageContentRepository.getAboutHero).mockResolvedValue({
        id: 1,
        title: "Hero",
      } as unknown as any);
      vi.mocked(pageContentRepository.getAboutTimelineEntries).mockResolvedValue([
        { id: 1, year: "2020" },
      ] as unknown as any);
      vi.mocked(pageContentRepository.getAboutMapLocations).mockResolvedValue([
        { id: 1, name: "HQ" },
      ] as unknown as any);
      vi.mocked(pageContentRepository.getAboutSections).mockResolvedValue([
        { id: 1, title: "Mission" },
      ] as unknown as any);
      vi.mocked(pageContentRepository.getAboutStatistics).mockResolvedValue([
        { id: 1, label: "Stats" },
      ] as unknown as any);
      vi.mocked(pageContentRepository.getAboutTeamMessage).mockResolvedValue({
        id: 1,
        name: "CEO",
      } as unknown as any);

      const data = await aboutService.getAllAboutData();

      expect(data.hero?.title).toBe("Hero");
      expect(data.timeline).toHaveLength(1);
      expect(data.sections).toHaveLength(1);
    });

    it("should handle partial failures gracefully", async () => {
      vi.mocked(pageContentRepository.getAboutHero).mockRejectedValue(new Error("DB Error"));
      vi.mocked(pageContentRepository.getAboutTimelineEntries).mockResolvedValue([]);
      vi.mocked(pageContentRepository.getAboutMapLocations).mockResolvedValue([]);
      vi.mocked(pageContentRepository.getAboutSections).mockResolvedValue([]);
      vi.mocked(pageContentRepository.getAboutStatistics).mockResolvedValue([]);
      vi.mocked(pageContentRepository.getAboutTeamMessage).mockResolvedValue(null);

      const data = await aboutService.getAllAboutData();

      expect(data.hero).toBeNull();
      expect(data.timeline).toEqual([]);
    });
  });

  describe("Timeline Management", () => {
    it("should create timeline entry and invalidate cache", async () => {
      const entryData = { year: "2025", title: "Future" };
      vi.mocked(pageContentRepository.createAboutTimelineEntry).mockResolvedValue({
        id: 2,
        ...entryData,
      } as any);

      const result = await aboutService.createTimelineEntry(entryData as any);

      expect(result.id).toBe(2);
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });

    it("should update timeline entry and invalidate cache", async () => {
      const updateData = { title: "Updated" };
      vi.mocked(pageContentRepository.updateAboutTimelineEntry).mockResolvedValue({
        id: 1,
        year: "2020",
        ...updateData,
      } as any);

      const result = await aboutService.updateTimelineEntry(1, updateData);

      expect(result.title).toBe("Updated");
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });

    it("should delete timeline entry and invalidate cache", async () => {
      vi.mocked(pageContentRepository.deleteAboutTimelineEntry).mockResolvedValue(true);

      const result = await aboutService.deleteTimelineEntry(1);

      expect(result).toBe(true);
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });
  });
});
