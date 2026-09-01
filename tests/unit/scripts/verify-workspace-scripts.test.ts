import { describe, expect, it } from "vitest";
import { verifyWorkspaceManifests } from "../../../scripts/validators/verify-workspace-scripts.js";

describe("Workspace Script & Lifecycle Integrity", () => {
  it("should validate that all workspace manifests maintain script parity", () => {
    const result = verifyWorkspaceManifests();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
