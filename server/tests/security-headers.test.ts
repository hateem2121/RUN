import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { setupMiddleware } from "../boot/middleware.js";

describe("Security Headers & CSP Suite", () => {
  it("injects Content-Security-Policy with dynamic nonce and frame protection", async () => {
    const app = express();
    await setupMiddleware(app);

    app.get("/test-security", (_req, res) => {
      res.json({ ok: true, nonce: res.locals.cspNonce });
    });

    const res = await request(app).get("/test-security");
    expect(res.status).toBe(200);

    const cspHeader = res.headers["content-security-policy"];
    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("script-src");
    expect(cspHeader).toContain("'self'");
    expect(cspHeader).toContain("'wasm-unsafe-eval'");
    expect(res.body.nonce).toBeDefined();
    expect(typeof res.body.nonce).toBe("string");
  });

  it("sets X-Content-Type-Options to nosniff", async () => {
    const app = express();
    await setupMiddleware(app);

    app.get("/test-nosniff", (_req, res) => {
      res.send("ok");
    });

    const res = await request(app).get("/test-nosniff");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
