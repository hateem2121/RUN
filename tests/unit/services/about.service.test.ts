import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../server/lib/cache/cache-strategies.js";
import { AppError } from "../../../server/lib/errors.js";
import { aboutService } from "../../../server/services/about.service.js";
import { aboutRepository } from "../../../server/services/repositories/index.js";

vi.mock("../../../server/services/repositories/index.js", () => ({
  aboutRepository: {
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
  },
}));

vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateAbout: vi.fn(),
  },
}));

vi.mock("../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn(async (_name, fn) => fn()),
  DB_CIRCUIT_OPTIONS: {},
}));

describe("AboutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateEntityTests = (
    entityName: string,
    repoMethods: any,
    serviceMethods: any,
    mockData: any,
    insertData: any,
  ) => {
    describe(`${entityName} Management`, () => {
      if (serviceMethods.list) {
        it(`should list ${entityName}`, async () => {
          vi.mocked(repoMethods.list).mockResolvedValue([mockData]);
          const result = await serviceMethods.list();
          expect(result.isOk()).toBe(true);
          expect(repoMethods.list).toHaveBeenCalled();
        });
      }

      if (serviceMethods.get) {
        it(`should get ${entityName}`, async () => {
          vi.mocked(repoMethods.get).mockResolvedValue(mockData);
          const result = await serviceMethods.get(1);
          expect(result.isOk()).toBe(true);
        });

        it(`should return error if ${entityName} not found`, async () => {
          vi.mocked(repoMethods.get).mockResolvedValue(null);
          const result = await serviceMethods.get(1);
          expect(result.isErr()).toBe(true);
          expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        });
      }

      if (serviceMethods.create) {
        it(`should create ${entityName}`, async () => {
          vi.mocked(repoMethods.create).mockResolvedValue(mockData);
          const result = await serviceMethods.create(insertData);
          expect(result.isOk()).toBe(true);
          expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
        });
      }

      if (serviceMethods.update) {
        it(`should update ${entityName}`, async () => {
          vi.mocked(repoMethods.update).mockResolvedValue(mockData);
          const result = await serviceMethods.update(
            serviceMethods.updateNeedsId ? 1 : insertData,
            serviceMethods.updateNeedsId ? insertData : undefined,
          );
          expect(result.isOk()).toBe(true);
          expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
        });
      }

      if (serviceMethods.delete) {
        it(`should delete ${entityName}`, async () => {
          vi.mocked(repoMethods.delete).mockResolvedValue(true);
          const result = await serviceMethods.delete(1);
          expect(result.isOk()).toBe(true);
          expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
        });

        it(`should return error if deleting non-existent ${entityName}`, async () => {
          vi.mocked(repoMethods.delete).mockResolvedValue(false);
          const result = await serviceMethods.delete(1);
          expect(result.isErr()).toBe(true);
        });
      }
    });
  };

  generateEntityTests(
    "Hero",
    { get: aboutRepository.getAboutHero, update: aboutRepository.updateAboutHero },
    {
      get: (_id: any) => aboutService.getHero(),
      update: (data: any) => aboutService.updateHero(data),
      updateNeedsId: false,
    },
    { id: 1, title: "Hero" },
    { title: "Hero New" },
  );

  generateEntityTests(
    "Timeline",
    {
      list: aboutRepository.getAboutTimelineEntries,
      get: aboutRepository.getAboutTimelineEntry,
      create: aboutRepository.createAboutTimelineEntry,
      update: aboutRepository.updateAboutTimelineEntry,
      delete: aboutRepository.deleteAboutTimelineEntry,
    },
    {
      list: () => aboutService.getTimelineEntries(),
      get: (id: any) => aboutService.getTimelineEntry(id),
      create: (data: any) => aboutService.createTimelineEntry(data),
      update: (id: any, data: any) => aboutService.updateTimelineEntry(id, data),
      delete: (id: any) => aboutService.deleteTimelineEntry(id),
      updateNeedsId: true,
    },
    { id: 1, title: "Timeline" },
    { title: "Timeline New", year: "2026", description: "Desc" },
  );

  generateEntityTests(
    "MapLocation",
    {
      list: aboutRepository.getAboutMapLocations,
      get: aboutRepository.getAboutMapLocation,
      create: aboutRepository.createAboutMapLocation,
      update: aboutRepository.updateAboutMapLocation,
      delete: aboutRepository.deleteAboutMapLocation,
    },
    {
      list: () => aboutService.getMapLocations(),
      get: (id: any) => aboutService.getMapLocation(id),
      create: (data: any) => aboutService.createMapLocation(data),
      update: (id: any, data: any) => aboutService.updateMapLocation(id, data),
      delete: (id: any) => aboutService.deleteMapLocation(id),
      updateNeedsId: true,
    },
    { id: 1, title: "MapLocation" },
    { name: "Location", latitude: "0", longitude: "0" },
  );

  generateEntityTests(
    "Section",
    {
      list: aboutRepository.getAboutSections,
      get: aboutRepository.getAboutSection,
      create: aboutRepository.createAboutSection,
      update: aboutRepository.updateAboutSection,
      delete: aboutRepository.deleteAboutSection,
    },
    {
      list: () => aboutService.getSections(),
      get: (id: any) => aboutService.getSection(id),
      create: (data: any) => aboutService.createSection(data),
      update: (id: any, data: any) => aboutService.updateSection(id, data),
      delete: (id: any) => aboutService.deleteSection(id),
      updateNeedsId: true,
    },
    { id: 1, title: "Section" },
    { title: "Section", sectionType: "Text", content: "Content" },
  );

  generateEntityTests(
    "Statistic",
    {
      list: aboutRepository.getAboutStatistics,
      get: aboutRepository.getAboutStatistic,
      create: aboutRepository.createAboutStatistic,
      update: aboutRepository.updateAboutStatistic,
      delete: aboutRepository.deleteAboutStatistic,
    },
    {
      list: () => aboutService.getStatistics(),
      get: (id: any) => aboutService.getStatistic(id),
      create: (data: any) => aboutService.createStatistic(data),
      update: (id: any, data: any) => aboutService.updateStatistic(id, data),
      delete: (id: any) => aboutService.deleteStatistic(id),
      updateNeedsId: true,
    },
    { id: 1, label: "Stat" },
    { label: "Stat", value: "100" },
  );

  describe("Team Message", () => {
    it("should getTeamMessage", async () => {
      vi.mocked(aboutRepository.getAboutTeamMessage).mockResolvedValue({ id: 1 } as any);
      const result = await aboutService.getTeamMessage();
      expect(result.isOk()).toBe(true);
    });

    it("should return error if team message not found", async () => {
      vi.mocked(aboutRepository.getAboutTeamMessage).mockResolvedValue(null as any);
      const result = await aboutService.getTeamMessage();
      expect(result.isErr()).toBe(true);
    });

    it("should updateTeamMessage", async () => {
      vi.mocked(aboutRepository.updateAboutTeamMessage).mockResolvedValue({ id: 1 } as any);
      const result = await aboutService.updateTeamMessage({ signature: "Msg" });
      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateAbout).toHaveBeenCalled();
    });
  });

  describe("Batch Operations", () => {
    it("should getBatch", async () => {
      vi.mocked(aboutRepository.getAboutBatch).mockResolvedValue({} as any);

      const result = await aboutService.getBatch();
      expect(result.isOk()).toBe(true);
    });

    it("should getAllAboutData", async () => {
      vi.mocked(aboutRepository.getAboutBatch).mockResolvedValue({} as any);

      const result = await aboutService.getAllAboutData();
      expect(result.isOk()).toBe(true);
    });
  });
});
