/**
 * Idempotency Middleware Tests
 *
 * Tests the in-memory idempotency middleware at server/middleware/idempotency.ts.
 * Each test gets a fresh express app instance; the store is cleared between tests.
 */

import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearIdempotencyStore,
  getIdempotencyStoreSize,
  idempotencyMiddleware,
} from "../../server/middleware/idempotency.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(idempotencyMiddleware);

  let callCount = 0;

  app.post("/api/orders", (_req, res) => {
    callCount++;
    res.status(201).json({ id: callCount, created: true });
  });

  app.get("/api/products", (_req, res) => {
    callCount++;
    res.json({ products: [], callCount });
  });

  app.get("/api/health", (_req, res) => {
    callCount++;
    res.json({ status: "ok", callCount });
  });

  app.post("/api/other", (_req, res) => {
    callCount++;
    res.json({ callCount });
  });

  app.post("/api/error", (_req, res) => {
    callCount++;
    res.status(500).json({ error: "transient error", callCount });
  });

  return { app, getCallCount: () => callCount };
}

describe("Idempotency Middleware", () => {
  beforeEach(async () => {
    await clearIdempotencyStore();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearIdempotencyStore();
  });

  it("should process request normally without idempotency key", async () => {
    const { app, getCallCount } = buildApp();

    const res = await request(app).post("/api/orders").send({ item: "shoes" });

    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
    expect(getCallCount()).toBe(1);
    // No replay header when no key is provided
    expect(res.headers["idempotent-replayed"]).toBeUndefined();
  });

  it("should not apply to GET requests", async () => {
    const { app, getCallCount } = buildApp();
    const key = "get-key-001";

    // First GET with key
    await request(app).get("/api/products").set("Idempotency-Key", key);
    // Second GET with same key — handler must still be called (not replayed)
    await request(app).get("/api/products").set("Idempotency-Key", key);

    expect(getCallCount()).toBe(2);
    expect(getIdempotencyStoreSize()).toBe(0);
  });

  it("should cache response with idempotency key", async () => {
    const { app, getCallCount } = buildApp();
    const key = "order-key-abc123";

    const first = await request(app)
      .post("/api/orders")
      .set("Idempotency-Key", key)
      .send({ item: "shoes" });

    const second = await request(app)
      .post("/api/orders")
      .set("Idempotency-Key", key)
      .send({ item: "shoes" });

    // Handler only called once
    expect(getCallCount()).toBe(1);

    // Both responses are identical
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);

    // Replayed response carries the header
    expect(second.headers["idempotent-replayed"]).toBe("true");
  });

  it("should process different idempotency keys separately", async () => {
    const { app, getCallCount } = buildApp();

    await request(app).post("/api/orders").set("Idempotency-Key", "key-A").send({});
    await request(app).post("/api/orders").set("Idempotency-Key", "key-B").send({});

    // Both keys trigger a real handler call — independent entries
    expect(getCallCount()).toBe(2);
    expect(getIdempotencyStoreSize()).toBe(2);
  });

  it("should track stored entries", async () => {
    const { app } = buildApp();

    expect(getIdempotencyStoreSize()).toBe(0);

    await request(app).post("/api/orders").set("Idempotency-Key", "track-1").send({});
    expect(getIdempotencyStoreSize()).toBe(1);

    await request(app).post("/api/orders").set("Idempotency-Key", "track-2").send({});
    expect(getIdempotencyStoreSize()).toBe(2);
  });

  it("should clear entries correctly", async () => {
    const { app } = buildApp();

    await request(app).post("/api/orders").set("Idempotency-Key", "clear-1").send({});
    await request(app).post("/api/orders").set("Idempotency-Key", "clear-2").send({});
    expect(getIdempotencyStoreSize()).toBe(2);

    await clearIdempotencyStore();
    expect(getIdempotencyStoreSize()).toBe(0);
  });

  it("should not cache /api/health responses", async () => {
    const { app, getCallCount } = buildApp();
    const key = "health-key-001";

    // Health endpoint is excluded — key is ignored, no caching
    await request(app).get("/api/health").set("Idempotency-Key", key);
    await request(app).get("/api/health").set("Idempotency-Key", key);

    // Both calls hit the handler
    expect(getCallCount()).toBe(2);
    expect(getIdempotencyStoreSize()).toBe(0);
  });

  it("should not cache 5xx server errors", async () => {
    const { app, getCallCount } = buildApp();
    const key = "error-key-001";

    const first = await request(app).post("/api/error").set("Idempotency-Key", key);
    const second = await request(app).post("/api/error").set("Idempotency-Key", key);

    expect(first.status).toBe(500);
    expect(second.status).toBe(500);
    expect(getCallCount()).toBe(2);
    expect(getIdempotencyStoreSize()).toBe(0);
  });
});
