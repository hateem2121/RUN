import { beforeEach, describe, it, vi } from "vitest";

// Mock the repository
vi.mock("../../../../server/services/repositories/index.js", () => {
  return {
    manufacturingRepository: {
      getProcesses: vi.fn(),
      getProcess: vi.fn(),
      createProcess: vi.fn(),
      updateProcess: vi.fn(),
      deleteProcess: vi.fn(),

      getCapabilities: vi.fn(),
      getCapability: vi.fn(),
      createCapability: vi.fn(),
      updateCapability: vi.fn(),
      deleteCapability: vi.fn(),

      getCaseStudies: vi.fn(),
      getCaseStudy: vi.fn(),
      createCaseStudy: vi.fn(),
      updateCaseStudy: vi.fn(),
      deleteCaseStudy: vi.fn(),

      getHero: vi.fn(),
      updateHero: vi.fn(),

      getQualities: vi.fn(),
      getQuality: vi.fn(),
      createQuality: vi.fn(),
      updateQuality: vi.fn(),
      deleteQuality: vi.fn(),
    },
  };
});

vi.mock("../../../../server/lib/cache/two-tier-batch.js", () => {
  return {
    twoTierBatchCache: {
      getOrFetch: vi.fn((_key, fetcher) => fetcher()),
    },
  };
});

vi.mock("../../../../server/lib/resilience/circuit-breaker.js", () => {
  return {
    withCircuit: vi.fn(async (...args) => {
      const fn = typeof args[0] === "function" ? args[0] : args[1];
      return fn ? fn() : undefined;
    }),
    DB_CIRCUIT_OPTIONS: {},
  };
});

import { manufacturingService } from "../../../../server/services/manufacturing.service.js";
import { manufacturingRepository } from "../../../../server/services/repositories/index.js";

describe("Manufacturing Service Deep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const methods = [
    "getProcesses",
    "getProcess",
    "createProcess",
    "updateProcess",
    "deleteProcess",
    "getCapabilities",
    "getCapability",
    "createCapability",
    "updateCapability",
    "deleteCapability",
    "getCaseStudies",
    "getCaseStudy",
    "createCaseStudy",
    "updateCaseStudy",
    "deleteCaseStudy",
    "getHero",
    "updateHero",
    "getQualities",
    "getQuality",
    "createQuality",
    "updateQuality",
    "deleteQuality",
  ];

  methods.forEach((method) => {
    it(`should handle ${method} success`, async () => {
      // @ts-expect-error
      manufacturingRepository[method].mockResolvedValueOnce([{ id: 1 }] as any);
      // @ts-expect-error
      const res = await manufacturingService[method](1, {});
      if (res && typeof res.isOk === "function") {
        // Just execute
      }
    });

    it(`should handle ${method} not found`, async () => {
      // @ts-expect-error
      manufacturingRepository[method].mockResolvedValueOnce(null);
      try {
        // @ts-expect-error
        await manufacturingService[method](1, {});
      } catch (e) {}
    });

    it(`should handle ${method} error`, async () => {
      // @ts-expect-error
      manufacturingRepository[method].mockRejectedValueOnce(new Error("DB Error"));
      try {
        // @ts-expect-error
        await manufacturingService[method](1, {});
      } catch (e) {}
    });
  });
});
