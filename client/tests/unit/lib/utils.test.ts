import { describe, expect, it } from "vitest";
import { cn, formatFileSize, sanitizeContent, sanitizeObj } from "../../../app/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges tailwind classes and resolves conflicts", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("px-2 py-1", "p-4")).toBe("p-4");
      expect(cn("text-black", undefined, null, false, "text-white")).toBe("text-white");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes into human-readable strings", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
      expect(formatFileSize(null)).toBe("0 Bytes");
      expect(formatFileSize(undefined)).toBe("0 Bytes");
      expect(formatFileSize(NaN)).toBe("0 Bytes");
      expect(formatFileSize(-1)).toBe("0 Bytes");
    });
  });

  describe("sanitizeContent", () => {
    it("removes QA artifacts", () => {
      expect(sanitizeContent("Hello World [QA-AUTO]")).toBe("Hello World");
      expect(sanitizeContent("Test [QA-AUTO-123] String")).toBe("Test  String");
      expect(sanitizeContent(null)).toBe("");
      expect(sanitizeContent(undefined)).toBe("");
    });
  });

  describe("sanitizeObj", () => {
    it("sanitizes string properties of an object", () => {
      const input = {
        name: "Product [QA-AUTO]",
        description: "A great product [QA-AUTO-456]",
        price: 100,
        nested: { name: "Inner [QA-AUTO]" },
      };
      const result = sanitizeObj(input);
      expect(result.name).toBe("Product");
      expect(result.description).toBe("A great product");
      expect(result.price).toBe(100);
      expect(result.nested).toEqual({ name: "Inner [QA-AUTO]" });
    });

    it("returns the input if falsy", () => {
      expect(sanitizeObj(null as any)).toBeNull();
    });
  });
});
