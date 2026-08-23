import { describe, expect, it } from "vitest";
import neonConfig from "../neon.js";

describe("Neon Infrastructure Configuration (neon.ts)", () => {
  it("should export a valid defineConfig object with auth and dataApi enabled", () => {
    expect(neonConfig).toBeDefined();
    expect(neonConfig.auth).toBe(true);
    expect(neonConfig.dataApi).toBe(true);
  });

  it("should mark default branch and main as protected", () => {
    expect(typeof neonConfig.branch).toBe("function");
    const mainBranchMock = { isDefault: true, name: "main", exists: true };
    const config = neonConfig.branch?.(mainBranchMock);
    expect(config?.protected).toBe(true);
  });

  it("should assign 24h TTL and scale-to-zero compute to new preview branches", () => {
    const previewBranchMock = { isDefault: false, name: "preview/pr-123", exists: false };
    const config = neonConfig.branch?.(previewBranchMock);
    expect(config?.parent).toBe("main");
    expect(config?.ttl).toBe("24h");
    expect(config?.postgres?.computeSettings?.autoscalingLimitMinCu).toBe(0.25);
    expect(config?.postgres?.computeSettings?.suspendTimeout).toBe("5m");
  });
});
