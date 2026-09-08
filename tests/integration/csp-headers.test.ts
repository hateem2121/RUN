import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { setupMiddleware } from "../../server/boot/middleware.js";
import { env } from "../../server/lib/env.js";
import { criticalTier } from "../../server/middleware/rate-limit-tiers.js";
import authRouter from "../../server/routes/auth.js";

describe("CSP Headers & Security Configuration (Integration)", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("should NOT contain upgrade-insecure-requests directive in development", async () => {
    process.env.NODE_ENV = "development";
    const app = express();
    await setupMiddleware(app);
    app.get("/api/test", (_req, res) => res.json({ status: "ok" }));

    const res = await request(app).get("/api/test");
    const csp = res.headers["content-security-policy"];

    expect(csp).toBeDefined();
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("should disable HSTS in development to prevent net::ERR_SSL_PROTOCOL_ERROR on localhost", async () => {
    process.env.NODE_ENV = "development";
    const app = express();
    await setupMiddleware(app);
    app.get("/api/test", (_req, res) => res.json({ status: "ok" }));

    const res = await request(app).get("/api/test");
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });

  it("should whitelist localhost and 127.0.0.1 in img-src and connect-src", async () => {
    process.env.NODE_ENV = "development";
    const app = express();
    await setupMiddleware(app);
    app.get("/api/test", (_req, res) => res.json({ status: "ok" }));

    const res = await request(app).get("/api/test");
    const csp = res.headers["content-security-policy"] as string;

    expect(csp).toBeDefined();
    const directives = Object.fromEntries(
      csp.split(";").map((d) => {
        const parts = d.trim().split(/\s+/);
        return [parts[0], parts.slice(1)];
      }),
    );

    expect(directives["img-src"]).toContain(`http://localhost:${env.PORT}`);
    expect(directives["img-src"]).toContain(`http://127.0.0.1:${env.PORT}`);
    expect(directives["connect-src"]).toContain(`http://localhost:${env.PORT}`);
    expect(directives["connect-src"]).toContain(`http://127.0.0.1:${env.PORT}`);
  });

  it("should include upgrade-insecure-requests and HSTS in production", async () => {
    process.env.NODE_ENV = "production";
    const app = express();
    await setupMiddleware(app);
    app.get("/api/test", (_req, res) => res.json({ status: "ok" }));

    const res = await request(app).get("/api/test");
    const csp = res.headers["content-security-policy"];

    expect(csp).toBeDefined();
    expect(csp).toContain("upgrade-insecure-requests");
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("should not mount criticalTier directly on auth router to prevent double rate limiting", () => {
    // In server/routes/index.ts, criticalTier is already applied: apiRouter.use("/auth", criticalTier, authRouter)
    // authRouter should not mount criticalTier again at router level
    const routerStack = authRouter.stack || [];
    const hasCriticalTier = routerStack.some((layer) => layer.handle === criticalTier);
    expect(hasCriticalTier).toBe(false);
  });
});
