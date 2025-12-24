import { beforeEach, describe, expect, it, vi } from "vitest";
import { unifiedCache } from "../../server/lib/unified-cache.js";
import { unifiedMemoryCache } from "../../server/lib/unified-memory-cache.js";

describe("UnifiedMemoryCache", () => {
  beforeEach(async () => {
    // Clear cache before each test
    await unifiedCache.clear();
    vi.restoreAllMocks();
  });

  it("should execute fetchFn on cache miss (L1 Miss -> Loader)", async () => {
    const mockData = { id: 1, name: "Test" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);
    const key = "test:miss";

    const { data, benchmark } = await unifiedMemoryCache.get(key, fetchFn);

    expect(data).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(benchmark.hit).toBe("MISS");
    expect(benchmark.dbTime).toBeGreaterThanOrEqual(0);
    expect(benchmark.l1Time).toBeNull();
  });

  it("should return cached data on cache hit (L1 Hit)", async () => {
    const mockData = { id: 1, name: "Test" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);
    const key = "test:hit";

    // Seed cache
    await unifiedMemoryCache.get(key, fetchFn);

    // Second call
    const { data, benchmark } = await unifiedMemoryCache.get(key, fetchFn);

    expect(data).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledTimes(1); // Should still be 1 from the seed
    expect(benchmark.hit).toBe("L1");
    expect(benchmark.l1Time).toBeGreaterThanOrEqual(0);
    expect(benchmark.dbTime).toBeNull();
  });

  it("should bypass cache when bypassCache option is true", async () => {
    const mockData = { id: 1, name: "Test" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);
    const key = "test:bypass";

    // Seed cache
    await unifiedMemoryCache.get(key, fetchFn);

    // Bypass call
    const { data, benchmark } = await unifiedMemoryCache.get(key, fetchFn, { bypassCache: true });

    expect(data).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledTimes(2); // Called again
    expect(benchmark.hit).toBe("MISS"); // Treated as miss for benchmarking
    expect(benchmark.dbTime).toBeGreaterThanOrEqual(0);
  });

  it("should propagate errors from fetchFn", async () => {
    const error = new Error("Fetch failed");
    const fetchFn = vi.fn().mockRejectedValue(error);
    const key = "test:error";

    await expect(unifiedMemoryCache.get(key, fetchFn)).rejects.toThrow("Fetch failed");
  });

  it("should support SWR config", async () => {
    const mockData = { id: 1, name: "Test" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);
    const key = "test:swr";

    // First call (Miss)
    await unifiedMemoryCache.get(key, fetchFn, {
      swrConfig: { ttl: 1000 },
    });

    // Second call (Hit)
    const { benchmark } = await unifiedMemoryCache.get(key, fetchFn, {
      swrConfig: { ttl: 1000 },
    });

    expect(benchmark.hit).toBe("L1");
  });
});
