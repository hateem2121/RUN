import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unifiedCache } from "../../../lib/cache/unified-cache.js";

describe("RFC 5861 Background SWR Cache (CACHE-01)", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    await unifiedCache.clear();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await unifiedCache.clear();
  });

  it("should perform initial loader fetch on cache miss", async () => {
    const key = `swr:test:miss:${Date.now()}`;
    const loaderFn = vi.fn(async () => ({ count: 1, text: "initial" }));

    const res = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 10,
      staleWhileRevalidate: 20,
    });

    expect(res.source).toBe("loader");
    expect(res.data).toEqual({ count: 1, text: "initial" });
    expect(loaderFn).toHaveBeenCalledTimes(1);

    const meta = unifiedCache.getSWRMetadata(key);
    expect(meta).toBeDefined();
    expect(meta?.staleAt).toBeGreaterThan(Date.now());
    expect(meta?.expiresAt).toBeGreaterThan(meta!.staleAt);
  });

  it("should return fresh data from memory if within staleAt window", async () => {
    const key = `swr:test:fresh:${Date.now()}`;
    let fetchCount = 0;
    const loaderFn = vi.fn(async () => {
      fetchCount++;
      return { count: fetchCount };
    });

    // 1. Initial Miss
    const miss = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 60,
      staleWhileRevalidate: 120,
    });
    expect(miss.source).toBe("loader");
    expect(miss.data).toEqual({ count: 1 });

    // 2. Immediate hit (Fresh window)
    const hit = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 60,
      staleWhileRevalidate: 120,
    });
    expect(hit.source).toBe("memory");
    expect(hit.data).toEqual({ count: 1 });
    expect(loaderFn).toHaveBeenCalledTimes(1);
  });

  it("should return stale data with swr_hit and revalidate in background when in stale window", async () => {
    const startTime = 1700000000000;
    let mockedNow = startTime;
    const dateSpy = vi.spyOn(Date, "now").mockImplementation(() => mockedNow);

    const key = `swr:test:stale:${startTime}`;
    let callCount = 0;
    const loaderFn = vi.fn(async () => {
      callCount++;
      return { version: callCount };
    });

    // 1. Initial Load at t = 0 (ttl = 10s, swr = 20s -> staleAt = +10s, expiresAt = +30s)
    const miss = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 10,
      staleWhileRevalidate: 20,
    });
    expect(miss.source).toBe("loader");
    expect(miss.data).toEqual({ version: 1 });
    expect(loaderFn).toHaveBeenCalledTimes(1);

    // 2. Advance time to t = 15s (past staleAt = 10s, but before expiresAt = 30s)
    mockedNow = startTime + 15000;

    // 3. Stale Hit should return version 1 immediately with source "swr_hit"
    const staleHit = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 10,
      staleWhileRevalidate: 20,
    });
    expect(staleHit.source).toBe("swr_hit");
    expect(staleHit.data).toEqual({ version: 1 });
    expect(loaderFn).toHaveBeenCalledTimes(2);

    // Allow background revalidation promise to complete
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    // 4. Next call should now see updated version 2 with fresh memory hit!
    const freshHit = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 10,
      staleWhileRevalidate: 20,
    });
    expect(freshHit.source).toBe("memory");
    expect(freshHit.data).toEqual({ version: 2 });
    expect(loaderFn).toHaveBeenCalledTimes(2);

    dateSpy.mockRestore();
  });

  it("should synchronously fetch from loader if entry is past expiresAt", async () => {
    const startTime = 1700000000000;
    let mockedNow = startTime;
    const dateSpy = vi.spyOn(Date, "now").mockImplementation(() => mockedNow);

    const key = `swr:test:expired:${startTime}`;
    let count = 0;
    const loaderFn = vi.fn(async () => {
      count++;
      return { count };
    });

    // 1. Initial Load at t = 0 (ttl = 5s, swr = 5s -> staleAt = 5s, expiresAt = 10s)
    await unifiedCache.getSWR(key, loaderFn, {
      ttl: 5,
      staleWhileRevalidate: 5,
    });
    expect(loaderFn).toHaveBeenCalledTimes(1);

    // 2. Advance time past expiresAt (t = 12s)
    mockedNow = startTime + 12000;

    // 3. Must synchronously re-fetch from loader
    const expiredRes = await unifiedCache.getSWR(key, loaderFn, {
      ttl: 5,
      staleWhileRevalidate: 5,
    });
    expect(expiredRes.source).toBe("loader");
    expect(expiredRes.data).toEqual({ count: 2 });
    expect(loaderFn).toHaveBeenCalledTimes(2);

    dateSpy.mockRestore();
  });

  it("should deduplicate concurrent in-flight requests on cache miss", async () => {
    const key = `swr:test:dedup:${Date.now()}`;
    let count = 0;
    const slowLoader = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      count++;
      return { count, name: "shared-item" };
    });

    // Run 5 requests concurrently
    const promises = Array.from({ length: 5 }, () =>
      unifiedCache.getSWR(key, slowLoader, { ttl: 60, staleWhileRevalidate: 60 }),
    );

    const results = await Promise.all(promises);

    expect(slowLoader).toHaveBeenCalledTimes(1);
    for (const res of results) {
      expect(res.data).toEqual({ count: 1, name: "shared-item" });
    }
  });

  it("should purge SWR metadata when key is deleted or cleared", async () => {
    const key = `swr:test:delete:${Date.now()}`;
    await unifiedCache.setSWR(key, { foo: "bar" }, { ttl: 60, staleWhileRevalidate: 60 });

    expect(unifiedCache.getSWRMetadata(key)).toBeDefined();

    await unifiedCache.delete(key);
    expect(unifiedCache.getSWRMetadata(key)).toBeUndefined();
  });
});
