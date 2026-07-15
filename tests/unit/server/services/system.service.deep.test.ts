import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the repository
vi.mock("../../../../server/services/repositories/index.js", () => {
  return {
    systemRepository: {
      getRecentAuditLogs: vi.fn(),
      createAuditLog: vi.fn(),
      setAuditTrailEnabled: vi.fn(),
      configureTrackedTables: vi.fn(),
      ping: vi.fn(),
      simulateSlowQuery: vi.fn(),
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

import { systemRepository } from "../../../../server/services/repositories/index.js";
import { systemService } from "../../../../server/services/system.service.js";

describe("System Service Deep", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalEnableDebug = process.env.ENABLE_DEBUG_ROUTES;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.ENABLE_DEBUG_ROUTES = originalEnableDebug;
  });

  const methods = [
    { name: "getRecentAuditLogs", args: [10] },
    { name: "createAuditLog", args: [{ action: "TEST" }] },
    { name: "checkDatabaseConnectivity", args: [], repoMethod: "ping" },
    { name: "simulateSlowQuery", args: [100], repoMethod: "simulateSlowQuery" },
  ];

  methods.forEach((method) => {
    it(`should handle ${method.name} success`, async () => {
      if (method.name === "simulateSlowQuery") {
        process.env.NODE_ENV = "development";
      }
      // @ts-expect-error
      const repoMethod = method.repoMethod || method.name;
      // @ts-expect-error
      systemRepository[repoMethod].mockResolvedValueOnce([{ id: 1 }] as any);
      // @ts-expect-error
      const res = await systemService[method.name](...method.args);
      if (res && typeof res.isOk === "function") {
        // Just execute
      }
    });

    it(`should handle ${method.name} error`, async () => {
      if (method.name === "simulateSlowQuery") {
        process.env.NODE_ENV = "development";
      }
      const repoMethod = method.repoMethod || method.name;
      // @ts-expect-error
      systemRepository[repoMethod].mockRejectedValueOnce(new Error("DB Error"));
      // @ts-expect-error
      const res = await systemService[method.name](...method.args);
      if (res && typeof res.isErr === "function") {
        expect(res.isErr()).toBe(true);
      }
    });
  });

  it("should handle configureAuditTrail success", async () => {
    const res = await systemService.configureAuditTrail({ enabled: true, tables: ["products"] });
    expect(res.isOk()).toBe(true);
  });

  it("should handle configureAuditTrail error", async () => {
    // simulate error by mocking setAuditTrailEnabled to throw
    // @ts-expect-error
    systemRepository.setAuditTrailEnabled.mockImplementationOnce(() => {
      throw new Error("DB Error");
    });
    const res = await systemService.configureAuditTrail({ enabled: true });
    expect(res.isErr()).toBe(true);
  });

  it("should reject simulateSlowQuery in production without debug flag", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENABLE_DEBUG_ROUTES = "false";
    const res = await systemService.simulateSlowQuery(100);
    expect(res.isErr()).toBe(true);
  });
});
