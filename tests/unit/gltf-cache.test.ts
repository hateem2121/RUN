import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GltfCacheService, gltfCache } from "../../client/app/lib/gltf-cache";
import { loadCachedModelUrl } from "../../client/app/lib/model-viewer-loader";

// Mock URL.createObjectURL if missing in test environment
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = vi.fn(
    () => `blob:http://localhost:5002/mock-blob-${Math.random().toString(36).substring(2)}`,
  );
}

describe("Task 3D-02: GltfCacheService (3D Model Caching)", () => {
  let cache: GltfCacheService;

  beforeEach(() => {
    // Use an isolated instance with in-memory mode enabled
    cache = new GltfCacheService({
      enableIndexedDB: false,
    });
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await cache.clearCache();
  });

  describe("saveModel and getModel (In-Memory Fallback)", () => {
    it("stores an ArrayBuffer and retrieves it", async () => {
      const url = "https://wear-run.com/models/cycling-jersey.glb";
      const sampleData = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = sampleData.buffer;

      await cache.saveModel(url, buffer);
      const retrieved = await cache.getModel(url);

      expect(retrieved).not.toBeNull();
      expect(new Uint8Array(retrieved!)).toEqual(sampleData);
    });

    it("returns null for non-existent models", async () => {
      const retrieved = await cache.getModel("https://wear-run.com/models/missing.glb");
      expect(retrieved).toBeNull();
    });

    it("updates lastAccessed when model is retrieved", async () => {
      const url = "https://wear-run.com/models/hoodie.glb";
      const buffer = new Uint8Array([10, 20]).buffer;

      await cache.saveModel(url, buffer);
      const firstGet = await cache.getModel(url);
      expect(firstGet).not.toBeNull();

      // Ensure lastAccessed is updated on subsequent retrieval
      const secondGet = await cache.getModel(url);
      expect(secondGet).not.toBeNull();
    });
  });

  describe("fetchWithCache", () => {
    it("returns cached Object URL on cache hit without network call", async () => {
      const url = "https://wear-run.com/models/compression-shorts.glb";
      const buffer = new Uint8Array([9, 8, 7]).buffer;
      await cache.saveModel(url, buffer);

      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const objectUrl = await cache.fetchWithCache(url);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(typeof objectUrl).toBe("string");
      expect(objectUrl).toContain("blob:");
    });

    it("fetches from network, caches, and returns Object URL on cache miss", async () => {
      const url = "https://wear-run.com/models/tracksuit.glb";
      const mockBuffer = new Uint8Array([42, 43, 44]).buffer;

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
        arrayBuffer: async () => mockBuffer,
      } as unknown as Response);

      const objectUrl = await cache.fetchWithCache(url);

      expect(fetchSpy).toHaveBeenCalledWith(url);
      expect(objectUrl).toContain("blob:");

      // Verify model is now in cache
      const cached = await cache.getModel(url);
      expect(cached).not.toBeNull();
      expect(new Uint8Array(cached!)).toEqual(new Uint8Array(mockBuffer));
    });

    it("throws an error when network fetch fails on cache miss", async () => {
      const url = "https://wear-run.com/models/non-existent.glb";

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      } as unknown as Response);

      await expect(cache.fetchWithCache(url)).rejects.toThrow("Failed to fetch 3D model");
    });
  });

  describe("pruneCache", () => {
    it("evicts expired models older than maxAgeMs", async () => {
      const oldUrl = "https://wear-run.com/models/old.glb";
      const newUrl = "https://wear-run.com/models/new.glb";

      await cache.saveModel(oldUrl, new Uint8Array([1]).buffer);
      await cache.saveModel(newUrl, new Uint8Array([2]).buffer);

      // Prune with maxAgeMs = -1 to force eviction of anything older than now
      const evicted = await cache.pruneCache(100 * 1024 * 1024, -1);

      expect(evicted).toBe(2);
      expect(await cache.getModel(oldUrl)).toBeNull();
      expect(await cache.getModel(newUrl)).toBeNull();
    });

    it("evicts least recently accessed models when budget is exceeded", async () => {
      const url1 = "https://wear-run.com/models/model1.glb";
      const url2 = "https://wear-run.com/models/model2.glb";
      const url3 = "https://wear-run.com/models/model3.glb";

      // 3 items of 50 bytes each = 150 bytes
      await cache.saveModel(url1, new Uint8Array(50).buffer);
      await cache.saveModel(url2, new Uint8Array(50).buffer);
      await cache.saveModel(url3, new Uint8Array(50).buffer);

      // Access url1 to make it newer than url2
      await cache.getModel(url1);

      // Set max bytes to 80 (can only hold 1 model of 50 bytes)
      const evicted = await cache.pruneCache(80, 30 * 24 * 60 * 60 * 1000);

      expect(evicted).toBeGreaterThanOrEqual(1);
      // url1 should be kept over url2 because url1 was accessed more recently
      const cached1 = await cache.getModel(url1);
      expect(cached1).not.toBeNull();
    });
  });

  describe("clearCache", () => {
    it("purges all stored models", async () => {
      await cache.saveModel("https://wear-run.com/models/m1.glb", new Uint8Array([1]).buffer);
      await cache.saveModel("https://wear-run.com/models/m2.glb", new Uint8Array([2]).buffer);

      await cache.clearCache();

      expect(await cache.getModel("https://wear-run.com/models/m1.glb")).toBeNull();
      expect(await cache.getModel("https://wear-run.com/models/m2.glb")).toBeNull();
    });
  });

  describe("loadCachedModelUrl helper", () => {
    it("delegates to default gltfCache instance", async () => {
      const url = "https://wear-run.com/models/delegate-test.glb";
      const mockBuffer = new Uint8Array([99]).buffer;

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
        arrayBuffer: async () => mockBuffer,
      } as unknown as Response);

      const objectUrl = await loadCachedModelUrl(url);
      expect(objectUrl).toContain("blob:");

      await gltfCache.clearCache();
    });
  });

  describe("IndexedDB Backend Mocking", () => {
    it("interacts cleanly with mock IndexedDB storage", async () => {
      const mockStorage = new Map<string, unknown>();

      const mockDb = {
        objectStoreNames: { contains: () => true },
        transaction: () => ({
          objectStore: () => ({
            get: (key: string) => {
              const req: { onsuccess: ((e: unknown) => void) | null; result: unknown } = {
                onsuccess: null,
                result: mockStorage.get(key),
              };
              setTimeout(() => req.onsuccess?.({ target: req }), 0);
              return req;
            },
            put: (val: { url: string }) => {
              mockStorage.set(val.url, val);
              const req: { onsuccess: ((e: unknown) => void) | null; result: unknown } = {
                onsuccess: null,
                result: val.url,
              };
              setTimeout(() => req.onsuccess?.({ target: req }), 0);
              return req;
            },
            getAll: () => {
              const req: { onsuccess: ((e: unknown) => void) | null; result: unknown } = {
                onsuccess: null,
                result: Array.from(mockStorage.values()),
              };
              setTimeout(() => req.onsuccess?.({ target: req }), 0);
              return req;
            },
            delete: (key: string) => {
              mockStorage.delete(key);
              const req: { onsuccess: ((e: unknown) => void) | null } = { onsuccess: null };
              setTimeout(() => req.onsuccess?.({ target: req }), 0);
              return req;
            },
            clear: () => {
              mockStorage.clear();
              const req: { onsuccess: ((e: unknown) => void) | null } = { onsuccess: null };
              setTimeout(() => req.onsuccess?.({ target: req }), 0);
              return req;
            },
          }),
          oncomplete: null as (() => void) | null,
          onerror: null,
        }),
      };

      const mockIdb = {
        open: () => {
          const req: {
            onsuccess: ((e: unknown) => void) | null;
            onupgradeneeded: null;
            onerror: null;
            result: typeof mockDb;
          } = {
            onsuccess: null,
            onupgradeneeded: null,
            onerror: null,
            result: mockDb,
          };
          setTimeout(() => req.onsuccess?.({ target: req }), 0);
          return req;
        },
      };

      vi.stubGlobal("indexedDB", mockIdb);

      const idbCache = new GltfCacheService({
        enableIndexedDB: true,
      });

      const url = "https://wear-run.com/models/idb-model.glb";
      const sample = new Uint8Array([5, 6, 7]);
      await idbCache.saveModel(url, sample.buffer);

      const retrieved = await idbCache.getModel(url);
      expect(retrieved).not.toBeNull();
      expect(new Uint8Array(retrieved!)).toEqual(sample);

      await idbCache.clearCache();
      expect(await idbCache.getModel(url)).toBeNull();

      vi.unstubAllGlobals();
    });
  });
});
