/**
 * QUERY PERFORMANCE MONITOR & POOL TIMEOUT CALIBRATION TEST
 *
 * Verifies:
 * 1. Calibrated query thresholds (environment-aware, USER_FACING patterns).
 * 2. Phase-level duration evaluation (raw dbQuery driver execution vs wall-clock aggregate).
 * 3. Elimination of redundant outer performance tracking in AccessoryRepository.getAccessoriesWithCount.
 * 4. Neon database pool connectionTimeoutMillis increased to 10000 (10s).
 */

import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock logger before importing the monitor
vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock UnifiedCache so persistence doesn't throw
vi.mock("../../lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: () => ({
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      clearPattern: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock db and circuit breaker for accessory-repository tests
vi.mock("../../db.js", () => {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  };
  chain.then = (resolve: any) => resolve([]);
  return {
    db: {
      select: vi.fn().mockReturnValue(chain),
      insert: vi.fn().mockReturnValue(chain),
      update: vi.fn().mockReturnValue(chain),
      delete: vi.fn().mockReturnValue(chain),
    },
  };
});

vi.mock("../../lib/db/db-circuit-breaker.js", () => ({
  dbCircuitBreaker: {
    execute: vi.fn((cb) => cb()),
  },
}));

describe("Query Stopwatch Calibration & Neon Pool Timeout", () => {
  let monitor: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { QueryPerformanceMonitor } = await import("../../lib/db/query-performance.js");
    monitor = QueryPerformanceMonitor.getInstance();
    monitor.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Calibrated Thresholds & Categories", () => {
    it("configures non-production threshold to 750ms for USER_FACING queries", () => {
      const userFacingPatterns = [
        "getProducts",
        "getCategories",
        "getProductById",
        "getProductByPath",
        "getMedia",
        "getAccessories",
        "getAccessoriesWithCount",
        "getMediaAssets",
        "getProductsSummary",
        "getHomepageFeaturedProducts",
        "getMediaAssetsWithCount",
        "getMediaAssetsByIds",
      ];

      for (const pattern of userFacingPatterns) {
        expect(monitor.getQueryThreshold(pattern)).toBe(750);
      }
    });

    it("configures non-production threshold to 750ms for uncategorized queries", () => {
      expect(monitor.getQueryThreshold("unknownCustomOperation")).toBe(750);
    });

    it("preserves thresholds for other categories", () => {
      expect(monitor.getQueryThreshold("warmCache")).toBe(2000);
      expect(monitor.getQueryThreshold("cleanup")).toBe(1000);
      expect(monitor.getQueryThreshold("createProduct")).toBe(800);
    });
  });

  describe("2. Raw Database Execution (phases.dbQuery) Evaluation", () => {
    it("does NOT alert when wall-clock exceeds threshold but phases.dbQuery is fast", async () => {
      const { logger } = await import("../../lib/monitoring/logger.js");

      // Wall-clock is 950ms (> 750ms threshold), but raw SQL dbQuery was only 45ms
      monitor.recordQuery({
        operation: "getProductsSummary",
        duration: 950,
        timestamp: Date.now(),
        cacheHit: false,
        phases: {
          cacheRead: 5,
          dbQuery: 45,
          cacheWrite: 900,
        },
      });

      const warnCalls = vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg));
      const slowLogs = warnCalls.filter((msg) => msg.includes("SLOW QUERY"));
      expect(slowLogs).toHaveLength(0);

      const stats = monitor.getPerformanceStats();
      expect(stats.slowQueries).toBe(0);
    });

    it("DOES alert when phases.dbQuery itself exceeds the threshold", async () => {
      const { logger } = await import("../../lib/monitoring/logger.js");

      // Raw SQL driver execution is 850ms (> 750ms threshold)
      monitor.recordQuery({
        operation: "getProductsSummary",
        duration: 900,
        timestamp: Date.now(),
        cacheHit: false,
        phases: {
          cacheRead: 5,
          dbQuery: 850,
          cacheWrite: 45,
        },
      });

      const allLogs = [
        ...vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg)),
        ...vi.mocked(logger.error).mock.calls.map(([msg]) => String(msg)),
      ];
      const slowLogs = allLogs.filter(
        (msg) => msg.includes("SLOW QUERY") || msg.includes("🐌") || msg.includes("🚨"),
      );
      expect(slowLogs.length).toBeGreaterThan(0);

      // Verify duration reported in log context is the raw dbQuery (850ms)
      const allArgs = [...vi.mocked(logger.warn).mock.calls, ...vi.mocked(logger.error).mock.calls];
      const hasDbQueryDuration = allArgs.some((args) => {
        const meta = args[1] as Record<string, unknown> | undefined;
        return meta && "duration" in meta && Number(meta.duration) === 850;
      });
      expect(hasDbQueryDuration).toBe(true);

      const stats = monitor.getPerformanceStats();
      expect(stats.slowQueries).toBe(1);
    });

    it("falls back to wall-clock duration when phases.dbQuery is not present", async () => {
      const { logger } = await import("../../lib/monitoring/logger.js");

      // 600ms is below the calibrated 750ms threshold in dev/test
      monitor.recordQuery({
        operation: "getProductsSummary",
        duration: 600,
        timestamp: Date.now(),
        cacheHit: false,
      });

      const allLogsFirst = [
        ...vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg)),
        ...vi.mocked(logger.error).mock.calls.map(([msg]) => String(msg)),
      ];
      expect(allLogsFirst.filter((msg) => msg.includes("SLOW QUERY"))).toHaveLength(0);

      // 800ms is above 750ms -> triggers slow query
      monitor.recordQuery({
        operation: "getProductsSummary",
        duration: 800,
        timestamp: Date.now(),
        cacheHit: false,
      });

      const allLogsSecond = [
        ...vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg)),
        ...vi.mocked(logger.error).mock.calls.map(([msg]) => String(msg)),
      ];
      expect(
        allLogsSecond.filter(
          (msg) => msg.includes("SLOW QUERY") || msg.includes("🐌") || msg.includes("🚨"),
        ).length,
      ).toBeGreaterThan(0);
    });

    it("evaluates phases.dbQuery when completed via QueryTracker", async () => {
      const { logger } = await import("../../lib/monitoring/logger.js");

      const tracker = monitor.startQuery("getHomepageFeaturedProducts");
      tracker.addPhaseTiming("dbQuery", 35);
      tracker.addPhaseTiming("cacheWrite", 10);
      tracker.complete();

      const stats = monitor.getPerformanceStats();
      expect(stats.totalQueries).toBe(1);
      expect(stats.slowQueries).toBe(0);

      const warnCalls = vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg));
      expect(warnCalls.filter((msg) => msg.includes("SLOW QUERY"))).toHaveLength(0);
    });
  });

  describe("3. AccessoryRepository Outer Tracking Elimination", () => {
    it("does not start redundant getAccessoriesWithCount query tracker", async () => {
      const { accessoryRepository } = await import(
        "../../services/repositories/accessory-repository.js"
      );

      const startQuerySpy = vi.spyOn(monitor, "startQuery");

      await accessoryRepository.getAccessoriesWithCount(10, 0);

      // Verify startQuery was NOT called with getAccessoriesWithCount
      const trackedOps = startQuerySpy.mock.calls.map(([op]) => op);
      expect(trackedOps).not.toContain("getAccessoriesWithCount");
      // But getAccessories is still tracked cleanly
      expect(trackedOps).toContain("getAccessories");
    });
  });

  describe("4. Neon Pool Timeout Configuration", () => {
    it("configures connectionTimeoutMillis to 10000ms (10s) in server/db.ts", () => {
      const dbPath = path.resolve(__dirname, "../../db.ts");
      const dbContent = fs.readFileSync(dbPath, "utf-8");

      expect(dbContent).toMatch(/connectionTimeoutMillis:\s*10000/);
      expect(dbContent).not.toMatch(/connectionTimeoutMillis:\s*5000/);
    });
  });
});
