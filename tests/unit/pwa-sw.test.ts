import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA-01: Service Worker Partitioned Catalog Caching", () => {
  const swPath = resolve(process.cwd(), "client/public/sw.js");
  const swContent = readFileSync(swPath, "utf-8");

  it("declares CATALOG_CACHE_NAME as run-catalog-v1", () => {
    expect(swContent).toMatch(/CATALOG_CACHE_NAME\s*=\s*["']run-catalog-v1["']/);
  });

  it("preserves CATALOG_CACHE_NAME and CACHE_NAME during activate cleanup", () => {
    expect(swContent).toContain("CATALOG_CACHE_NAME");
    expect(swContent).toContain("activate");
    // Ensure cache deletion filters out active caches
    expect(swContent).toMatch(/!.*includes\(key\)/);
  });

  it("intercepts GET requests to /api/products and /api/categories", () => {
    expect(swContent).toContain('/api/products"');
    expect(swContent).toContain('/api/categories"');
    expect(swContent).toContain('request.method === "GET"');
  });

  it("implements Stale-While-Revalidate using CATALOG_CACHE_NAME", () => {
    expect(swContent).toContain("caches.open(CATALOG_CACHE_NAME)");
    expect(swContent).toContain("cache.match(request)");
    expect(swContent).toContain("cache.put(request, networkResponse.clone())");
  });

  it("sets X-Cache: HIT-OFFLINE when network fails or offline", () => {
    expect(swContent).toContain('headers.set("X-Cache", "HIT-OFFLINE")');
    expect(swContent).toContain("HIT-OFFLINE");
  });
});
