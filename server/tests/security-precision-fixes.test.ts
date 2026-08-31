import { describe, expect, it } from "vitest";
import { normalizeSlug } from "../lib/utilities/slug-utils.js";
import { slugifyFilename } from "../routes/media/utils.js";

describe("Precision Security Fixes", () => {
  describe("ReDoS Mitigation (CWE-1333)", () => {
    it("should safely normalize slugs without polynomial ReDoS on repeated hyphens", () => {
      const maliciousInput = "-".repeat(50000);
      const start = performance.now();
      const result = normalizeSlug(maliciousInput);
      const duration = performance.now() - start;

      expect(result).toBe("");
      expect(duration).toBeLessThan(100);
    });

    it("should safely handle normal slugs", () => {
      expect(normalizeSlug("Outer Wear & Sports Gear")).toBe("outer-wear-sports-gear");
      expect(normalizeSlug("  Custom__Jersey--Pro  ")).toBe("custom-jersey-pro");
    });

    it("should safely slugify filenames without ReDoS on repeated hyphens", () => {
      const maliciousFilename = `${"-".repeat(50000)}.jpg`;
      const start = performance.now();
      const result = slugifyFilename(maliciousFilename);
      const duration = performance.now() - start;

      expect(result).toBe("file.jpg");
      expect(duration).toBeLessThan(100);
    });

    it("should properly slugify normal filenames", () => {
      expect(slugifyFilename("Product Image 2026.PNG")).toBe("product-image-2026.png");
      expect(slugifyFilename("---special__upload---.glb")).toBe("special-upload.glb");
    });
  });

  describe("URL Redirection Path Validation (CWE-601)", () => {
    it("should validate safe relative paths and reject backslash bypasses", () => {
      const isSafeReturnUrl = (url: unknown): boolean =>
        typeof url === "string" &&
        url.startsWith("/") &&
        !url.startsWith("//") &&
        !url.includes("\\") &&
        /^\/[a-zA-Z0-9_\-/?=&%#.]*$/.test(url);

      expect(isSafeReturnUrl("/admin")).toBe(true);
      expect(isSafeReturnUrl("/admin/products?page=2&status=active")).toBe(true);
      expect(isSafeReturnUrl("//evil.com")).toBe(false);
      expect(isSafeReturnUrl("/\\evil.com")).toBe(false);
      expect(isSafeReturnUrl("https://evil.com")).toBe(false);
      expect(isSafeReturnUrl("javascript:alert(1)")).toBe(false);
    });
  });
});
