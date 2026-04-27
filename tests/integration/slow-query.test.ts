/**
 * Slow Query Logging — Unit Tier
 *
 * The original spawned-server test required a real pg_sleep endpoint and a
 * live database. This rewrite tests the QueryPerformanceMonitor class directly:
 * inject a slow metric, assert the logger emits the expected slow-query pattern.
 *
 * To re-enable the full spawned-server integration tier, set ENABLE_SLOW_QUERY_TESTS=true.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock logger before importing the monitor so it captures all calls
vi.mock("../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock UnifiedCache so QueryPerformanceMonitor.persistMetrics() doesn't throw
vi.mock("../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: () => ({
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    }),
  },
}));

describe("Slow Query Logging (Unit Tier)", () => {
  let monitor: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { QueryPerformanceMonitor } = await import("../../server/lib/db/query-performance.js");
    monitor = QueryPerformanceMonitor.getInstance();
    // Reset in-class state (consecutiveSlowQueries, lastAlertTime, metrics buffer)
    monitor.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should emit a 🐌 SLOW QUERY warning when a user-facing query exceeds 400ms", async () => {
    const { logger } = await import("../../server/lib/monitoring/logger.js");

    // USER_FACING category threshold is 400ms; 1200ms triggers a slow-query log
    monitor.recordQuery({
      operation: "getProductsSummary", // matches USER_FACING pattern
      duration: 1200,
      timestamp: Date.now(),
      cacheHit: false,
    });

    const warnCalls = vi.mocked(logger.warn).mock.calls.map(([msg]) => String(msg));
    const errorCalls = vi.mocked(logger.error).mock.calls.map(([msg]) => String(msg));
    const allCalls = [...warnCalls, ...errorCalls];

    const hasSlowQueryLog = allCalls.some(
      (msg) => msg.includes("SLOW QUERY") || msg.includes("🐌") || msg.includes("🚨"),
    );

    expect(hasSlowQueryLog).toBe(true);

    // Verify the duration context is present in the log metadata
    const allCallArgs = [
      ...vi.mocked(logger.warn).mock.calls,
      ...vi.mocked(logger.error).mock.calls,
    ];
    const hasDurationContext = allCallArgs.some((args) => {
      const meta = args[1] as Record<string, unknown> | undefined;
      return meta && "duration" in meta && Number(meta.duration) > 1000;
    });
    expect(hasDurationContext).toBe(true);
  });

  it("should NOT emit slow query log for fast queries under threshold", async () => {
    const { logger } = await import("../../server/lib/monitoring/logger.js");

    monitor.recordQuery({
      operation: "getProductsSummary",
      duration: 150, // Well under 400ms threshold
      timestamp: Date.now(),
      cacheHit: false,
    });

    const slowWarnCalls = vi
      .mocked(logger.warn)
      .mock.calls.filter(([msg]) => String(msg).includes("SLOW QUERY"));

    expect(slowWarnCalls).toHaveLength(0);
  });
});
