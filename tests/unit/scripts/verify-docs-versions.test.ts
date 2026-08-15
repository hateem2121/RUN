import { describe, expect, it } from "vitest";
import { extractVersion, readJson } from "../../../scripts/utils/verify-docs-versions";

describe("verify-docs-versions", () => {
  describe("extractVersion", () => {
    it("removes version prefixes", () => {
      expect(extractVersion("^1.2.3")).toBe("1.2.3");
      expect(extractVersion("~4.5.6")).toBe("4.5.6");
      expect(extractVersion(">=7.8.9")).toBe("7.8.9");
      expect(extractVersion("10.11.12")).toBe("10.11.12");
    });
  });

  describe("readJson", () => {
    it("returns err for non-existent file", () => {
      const result = readJson("does-not-exist.json");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("File not found");
      }
    });

    it("returns ok for an existing valid JSON file", () => {
      const result = readJson("package.json");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty("name");
      }
    });
  });
});
