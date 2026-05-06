import { ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../server/lib/cache/cache-strategies.js";
import { aboutRepository } from "../../../server/lib/db/repositories/index.js";
import { aboutService } from "../../../server/services/about.service.js";

vi.mock("../../../server/lib/db/repositories/index.js", () => ({
  aboutRepository: {
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
    getAboutBatch: vi.fn(),
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
    it("should aggregate all about sections via repository", async () => {
      const mockBatchData = {
        hero: { id: 1, headline: "Hero" },
        timeline: [{ id: 1, year: "2020", title: "Start" }],
        locations: [{ id: 1, name: "HQ" }],
        sections: [{ id: 1, title: "Mission" }],
        statistics: [{ id: 1, label: "Stats", value: "100" }],
        teamMessage: { id: 1, name: "CEO", message: "Hello" },
      };

      vi.mocked(aboutRepository.getAboutBatch).mockResolvedValue(mockBatchData as any);

      const result = await aboutService.getAllAboutData();

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.hero?.headline).toBe("Hero");
      expect(data.timeline).toHaveLength(1);
      expect(data.sections).toHaveLength(1);
    });

    it("should return error when repository fails", async () => {
      vi.mocked(aboutRepository.getAboutBatch).mockRejectedValue(new Error("DB Error"));

      const result = await aboutService.getAllAboutData();

      expect(result.isErr()).toBe(true);
    });
  });

  describe("Timeline Management", () => {
    it("should create timeline entry and invalidate cache", async () => {
      const entryData = { year: "2025", title: "Future" };
      vi.mocked(aboutRepository.createAboutTimelineEntry).mockResolvedValue({
        id: 2,
        ...entryData,
      } as any);

      const result = await aboutService.createTimelineEntry(entryData as any);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(2);
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });

    it("should update timeline entry and invalidate cache", async () => {
      const updateData = { title: "Updated" };
      vi.mocked(aboutRepository.updateAboutTimelineEntry).mockResolvedValue({
        id: 1,
        year: "2020",
        ...updateData,
      } as any);

      const result = await aboutService.updateTimelineEntry(1, updateData);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().title).toBe("Updated");
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });

    it("should delete timeline entry and invalidate cache", async () => {
      vi.mocked(aboutRepository.deleteAboutTimelineEntry).mockResolvedValue(true);

      const result = await aboutService.deleteTimelineEntry(1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });
  });
});
