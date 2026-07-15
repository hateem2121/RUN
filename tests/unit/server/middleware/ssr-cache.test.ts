import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unifiedCache } from "../../../../server/lib/cache/unified-cache";
import { invalidateHtmlCache, ssrCacheMiddleware } from "../../../../server/middleware/ssr-cache";

vi.mock("../../../../server/lib/cache/unified-cache", () => ({
  unifiedCache: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    clearPattern: vi.fn(),
    invalidate: vi.fn(),
  },
}));

vi.mock("../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SSR Cache Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      method: "GET",
      path: "/",
      query: {},
      headers: {},
      user: undefined,
    } as any;

    res = {
      setHeader: vi.fn(),
      send: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      getHeader: vi.fn().mockReturnValue("text/html"),
      statusCode: 200,
      locals: {},
    } as any;

    next = vi.fn();

    // Set NODE_ENV to production by default for these tests to avoid the early return
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("should skip caching for non-GET requests", async () => {
    req.method = "POST";
    await ssrCacheMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("should skip caching for API routes", async () => {
    req.path = "/api/products";
    await ssrCacheMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("should bypass caching in test environments", async () => {
    process.env.NODE_ENV = "test";

    await ssrCacheMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    expect(next).toHaveBeenCalled();
  });

  it("should not cache for admin sessions", async () => {
    (req as any).user = { role: "admin" };

    await ssrCacheMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    expect(next).toHaveBeenCalled();
  });

  it("should set private cache headers for non-cacheable paths", async () => {
    req.path = "/dashboard";

    await ssrCacheMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    expect(next).toHaveBeenCalled();
  });

  it("should return cached HTML on L1/L2 cache hit", async () => {
    req.path = "/products";
    vi.mocked(unifiedCache.get).mockResolvedValueOnce({
      html: "<html>Cached Content</html>",
      headers: { "Content-Type": "text/html" },
    });

    await ssrCacheMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    );
    expect(res.setHeader).toHaveBeenCalledWith("X-SSR-Cache", "HIT");
    expect(res.send).toHaveBeenCalledWith("<html>Cached Content</html>");
    expect(next).not.toHaveBeenCalled();
  });

  it("should intercept write and end to cache successful HTML on miss", async () => {
    req.path = "/products";
    vi.mocked(unifiedCache.get).mockResolvedValueOnce(null); // Miss

    const originalWrite = vi.fn();
    const originalEnd = vi.fn();
    res.write = originalWrite;
    res.end = originalEnd;

    await ssrCacheMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-SSR-Cache", "MISS");
    expect(next).toHaveBeenCalled();

    // Simulate response
    res.write!("<!DOCTYPE html><html>", "utf8", () => {});
    res.write!(Buffer.from("<body>Hello</body>"));
    res.end!("</html>" as any);

    expect(originalWrite).toHaveBeenCalledTimes(2);
    expect(originalEnd).toHaveBeenCalledTimes(1);
    expect(unifiedCache.set).toHaveBeenCalledWith(
      "ssr:anon:/products",
      {
        html: "<!DOCTYPE html><html><body>Hello</body></html>",
        headers: { "Content-Type": "text/html" },
      },
      60,
    );
  });

  describe("invalidateHtmlCache", () => {
    it("should clear all SSR cache when no pattern provided", async () => {
      await invalidateHtmlCache();
      expect(unifiedCache.clearPattern).toHaveBeenCalledWith("ssr:");
    });

    it("should invalidate specific pattern", async () => {
      await invalidateHtmlCache("products");
      expect(unifiedCache.invalidate).toHaveBeenCalledWith("ssr:.*products.*");
    });
  });
});
