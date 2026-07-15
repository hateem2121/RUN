import { beforeEach, describe, expect, it, vi } from "vitest";
import { twoTierBatchCache } from "../../../../../server/lib/cache/two-tier-batch";
import { unifiedCache } from "../../../../../server/lib/cache/unified-cache";
import { logger } from "../../../../../server/lib/monitoring/logger";

vi.mock("../../../../../server/lib/cache/unified-cache", () => ({
  unifiedCache: {
    getSWR: vi.fn(),
    setSWR: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TwoTierBatchCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should bypass cache when bypassCache is true", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");

    const result = await twoTierBatchCache.get("test-key", fetchFn, { bypassCache: true });

    expect(fetchFn).toHaveBeenCalled();
    expect(result.data).toBe("fresh-data");
    expect(result.benchmark.hit).toBe("MISS");
    expect(unifiedCache.setSWR).not.toHaveBeenCalled();
  });

  it("should bypass cache and set SWR when bypassCache and swrConfig are provided", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };

    const result = await twoTierBatchCache.get("test-key-swr", fetchFn, {
      bypassCache: true,
      swrConfig,
    });

    expect(fetchFn).toHaveBeenCalled();
    expect(result.data).toBe("fresh-data");
    expect(unifiedCache.setSWR).toHaveBeenCalledWith(
      "batch:test-key-swr",
      "fresh-data",
      swrConfig,
      "static",
    );
  });

  it("should return from SWR cache on memory hit", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };
    vi.mocked(unifiedCache.getSWR).mockResolvedValueOnce({
      data: "cached-data",
      source: "memory",
      timings: { totalTime: 10 },
    } as any);

    const result = await twoTierBatchCache.get("test-key-memory", fetchFn, { swrConfig });

    expect(unifiedCache.getSWR).toHaveBeenCalledWith(
      "batch:test-key-memory",
      fetchFn,
      swrConfig,
      "static",
    );
    expect(result.data).toBe("cached-data");
    expect(result.benchmark.hit).toBe("L1");
  });

  it("should return from SWR cache on KV hit", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };
    vi.mocked(unifiedCache.getSWR).mockResolvedValueOnce({
      data: "cached-data",
      source: "kv",
      timings: { totalTime: 20 },
    } as any);

    const result = await twoTierBatchCache.get("test-key-kv", fetchFn, { swrConfig });

    expect(result.data).toBe("cached-data");
    expect(result.benchmark.hit).toBe("L2");
  });

  it("should return from SWR cache on stale memory hit", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };
    vi.mocked(unifiedCache.getSWR).mockResolvedValueOnce({
      data: "cached-data",
      source: "stale_memory",
      timings: { totalTime: 10 },
    } as any);

    const result = await twoTierBatchCache.get("test-key-stale-memory", fetchFn, { swrConfig });

    expect(result.data).toBe("cached-data");
    expect(result.benchmark.hit).toBe("L1");
  });

  it("should return from SWR cache on stale KV hit", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };
    vi.mocked(unifiedCache.getSWR).mockResolvedValueOnce({
      data: "cached-data",
      source: "stale_kv",
      timings: { totalTime: 10 },
    } as any);

    const result = await twoTierBatchCache.get("test-key-stale-kv", fetchFn, { swrConfig });

    expect(result.data).toBe("cached-data");
    expect(result.benchmark.hit).toBe("L2");
  });

  it("should return from SWR cache on loader hit", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-data");
    const swrConfig = { maxAge: 60, staleWhileRevalidate: 120 };
    vi.mocked(unifiedCache.getSWR).mockResolvedValueOnce({
      data: "fresh-data",
      source: "loader",
      timings: { totalTime: 10, loaderTime: 5 },
    } as any);

    const result = await twoTierBatchCache.get("test-key-loader", fetchFn, { swrConfig });

    expect(result.data).toBe("fresh-data");
    expect(result.benchmark.hit).toBe("MISS");
  });

  it("should handle legacy path cache hit", async () => {
    const fetchFn = vi.fn();
    vi.mocked(unifiedCache.get).mockResolvedValueOnce("legacy-data");

    const result = await twoTierBatchCache.get("legacy-key", fetchFn);

    expect(unifiedCache.get).toHaveBeenCalledWith("batch:legacy-key", "static");
    expect(result.data).toBe("legacy-data");
    expect(result.benchmark.hit).toBe("L1");
  });

  it("should handle legacy path cache miss", async () => {
    const fetchFn = vi.fn().mockResolvedValue("new-legacy-data");
    vi.mocked(unifiedCache.get).mockResolvedValueOnce(null);

    const result = await twoTierBatchCache.get("legacy-key-miss", fetchFn);

    expect(fetchFn).toHaveBeenCalled();
    expect(unifiedCache.set).toHaveBeenCalledWith(
      "batch:legacy-key-miss",
      "new-legacy-data",
      1800000,
      "static",
    );
    expect(result.data).toBe("new-legacy-data");
    expect(result.benchmark.hit).toBe("MISS");
  });

  it("should invalidate cache entries", async () => {
    await twoTierBatchCache.invalidate("invalidate-key");
    expect(unifiedCache.delete).toHaveBeenCalledWith("batch:invalidate-key", "static");
    expect(unifiedCache.delete).toHaveBeenCalledWith("invalidate-key", "static");
  });

  it("should handle invalidate cache errors safely", async () => {
    vi.mocked(unifiedCache.delete).mockRejectedValueOnce(new Error("test error"));
    await twoTierBatchCache.invalidate("error-key");
    expect(logger.error).toHaveBeenCalled();
  });

  it("should log performance reports correctly with high hit rate", () => {
    // Manually push some metrics
    const metrics = twoTierBatchCache.getMetrics();
    twoTierBatchCache.logPerformanceReport("test-context");
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Performance Report"));
  });
});
