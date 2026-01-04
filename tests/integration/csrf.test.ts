/**
 * CSRF Middleware Tests
 * Tests for the Double-Submit Cookie CSRF protection
 */

import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { csrfProtection, csrfTokenGenerator, csrfValidator } from "../../server/middleware/csrf";

describe("CSRF Middleware", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
  });

  describe("csrfTokenGenerator", () => {
    it("should set csrf_token cookie on response", async () => {
      app.get("/test", csrfTokenGenerator, (_req, res) => {
        res.json({ csrfToken: res.locals.csrfToken });
      });

      const response = await request(app).get("/test");

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("csrf_token=");
      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.csrfToken.length).toBe(64); // 32 bytes hex = 64 chars
    });

    it("should reuse existing token from cookie", async () => {
      app.get("/test", csrfTokenGenerator, (_req, res) => {
        res.json({ csrfToken: res.locals.csrfToken });
      });

      const existingToken = "a".repeat(64);
      const response = await request(app).get("/test").set("Cookie", `csrf_token=${existingToken}`);

      expect(response.status).toBe(200);
      expect(response.body.csrfToken).toBe(existingToken);
    });
  });

  describe("csrfValidator", () => {
    beforeEach(() => {
      app.use(csrfTokenGenerator);
      app.use(csrfValidator);
      app.post("/test", (_req, res) => res.json({ success: true }));
      app.get("/test", (_req, res) => res.json({ success: true }));
    });

    it("should allow GET requests without validation", async () => {
      const response = await request(app).get("/test");
      expect(response.status).toBe(200);
    });

    it("should reject POST without token", async () => {
      const response = await request(app).post("/test").send({});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("CSRF_TOKEN_MISSING");
    });

    it("should reject POST with mismatched token", async () => {
      const tokenA = "a".repeat(64);
      const tokenB = "b".repeat(64);

      const response = await request(app)
        .post("/test")
        .set("Cookie", `csrf_token=${tokenA}`)
        .set("x-csrf-token", tokenB)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("CSRF_TOKEN_INVALID");
    });

    it("should allow POST with matching token", async () => {
      const token = "c".repeat(64);

      const response = await request(app)
        .post("/test")
        .set("Cookie", `csrf_token=${token}`)
        .set("x-csrf-token", token)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("excluded routes", () => {
    beforeEach(() => {
      app.use(csrfProtection);
      app.post("/api/auth/google", (_req, res) => res.json({ ok: true }));
      app.post("/api/health", (_req, res) => res.json({ ok: true }));
      app.post("/api/normal", (_req, res) => res.json({ ok: true }));
    });

    it("should skip validation for /api/auth/google", async () => {
      const response = await request(app).post("/api/auth/google").send({});
      expect(response.status).toBe(200);
    });

    it("should skip validation for /api/health", async () => {
      const response = await request(app).post("/api/health").send({});
      expect(response.status).toBe(200);
    });

    it("should require validation for /api/normal", async () => {
      const response = await request(app).post("/api/normal").send({});
      expect(response.status).toBe(403);
    });
  });
});
