import { describe, expect, it, vi } from "vitest";
import { calculateCacheEntrySize, unifiedCache } from "../../../server/lib/cache/unified-cache.js";

describe("Unified Cache Size Calculation (CACHE-03)", () => {
  it("should calculate size for string values as value.length + key.length", () => {
    const key = "test:key";
    const value = "Hello, world!";
    const size = calculateCacheEntrySize(value, key);
    expect(size).toBe(value.length + key.length);
  });

  it("should calculate size for Buffer values as value.length + key.length", () => {
    const key = "test:buffer";
    const buffer = Buffer.from("Hello from binary buffer!");
    const size = calculateCacheEntrySize(buffer, key);
    expect(size).toBe(buffer.length + key.length);
  });

  it("should calculate size for objects using key-count heuristic without JSON.stringify", () => {
    const key = "test:object";
    const obj = {
      id: "prod-1",
      title: "Eco Seamless Hoodie",
      price: 120,
    };
    const stringifySpy = vi.spyOn(JSON, "stringify");

    const size = calculateCacheEntrySize(obj, key);

    // Object has 3 keys: 3 * 64 + key.length + 128
    const expected = Object.keys(obj).length * 64 + key.length + 128;
    expect(size).toBe(expected);
    expect(stringifySpy).not.toHaveBeenCalled();

    stringifySpy.mockRestore();
  });

  it("should handle nested/large objects safely without allocating strings", () => {
    const key = "test:large-object";
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < 20; i++) {
      obj[`key_${i}`] = { nested: `val_${i}` };
    }

    const size = calculateCacheEntrySize(obj, key);
    expect(size).toBe(20 * 64 + key.length + 128);
  });

  it("should calculate base size for primitive or null values", () => {
    const key = "test:primitive";
    expect(calculateCacheEntrySize(null, key)).toBe(key.length + 128);
    expect(calculateCacheEntrySize(42, key)).toBe(key.length + 128);
    expect(calculateCacheEntrySize(true, key)).toBe(key.length + 128);
  });

  it("should integrate with unifiedCache set and get seamlessly", async () => {
    const testKey = `unit-test:${Date.now()}`;
    const testPayload = { message: "cache integration test", count: 42 };

    await unifiedCache.set(testKey, testPayload, 60);
    const retrieved = await unifiedCache.get<typeof testPayload>(testKey);

    expect(retrieved).toEqual(testPayload);
    await unifiedCache.delete(testKey);
  });
});
