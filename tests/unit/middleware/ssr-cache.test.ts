import type { Request } from "express";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_CACHE_QUERY_PARAMS,
  getCacheKey,
  isPublicCacheablePath,
} from "../../../server/middleware/ssr-cache.js";

describe("SSR Cache Middleware - getCacheKey (CACHE-02)", () => {
  it("should export the expected whitelisted query parameters", () => {
    expect(ALLOWED_CACHE_QUERY_PARAMS).toEqual([
      "page",
      "category",
      "sort",
      "search",
      "limit",
      "tag",
      "q",
      "filter",
    ]);
  });

  it("should omit query string if req.query is empty", () => {
    const req = {
      path: "/products",
      query: {},
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:anon:/products");
  });

  it("should omit query string if req.query only contains non-whitelisted params", () => {
    const req = {
      path: "/products",
      query: {
        utm_source: "google",
        utm_medium: "cpc",
        fbclid: "IwAR123456",
        _t: "1234567890",
        rnd: "998877",
      },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:anon:/products");
  });

  it("should include only whitelisted query params in sorted alphabetical order", () => {
    const req = {
      path: "/products",
      query: {
        sort: "price_desc",
        page: "2",
        category: "running",
      },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:anon:/products?category=running&page=2&sort=price_desc");
  });

  it("should filter out non-whitelisted params while retaining and sorting whitelisted ones", () => {
    const req = {
      path: "/search",
      query: {
        fbclid: "hack",
        sort: "asc",
        utm_campaign: "summer",
        q: "jersey",
        page: "1",
        cacheBuster: "999",
      },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:anon:/search?page=1&q=jersey&sort=asc");
  });

  it("should support all 8 whitelisted parameters in alphabetical order", () => {
    const req = {
      path: "/catalog",
      query: {
        tag: "sustainable",
        filter: "active",
        search: "compression",
        category: "outerwear",
        q: "thermal",
        limit: "24",
        page: "3",
        sort: "popular",
      },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe(
      "ssr:anon:/catalog?category=outerwear&filter=active&limit=24&page=3&q=thermal&search=compression&sort=popular&tag=sustainable",
    );
  });

  it("should handle array query values correctly", () => {
    const req = {
      path: "/products",
      query: {
        tag: ["recycled", "dry-fit"],
        page: "1",
      },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:anon:/products?page=1&tag=recycled&tag=dry-fit");
  });

  it("should correctly incorporate user role if present", () => {
    const req = {
      path: "/products",
      query: { page: "1" },
      user: { role: "admin" },
    } as unknown as Request;

    const key = getCacheKey(req);
    expect(key).toBe("ssr:admin:/products?page=1");
  });
});

describe("SSR Cache Middleware - isPublicCacheablePath", () => {
  it("should identify public paths as cacheable", () => {
    expect(isPublicCacheablePath("/")).toBe(true);
    expect(isPublicCacheablePath("/products")).toBe(true);
    expect(isPublicCacheablePath("/products/seamless-hoodie")).toBe(true);
    expect(isPublicCacheablePath("/category/men")).toBe(true);
    expect(isPublicCacheablePath("/categories/women")).toBe(true);
    expect(isPublicCacheablePath("/about")).toBe(true);
    expect(isPublicCacheablePath("/sustainability")).toBe(true);
  });

  it("should never cache private or admin paths", () => {
    expect(isPublicCacheablePath("/admin")).toBe(false);
    expect(isPublicCacheablePath("/admin/products")).toBe(false);
    expect(isPublicCacheablePath("/api/products")).toBe(false);
    expect(isPublicCacheablePath("/auth/google")).toBe(false);
    expect(isPublicCacheablePath("/products/admin-test")).toBe(false);
  });
});
