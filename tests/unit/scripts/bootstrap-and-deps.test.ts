import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Supply Chain & Scorecard Hardening", () => {
  it("should use npm ci in scripts/bootstrap.sh instead of npm install", () => {
    const content = fs.readFileSync("scripts/bootstrap.sh", "utf-8");
    expect(content).toContain("npm ci");
    expect(content).not.toContain("npm install");
  });
});
