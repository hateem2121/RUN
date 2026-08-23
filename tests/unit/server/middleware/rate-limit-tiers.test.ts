import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  apiTier,
  criticalTier,
  publicTier,
  uploadTier,
} from "../../../../server/middleware/rate-limit-tiers.js";

describe("Rate Limit Tiers Middleware", () => {
  it("should export defined rate limiters for all 4 tiers", () => {
    expect(publicTier).toBeDefined();
    expect(typeof publicTier).toBe("function");

    expect(apiTier).toBeDefined();
    expect(typeof apiTier).toBe("function");

    expect(criticalTier).toBeDefined();
    expect(typeof criticalTier).toBe("function");

    expect(uploadTier).toBeDefined();
    expect(typeof uploadTier).toBe("function");
  });

  it("should allow requests through middleware in test environment", async () => {
    const app = express();
    app.use("/api/public", publicTier, (_req, res) => res.json({ status: "ok" }));
    app.use("/api/critical", criticalTier, (_req, res) => res.json({ status: "ok" }));

    const res1 = await request(app).get("/api/public");
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ status: "ok" });

    const res2 = await request(app).get("/api/critical");
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ status: "ok" });
  });
});
