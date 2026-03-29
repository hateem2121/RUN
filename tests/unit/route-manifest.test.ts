import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getComponentForPath, routeManifest } from "../../shared/route-manifest";

describe("Route Manifest", () => {
  const PROJECT_ROOT = path.resolve(__dirname, "../../client");

  it("should map to existing files on disk", () => {
    Object.entries(routeManifest).forEach(([_route, componentPath]) => {
      const fullPath = path.join(PROJECT_ROOT, componentPath);
      const exists = fs.existsSync(fullPath);
      expect(exists).toBe(true);
    });
  });

  it("should resolve fuzzy routes correctly", () => {
    // Exact match
    expect(getComponentForPath("/")).toBe("app/routes/_index.tsx");

    // Fuzzy match for categories
    expect(getComponentForPath("/categories/running")).toBe("app/routes/categories.$slug.tsx");

    // Unknown route
    expect(getComponentForPath("/unknown-route")).toBeUndefined();
  });
});
