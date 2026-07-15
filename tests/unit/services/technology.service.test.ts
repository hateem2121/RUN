import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheOperations } from "../../../server/lib/cache/cache-strategies.js";
import { AppError } from "../../../server/lib/errors.js";
import { technologyRepository } from "../../../server/services/repositories/index.js";
import { technologyService } from "../../../server/services/technology.service.js";

vi.mock("../../../server/services/repositories/index.js", () => ({
  technologyRepository: {
    getTechnologyHero: vi.fn(),
    updateTechnologyHero: vi.fn(),
    getTechnologyCta: vi.fn(),
    createTechnologyCta: vi.fn(),
    updateTechnologyCta: vi.fn(),
    deleteTechnologyCta: vi.fn(),
    getTechnologyEquipment: vi.fn(),
    getTechnologyEquipmentItem: vi.fn(),
    createTechnologyEquipment: vi.fn(),
    updateTechnologyEquipment: vi.fn(),
    deleteTechnologyEquipment: vi.fn(),
    getTechnologyRoadmap: vi.fn(),
    getTechnologyRoadmapItem: vi.fn(),
    createTechnologyRoadmap: vi.fn(),
    updateTechnologyRoadmap: vi.fn(),
    deleteTechnologyRoadmap: vi.fn(),
    getTechnologyResearch: vi.fn(),
    getTechnologyResearchItem: vi.fn(),
    createTechnologyResearch: vi.fn(),
    updateTechnologyResearch: vi.fn(),
    deleteTechnologyResearch: vi.fn(),
    getTechnologyInnovations: vi.fn(),
    getTechnologyInnovation: vi.fn(),
    createTechnologyInnovation: vi.fn(),
    updateTechnologyInnovation: vi.fn(),
    deleteTechnologyInnovation: vi.fn(),
    getTechnologyGradientSettings: vi.fn(),
    updateTechnologyGradientSettings: vi.fn(),
  },
}));

vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateTechnology: vi.fn(),
  },
}));

vi.mock("../../../server/lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn(async (_name, fn) => fn()),
  DB_CIRCUIT_OPTIONS: {},
}));

describe("TechnologyService", () => {
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
          expect(CacheOperations.invalidateTechnology).toHaveBeenCalled();
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
          expect(CacheOperations.invalidateTechnology).toHaveBeenCalled();
        });
      }

      if (serviceMethods.delete) {
        it(`should delete ${entityName}`, async () => {
          vi.mocked(repoMethods.delete).mockResolvedValue(true);
          const result = await serviceMethods.delete(1);
          expect(result.isOk()).toBe(true);
          expect(CacheOperations.invalidateTechnology).toHaveBeenCalled();
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
    {
      get: technologyRepository.getTechnologyHero,
      update: technologyRepository.updateTechnologyHero,
    },
    {
      get: (_id: any) => technologyService.getHero(),
      update: (data: any) => technologyService.updateHero(data),
      updateNeedsId: false,
    },
    { id: 1, title: "Hero" },
    { title: "Hero New" },
  );

  generateEntityTests(
    "CTA",
    {
      get: technologyRepository.getTechnologyCta,
      create: technologyRepository.createTechnologyCta,
      update: technologyRepository.updateTechnologyCta,
      delete: technologyRepository.deleteTechnologyCta,
    },
    {
      get: (_id: any) => technologyService.getCta(),
      create: (data: any) => technologyService.createCta(data),
      update: (data: any) => technologyService.updateCta(data),
      delete: (id: any) => technologyService.deleteCta(id),
      updateNeedsId: false,
    },
    { id: 1, title: "CTA" },
    { title: "CTA New" },
  );

  generateEntityTests(
    "Equipment",
    {
      list: technologyRepository.getTechnologyEquipment,
      get: technologyRepository.getTechnologyEquipmentItem,
      create: technologyRepository.createTechnologyEquipment,
      update: technologyRepository.updateTechnologyEquipment,
      delete: technologyRepository.deleteTechnologyEquipment,
    },
    {
      list: () => technologyService.getEquipment(),
      get: (id: any) => technologyService.getEquipmentItem(id),
      create: (data: any) => technologyService.createEquipment(data),
      update: (id: any, data: any) => technologyService.updateEquipment(id, data),
      delete: (id: any) => technologyService.deleteEquipment(id),
      updateNeedsId: true,
    },
    { id: 1, name: "Equipment" },
    { name: "Equipment New" },
  );

  generateEntityTests(
    "Roadmap",
    {
      list: technologyRepository.getTechnologyRoadmap,
      get: technologyRepository.getTechnologyRoadmapItem,
      create: technologyRepository.createTechnologyRoadmap,
      update: technologyRepository.updateTechnologyRoadmap,
      delete: technologyRepository.deleteTechnologyRoadmap,
    },
    {
      list: () => technologyService.getRoadmap(),
      get: (id: any) => technologyService.getRoadmapItem(id),
      create: (data: any) => technologyService.createRoadmapItem(data),
      update: (id: any, data: any) => technologyService.updateRoadmapItem(id, data),
      delete: (id: any) => technologyService.deleteRoadmapItem(id),
      updateNeedsId: true,
    },
    { id: 1, title: "Roadmap" },
    { title: "Roadmap New", year: 2026, status: "completed" },
  );

  generateEntityTests(
    "Research",
    {
      list: technologyRepository.getTechnologyResearch,
      get: technologyRepository.getTechnologyResearchItem,
      create: technologyRepository.createTechnologyResearch,
      update: technologyRepository.updateTechnologyResearch,
      delete: technologyRepository.deleteTechnologyResearch,
    },
    {
      list: () => technologyService.getResearch(),
      get: (id: any) => technologyService.getResearchItem(id),
      create: (data: any) => technologyService.createResearch(data),
      update: (id: any, data: any) => technologyService.updateResearch(id, data),
      delete: (id: any) => technologyService.deleteResearch(id),
      updateNeedsId: true,
    },
    { id: 1, title: "Research" },
    { title: "Research New" },
  );

  generateEntityTests(
    "Innovation",
    {
      list: technologyRepository.getTechnologyInnovations,
      get: technologyRepository.getTechnologyInnovation,
      create: technologyRepository.createTechnologyInnovation,
      update: technologyRepository.updateTechnologyInnovation,
      delete: technologyRepository.deleteTechnologyInnovation,
    },
    {
      list: () => technologyService.getInnovations(),
      get: (id: any) => technologyService.getInnovation(id),
      create: (data: any) => technologyService.createInnovation(data),
      update: (id: any, data: any) => technologyService.updateInnovation(id, data),
      delete: (id: any) => technologyService.deleteInnovation(id),
      updateNeedsId: true,
    },
    { id: 1, name: "Innovation" },
    { name: "Innovation New" },
  );

  describe("Gradient Settings", () => {
    it("should getGradientSettings", async () => {
      vi.mocked(technologyRepository.getTechnologyGradientSettings).mockResolvedValue({
        id: 1,
      } as any);
      const result = await technologyService.getGradientSettings();
      expect(result.isOk()).toBe(true);
    });

    it("should return error if gradient settings not found", async () => {
      vi.mocked(technologyRepository.getTechnologyGradientSettings).mockResolvedValue(undefined);
      const result = await technologyService.getGradientSettings();
      expect(result.isErr()).toBe(true);
    });

    it("should updateGradientSettings", async () => {
      vi.mocked(technologyRepository.updateTechnologyGradientSettings).mockResolvedValue({
        id: 1,
      } as any);
      const result = await technologyService.updateGradientSettings({ colorStart: "#fff" });
      expect(result.isOk()).toBe(true);
      expect(CacheOperations.invalidateTechnology).toHaveBeenCalled();
    });
  });
});
