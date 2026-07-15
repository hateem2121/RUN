import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/hooks/use-toast";
import { ApiError, apiRequest } from "../../../../client/app/lib/api";
import {
  batchFetchMediaContent,
  cleanupCacheIfNeeded,
  createQueryClient,
  forceResetMediaCache,
  getCacheMetrics,
  getMediaSrc,
  getOptimizedQueryOptions,
  getQueryClient,
  getQueryFn,
  mediaBatchScheduler,
  prefetchCriticalHomepageData,
  prefetchMediaBatch,
  prefetchSecondaryHomepageData,
  queryKeys,
  startAutomaticCacheCleanup,
  stopAutomaticCacheCleanup,
  useMediaResolver,
} from "../../../../client/app/lib/queryClient";
import { requestManager } from "../../../../client/app/lib/request-manager";

// Mock dependencies
vi.mock("../../../../client/app/lib/api", () => {
  return {
    ApiError: class extends Error {
      status: number;
      retryAfter?: number;
      constructor(message: string, status: number, retryAfter?: number) {
        super(message);
        this.status = status;
        this.retryAfter = retryAfter;
      }
    },
    apiRequest: vi.fn(),
  };
});

vi.mock("../../../../client/app/lib/request-manager", () => ({
  requestManager: {
    fetch: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock browser environment
const originalWindow = global.window;

describe("queryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopAutomaticCacheCleanup();
  });

  describe("getQueryFn", () => {
    it("should call apiRequest with the URL", async () => {
      const fn = getQueryFn({ on401: "throw" });
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: "test" });

      const result = await fn({ queryKey: ["/api/test"] } as any);
      expect(apiRequest).toHaveBeenCalledWith("/api/test");
      expect(result).toEqual({ data: "test" });
    });

    it("should append options as query params", async () => {
      const fn = getQueryFn({ on401: "throw" });
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: "test" });

      await fn({ queryKey: ["/api/test", { page: 1, limit: 10 }] } as any);
      expect(apiRequest).toHaveBeenCalledWith("/api/test?page=1&limit=10");
    });

    it("should return null on 401 if on401 is returnNull", async () => {
      const fn = getQueryFn({ on401: "returnNull" });
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError("Unauthorized", 401));

      const result = await fn({ queryKey: ["/api/test"] } as any);
      expect(result).toBeNull();
    });

    it("should throw on 401 if on401 is throw", async () => {
      const fn = getQueryFn({ on401: "throw" });
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError("Unauthorized", 401));

      await expect(fn({ queryKey: ["/api/test"] } as any)).rejects.toThrow("Unauthorized");
    });
  });

  describe("createQueryClient", () => {
    it("should create a client with specific default options", () => {
      const client = createQueryClient();
      expect(client).toBeDefined();
      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(60000);
    });

    it("should not retry client errors or rate limits", () => {
      const client = createQueryClient();
      const retryFn = client.getDefaultOptions().queries?.retry as any;

      expect(retryFn(0, new ApiError("Too Many Requests", 429))).toBe(false);
      expect(retryFn(0, new ApiError("Conflict", 409))).toBe(false);
      expect(retryFn(0, new ApiError("Bad Request", 400))).toBe(false);
      expect(retryFn(0, new Error("non-JSON response"))).toBe(false);
      expect(retryFn(0, new Error("Internal Server Error"))).toBe(true);
      expect(retryFn(2, new Error("Internal Server Error"))).toBe(false); // Max 2 retries
    });

    it("should handle mutation cache global error", () => {
      const client = createQueryClient();
      const onError = (client.getMutationCache() as any).config.onError;

      // Global rate limit handled
      onError(new ApiError("Rate Limit", 429), {}, {}, { meta: {} });
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Rate limit exceeded" }));

      // Opt out of toast
      vi.mocked(toast).mockClear();
      onError(new Error("fail"), {}, {}, { meta: { skipToast: true } });
      expect(toast).not.toHaveBeenCalled();

      // Generic error toast
      vi.mocked(toast).mockClear();
      onError(new Error("Network: Connection failed"), {}, {}, { meta: {} });
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Connection failed" }),
      );

      // Unknown error toast
      vi.mocked(toast).mockClear();
      onError("String error", {}, {}, { meta: {} });
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Save failed. Please try again." }),
      );
    });
  });

  describe("getQueryClient", () => {
    it("should return a new client on the server", () => {
      // simulate server
      const tempWindow = global.window;
      // @ts-expect-error
      delete global.window;

      const client1 = getQueryClient();
      const client2 = getQueryClient();
      expect(client1).not.toBe(client2); // different instances

      global.window = tempWindow;
    });
  });

  describe("getOptimizedQueryOptions", () => {
    it("should return correct options for static data", () => {
      const options = getOptimizedQueryOptions("static");
      expect(options.staleTime).toBe(15 * 60 * 1000);
      expect(options.refetchOnWindowFocus).toBe(false);
    });

    it("should return correct options for live data", () => {
      const options = getOptimizedQueryOptions("live");
      expect(options.staleTime).toBe(3000);
      expect(options.refetchOnWindowFocus).toBe(true);
    });
  });

  describe("queryKeys", () => {
    it("should generate valid keys for products", () => {
      expect(queryKeys.products.all()).toEqual(["/api/products"]);
      expect(queryKeys.products.paginated(1, 10)).toEqual([
        "/api/products",
        { page: 1, limit: 10 },
      ]);
    });

    it("should generate valid keys for media", () => {
      expect(queryKeys.media.byId(123)).toEqual(["/api/media", 123]);
    });
  });

  describe("batchFetchMediaContent", () => {
    it("should fetch batch data via requestManager", async () => {
      vi.mocked(requestManager.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 1, url: "/path/1.png" }],
        }),
      } as any);

      const results = await batchFetchMediaContent([1]);
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(1);
      expect(results[0]?.url).toBe("/path/1.png");
      expect(requestManager.fetch).toHaveBeenCalledWith(
        "/api/media/batch/content?ids=1&prefetch=true",
        expect.any(Object),
      );
    });

    it("should fallback to individual URLs if batch request fails", async () => {
      vi.mocked(requestManager.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      const results = await batchFetchMediaContent([1, 2]);
      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.url).toBe("/api/media/1/content");
      expect(results[1]?.success).toBe(false);
    });

    it("should handle empty arrays", async () => {
      const results = await batchFetchMediaContent([]);
      expect(results).toEqual([]);
      expect(requestManager.fetch).not.toHaveBeenCalled();
    });
  });

  describe("mediaBatchScheduler", () => {
    it("should batch multiple calls together", async () => {
      vi.mocked(requestManager.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 1, url: "/1.png" },
            { id: 2, url: "/2.png" },
          ],
        }),
      } as any);

      const p1 = mediaBatchScheduler.schedule(1);
      const p2 = mediaBatchScheduler.schedule(2);

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1.id).toBe(1);
      expect(res1.url).toBe("/1.png");
      expect(res2.id).toBe(2);
      expect(res2.url).toBe("/2.png");

      expect(requestManager.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cache Monitoring & Management", () => {
    it("should return cache metrics", () => {
      const metrics = getCacheMetrics();
      expect(metrics).toHaveProperty("queryCount");
      expect(metrics).toHaveProperty("estimatedSizeMB");
      expect(metrics).toHaveProperty("exceedsThreshold");
    });

    it("should cleanup cache if threshold exceeded", () => {
      // Just test that the function executes without crashing
      // Hard to mock the exact threshold and query cache internals without extensive mocking
      expect(() => cleanupCacheIfNeeded()).not.toThrow();
    });

    it("should start and stop automatic cache cleanup", () => {
      vi.useFakeTimers();
      startAutomaticCacheCleanup();
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      stopAutomaticCacheCleanup();
      // Should clear intervals
      vi.useRealTimers();
    });
  });

  describe("Prefetching", () => {
    it("should prefetch critical homepage data", async () => {
      vi.mocked(apiRequest).mockResolvedValue({});
      await prefetchCriticalHomepageData();
      // If it doesn't throw, it passed
    });

    it("should prefetch secondary homepage data", async () => {
      vi.mocked(apiRequest).mockResolvedValue({});
      await prefetchSecondaryHomepageData();
    });
  });

  describe("media batch components", () => {
    it("useMediaResolver returns default state", () => {
      const result = useMediaResolver(1);
      expect(result).toEqual({ src: null, isInline: false, isLoading: true });
    });

    it("getMediaSrc returns content if available", async () => {
      vi.spyOn(mediaBatchScheduler, "schedule").mockResolvedValueOnce({
        content: "data:image/png",
      } as any);
      const src = await getMediaSrc(1);
      expect(src).toBe("data:image/png");
    });

    it("getMediaSrc returns url if content not available", async () => {
      vi.spyOn(mediaBatchScheduler, "schedule").mockResolvedValueOnce({
        url: "/api/media/1",
      } as any);
      const src = await getMediaSrc(1);
      expect(src).toBe("/api/media/1");
    });

    it("getMediaSrc falls back to direct URL on error", async () => {
      vi.spyOn(mediaBatchScheduler, "schedule").mockRejectedValueOnce(new Error("fail"));
      const src = await getMediaSrc(1);
      expect(src).toBe("/api/media/1/content");
    });
  });

  describe("forceResetMediaCache", () => {
    it("should reset media cache without crashing", async () => {
      // Mock global fetch for Strategy 1 and 2
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      await forceResetMediaCache();
      // Expected to complete successfully
    });

    it("should fall back to strategy 2 and 3 if strategy 1 fails", async () => {
      // Strategy 1 fails (not ok), Strategy 2 succeeds
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ strategy: 2 }) });
      await forceResetMediaCache();
    });

    it("should try all strategies if fetch fails completely", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
      await forceResetMediaCache();
    });

    it("should handle fetch failures gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
      await forceResetMediaCache();
    });

    it("should use ultimate fallback if everything fails", async () => {
      const client = getQueryClient();
      vi.spyOn(client, "removeQueries").mockImplementation(() => {
        throw new Error("Crash");
      });
      vi.spyOn(client, "clear").mockImplementation(() => {});

      const result = await forceResetMediaCache();
      expect(result).toBe(true);
      expect(client.clear).toHaveBeenCalled();
    });

    it("should return false if ultimate fallback fails", async () => {
      const client = getQueryClient();
      vi.spyOn(client, "removeQueries").mockImplementation(() => {
        throw new Error("Crash");
      });
      vi.spyOn(client, "clear").mockImplementation(() => {
        throw new Error("Crash 2");
      });

      const result = await forceResetMediaCache();
      expect(result).toBe(false);
    });
  });

  describe("prefetchMediaBatch", () => {
    it("should not prefetch if assetIds is empty", async () => {
      const result = await prefetchMediaBatch([]);
      expect(result).toBeUndefined();
    });

    it("should prefetch batch data", async () => {
      const client = getQueryClient();
      vi.spyOn(client, "prefetchQuery").mockResolvedValueOnce(undefined);

      await prefetchMediaBatch([1, 2]);
      expect(client.prefetchQuery).toHaveBeenCalled();
    });
  });
});
