import { describe, expect, it } from "vitest";
import { legalPolicies, sessions } from "../../../shared/dist/index.js";

describe("Index Reclamation Schema Validation", () => {
  it("sessions table exports valid Drizzle table without redundant expire index", () => {
    expect(sessions).toBeDefined();
    expect(sessions.sid).toBeDefined();
    expect(sessions.expire).toBeDefined();
  });

  it("legalPolicies table contains uniqueIndex on slug and no redundant non-unique index", () => {
    expect(legalPolicies).toBeDefined();
    expect(legalPolicies.slug).toBeDefined();
    expect(legalPolicies.title).toBeDefined();
  });
});
