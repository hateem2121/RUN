import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { StorageSingleton } from "../../../server/lib/storage-singleton.js";
import { technologyRepository } from "../../../server/services/repositories/page-content/technology.repository.js";

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

vi.mock("../../../server/lib/cache/unified-cache.js", () => {
  const cacheMock = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    invalidate: vi.fn(),
  };
  return {
    UnifiedCache: {
      getInstance: vi.fn().mockReturnValue(cacheMock),
    },
    unifiedCache: cacheMock,
  };
});

vi.mock("../../../server/lib/storage-singleton.js", () => ({
  StorageSingleton: {
    hasInstance: vi.fn().mockReturnValue(false),
    getInstance: vi.fn().mockReturnValue({
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
      reorderTechnologyEquipment: vi.fn(),
      getTechnologyInnovations: vi.fn(),
      getTechnologyInnovation: vi.fn(),
      createTechnologyInnovation: vi.fn(),
      updateTechnologyInnovation: vi.fn(),
      deleteTechnologyInnovation: vi.fn(),
      reorderTechnologyInnovations: vi.fn(),
      getTechnologyResearch: vi.fn(),
      getTechnologyResearchItem: vi.fn(),
      createTechnologyResearch: vi.fn(),
      updateTechnologyResearch: vi.fn(),
      deleteTechnologyResearch: vi.fn(),
      reorderTechnologyResearch: vi.fn(),
      getTechnologyRoadmap: vi.fn(),
      getTechnologyRoadmapItem: vi.fn(),
      createTechnologyRoadmap: vi.fn(),
      updateTechnologyRoadmap: vi.fn(),
      deleteTechnologyRoadmap: vi.fn(),
      reorderTechnologyRoadmap: vi.fn(),
      getTechnologyGradientSettings: vi.fn(),
      updateTechnologyGradientSettings: vi.fn(),
    }),
  },
}));

describe("TechnologyRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hero", () => {
    it("should fetch hero", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) =>
        resolve([{ id: 1, title: "Hero" }] as any),
      );
      const result = await technologyRepository.getTechnologyHero();
      expect(result).toBeDefined();
    });

    it("should update hero (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, title: "Old" }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, title: "Updated" }] as any));
      const result = await technologyRepository.updateTechnologyHero({ title: "Updated" });
      expect(result.title).toBe("Updated");
    });

    it("should update hero (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1, title: "New" }] as any));
      const result = await technologyRepository.updateTechnologyHero({ title: "New" });
      expect(result.title).toBe("New");
    });
  });

  describe("CTA", () => {
    it("should fetch cta", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyCta();
      expect(result).toBeDefined();
    });

    it("should create cta", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.createTechnologyCta({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update cta (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyCta({ title: "Updated" } as any);
      expect(result).toBeDefined();
    });

    it("should update cta (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyCta({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should delete cta", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.deleteTechnologyCta("1");
      expect(result).toBeDefined();
    });
  });

  describe("Equipment", () => {
    it("should fetch equipment", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyEquipment();
      expect(result).toBeDefined();
    });

    it("should fetch equipment item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyEquipmentItem("1");
      expect(result).toBeDefined();
    });

    it("should create equipment", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.createTechnologyEquipment({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update equipment", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyEquipment("1", {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete equipment", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.deleteTechnologyEquipment("1");
      expect(result).toBeDefined();
    });

    it("should reorder equipment", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.reorderTechnologyEquipment([
        { id: 1, sortOrder: 1 },
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe("Innovations", () => {
    it("should fetch innovations", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyInnovations();
      expect(result).toBeDefined();
    });

    it("should fetch innovation", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyInnovation("1");
      expect(result).toBeDefined();
    });

    it("should create innovation", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.createTechnologyInnovation({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update innovation", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyInnovation("1", {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete innovation", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.deleteTechnologyInnovation("1");
      expect(result).toBeDefined();
    });

    it("should reorder innovations", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.reorderTechnologyInnovations([
        { id: 1, sortOrder: 1 },
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe("Research", () => {
    it("should fetch research", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyResearch();
      expect(result).toBeDefined();
    });

    it("should fetch research item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyResearchItem("1");
      expect(result).toBeDefined();
    });

    it("should create research", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.createTechnologyResearch({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update research", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyResearch("1", { title: "Updated" });
      expect(result).toBeDefined();
    });

    it("should delete research", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.deleteTechnologyResearch("1");
      expect(result).toBeDefined();
    });

    it("should reorder research", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.reorderTechnologyResearch([
        { id: 1, sortOrder: 1 },
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe("Roadmap", () => {
    it("should fetch roadmap", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyRoadmap();
      expect(result).toBeDefined();
    });

    it("should fetch roadmap item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyRoadmapItem("1");
      expect(result).toBeDefined();
    });

    it("should create roadmap item", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.createTechnologyRoadmap({ title: "New" } as any);
      expect(result).toBeDefined();
    });

    it("should update roadmap item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyRoadmap("1", { title: "Updated" });
      expect(result).toBeDefined();
    });

    it("should delete roadmap item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.deleteTechnologyRoadmap("1");
      expect(result).toBeDefined();
    });

    it("should reorder roadmap", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.reorderTechnologyRoadmap([{ id: 1, sortOrder: 1 }]);
      expect(result).toBeUndefined();
    });
  });

  describe("Gradient Settings", () => {
    it("should fetch gradient settings", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.getTechnologyGradientSettings();
      expect(result).toBeDefined();
    });

    it("should update gradient settings (existing)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyGradientSettings({
        colorA: "red",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update gradient settings (create new)", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await technologyRepository.updateTechnologyGradientSettings({
        colorA: "red",
      } as any);
      expect(result).toBeDefined();
    });
  });

  describe("StorageSingleton Fallback", () => {
    it("should use StorageSingleton", async () => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValueOnce(true);
      const instance = StorageSingleton.getInstance();
      vi.mocked(instance.getTechnologyHero).mockResolvedValueOnce({
        id: "1",
        title: "Hero",
      } as any);
      const result = await technologyRepository.getTechnologyHero();
      expect(result).toBeDefined();
    });
  });
});
