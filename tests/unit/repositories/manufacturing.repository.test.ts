import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../server/db.js";
import { UnifiedCache } from "../../../server/lib/cache/unified-cache.js";
import { StorageSingleton } from "../../../server/lib/storage-singleton.js";
import { manufacturingRepository } from "../../../server/services/repositories/page-content/manufacturing.repository.js";

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

vi.mock("../../../server/lib/cache/cache-keys.js", () => ({
  CacheKeys: {
    manufacturing: {
      hero: vi.fn().mockReturnValue("manufacturing:hero"),
      caseStudies: vi.fn().mockReturnValue("manufacturing:case_studies"),
    },
  },
}));

vi.mock("../../../server/lib/cache/cache-strategies.js", () => ({
  CacheOperations: {
    invalidateManufacturing: vi.fn(),
  },
}));

vi.mock("../../../server/lib/storage-singleton.js", () => {
  const mockStorageInstance = {
    getManufacturingHero: vi.fn().mockResolvedValue({ id: 2 }),
    updateManufacturingHero: vi.fn().mockResolvedValue({ id: 2 }),
    getManufacturingCapabilities: vi.fn().mockResolvedValue([{ id: 2 }]),
    getManufacturingCapability: vi.fn().mockResolvedValue({ id: 2 }),
    createManufacturingCapability: vi.fn().mockResolvedValue({ id: 2 }),
    updateManufacturingCapability: vi.fn().mockResolvedValue({ id: 2 }),
    deleteManufacturingCapability: vi.fn().mockResolvedValue(true),
    reorderManufacturingCapabilities: vi.fn().mockResolvedValue(undefined),
    getManufacturingProcesses: vi.fn().mockResolvedValue([{ id: 2 }]),
    getManufacturingProcess: vi.fn().mockResolvedValue({ id: 2 }),
    createManufacturingProcess: vi.fn().mockResolvedValue({ id: 2 }),
    updateManufacturingProcess: vi.fn().mockResolvedValue({ id: 2 }),
    deleteManufacturingProcess: vi.fn().mockResolvedValue(true),
    reorderManufacturingProcesses: vi.fn().mockResolvedValue(undefined),
    getManufacturingQualities: vi.fn().mockResolvedValue([{ id: 2 }]),
    getManufacturingQuality: vi.fn().mockResolvedValue({ id: 2 }),
    createManufacturingQuality: vi.fn().mockResolvedValue({ id: 2 }),
    updateManufacturingQuality: vi.fn().mockResolvedValue({ id: 2 }),
    deleteManufacturingQuality: vi.fn().mockResolvedValue(true),
    reorderManufacturingQualities: vi.fn().mockResolvedValue(undefined),
    getManufacturingCaseStudies: vi.fn().mockResolvedValue([{ id: 2 }]),
    getManufacturingCaseStudy: vi.fn().mockResolvedValue({ id: 2 }),
    createManufacturingCaseStudy: vi.fn().mockResolvedValue({ id: 2 }),
    updateManufacturingCaseStudy: vi.fn().mockResolvedValue({ id: 2 }),
    deleteManufacturingCaseStudy: vi.fn().mockResolvedValue(true),
    reorderManufacturingCaseStudies: vi.fn().mockResolvedValue(undefined),
  };
  return {
    StorageSingleton: {
      hasInstance: vi.fn(() => false),
      getInstance: vi.fn(() => mockStorageInstance),
    },
  };
});

describe("ManufacturingRepository", () => {
  let unifiedCache: any;

  beforeEach(() => {
    vi.clearAllMocks();
    unifiedCache = UnifiedCache.getInstance();
  });

  describe("Hero", () => {
    it("should fetch hero from cache", async () => {
      unifiedCache.get.mockResolvedValueOnce({ id: 1 });
      const result = await manufacturingRepository.getManufacturingHero();
      expect(result).toBeDefined();
    });

    it("should fetch hero from db", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingHero();
      expect(result).toBeDefined();
    });

    it("should update hero (existing)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.updateManufacturingHero({ title: "Updated" });
      expect(result).toBeDefined();
    });

    it("should update hero (create new)", async () => {
      unifiedCache.get.mockResolvedValueOnce(null);
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([] as any)) // get existing
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any)); // create
      const result = await manufacturingRepository.updateManufacturingHero({ title: "New" } as any);
      expect(result).toBeDefined();
    });
  });

  describe("Capabilities", () => {
    it("should fetch capabilities from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingCapabilities();
      expect(result).toBeDefined();
    });

    it("should fetch capability item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingCapability(1);
      expect(result).toBeDefined();
    });

    it("should create capability", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.createManufacturingCapability({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update capability", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.updateManufacturingCapability(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete capability", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await manufacturingRepository.deleteManufacturingCapability(1);
      expect(result).toBe(true);
    });

    it("should reorder capabilities", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.reorderManufacturingCapabilities([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Processes", () => {
    it("should fetch processes from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingProcesses();
      expect(result).toBeDefined();
    });

    it("should fetch process item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingProcess(1);
      expect(result).toBeDefined();
    });

    it("should create process", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.createManufacturingProcess({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update process", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.updateManufacturingProcess(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete process", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await manufacturingRepository.deleteManufacturingProcess(1);
      expect(result).toBe(true);
    });

    it("should reorder processes", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.reorderManufacturingProcesses([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Qualities", () => {
    it("should fetch qualities from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingQualities();
      expect(result).toBeDefined();
    });

    it("should fetch quality item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingQuality(1);
      expect(result).toBeDefined();
    });

    it("should create quality", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.createManufacturingQuality({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update quality", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.updateManufacturingQuality(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete quality", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await manufacturingRepository.deleteManufacturingQuality(1);
      expect(result).toBe(true);
    });

    it("should reorder qualities", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.reorderManufacturingQualities([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("Case Studies", () => {
    it("should fetch case studies from db", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingCaseStudies();
      expect(result).toBeDefined();
    });

    it("should fetch case study item", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.getManufacturingCaseStudy(1);
      expect(result).toBeDefined();
    });

    it("should create case study", async () => {
      vi.mocked(db.then)
        .mockImplementationOnce((resolve: any) => resolve([{ max: 1 }] as any))
        .mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.createManufacturingCaseStudy({
        title: "New",
      } as any);
      expect(result).toBeDefined();
    });

    it("should update case study", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.updateManufacturingCaseStudy(1, {
        title: "Updated",
      });
      expect(result).toBeDefined();
    });

    it("should delete case study", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve({ rowCount: 1 } as any));
      const result = await manufacturingRepository.deleteManufacturingCaseStudy(1);
      expect(result).toBe(true);
    });

    it("should reorder case studies", async () => {
      vi.mocked(db.then).mockImplementationOnce((resolve: any) => resolve([{ id: 1 }] as any));
      const result = await manufacturingRepository.reorderManufacturingCaseStudies([1]);
      expect(result).toBeUndefined();
    });
  });

  describe("StorageSingleton Fallbacks", () => {
    it("should use StorageSingleton when available", async () => {
      vi.mocked(StorageSingleton.hasInstance).mockReturnValueOnce(true);
      const instance = StorageSingleton.getInstance();
      const result = await manufacturingRepository.getManufacturingHero();
      expect(instance.getManufacturingHero).toHaveBeenCalled();
      expect(result?.id).toBe(2);
    });
  });
});
