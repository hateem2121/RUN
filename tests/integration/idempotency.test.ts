/**
 * Idempotency Middleware Tests
 * Tests for idempotency key handling and response caching
 */

import express, { type Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearIdempotencyStore,
  getIdempotencyMetrics,
  idempotencyMiddleware,
} from "../../server/middleware/idempotency";

describe("Idempotency Middleware", () => {
  let app: Express;
  let requestCount: number;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(idempotencyMiddleware);
    requestCount = 0;
    clearIdempotencyStore();

    // Test endpoint that increments counter
    app.post("/test", (_req, res) => {
      requestCount++;
      res.json({ count: requestCount, message: "Created" });
    });

    app.get("/test", (_req, res) => {
      res.json({ message: "GET response" });
    });
  });

  afterEach(() => {
    clearIdempotencyStore();
  });

  describe("basic functionality", () => {
    it("should process request normally without idempotency key", async () => {
      const response = await request(app).post("/test").send({});

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(requestCount).toBe(1);
    });

    it("should not apply to GET requests", async () => {
      const response = await request(app).get("/test").set("Idempotency-Key", "test-key");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("GET response");
    });

    it("should cache response with idempotency key", async () => {
      const key = "unique-key-1";

      // First request
      const response1 = await request(app).post("/test").set("Idempotency-Key", key).send({});

      expect(response1.status).toBe(200);
      expect(response1.body.count).toBe(1);
      expect(requestCount).toBe(1);

      // Second request with same key - should return cached response
      const response2 = await request(app).post("/test").set("Idempotency-Key", key).send({});

      expect(response2.status).toBe(200);
      expect(response2.body.count).toBe(1); // Same as first request
      expect(response2.headers["idempotent-replayed"]).toBe("true");
      expect(requestCount).toBe(1); // Handler not called again
    });

    it("should process different idempotency keys separately", async () => {
      const key1 = "key-a";
      const key2 = "key-b";

      const response1 = await request(app).post("/test").set("Idempotency-Key", key1).send({});

      const response2 = await request(app).post("/test").set("Idempotency-Key", key2).send({});

      expect(response1.body.count).toBe(1);
      expect(response2.body.count).toBe(2);
      expect(requestCount).toBe(2);
    });
  });

  describe("metrics", () => {
    it("should track stored entries", async () => {
      await request(app).post("/test").set("Idempotency-Key", "metrics-key").send({});

      const metrics = getIdempotencyMetrics();
      expect(metrics.entriesCount).toBe(1);
      expect(metrics.oldestEntry).toBeDefined();
    });

    it("should clear entries correctly", async () => {
      await request(app).post("/test").set("Idempotency-Key", "clear-test").send({});

      clearIdempotencyStore();

      const metrics = getIdempotencyMetrics();
      expect(metrics.entriesCount).toBe(0);
    });
  });

  describe("excluded routes", () => {
    beforeEach(() => {
      app.post("/api/health", (_req, res) => {
        requestCount++;
        res.json({ ok: true, count: requestCount });
      });
    });

    it("should not cache /api/health responses", async () => {
      const key = "health-key";

      const response1 = await request(app).post("/api/health").set("Idempotency-Key", key).send({});

      const response2 = await request(app).post("/api/health").set("Idempotency-Key", key).send({});

      expect(response1.body.count).toBe(1);
      expect(response2.body.count).toBe(2); // Not cached
      expect(response2.headers["idempotent-replayed"]).toBeUndefined();
    });
  });
});
