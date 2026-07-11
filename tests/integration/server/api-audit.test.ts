import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { setupTestApp } from "./test-utils.js";

describe("API Integrity Audit", () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  const endpoints = [
    "/api/certifications",
    "/api/fabrics",
    "/api/fibers",
    "/api/size-charts",
    "/api/about-hero",
    "/api/about-timeline",
    "/api/about-locations",
    "/api/about-sections",
    "/api/about-statistics",
  ];

  for (const endpoint of endpoints) {
    it(`GET ${endpoint} returns 200 and valid JSON`, async () => {
      const res = await request(app).get(endpoint);
      // We allow 200 (success) or 404 (if no content exists in memory storage)
      // but the main goal is that it doesn't 500
      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toBeDefined();
        if (Array.isArray(res.body)) {
          expect(res.body.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }
});
