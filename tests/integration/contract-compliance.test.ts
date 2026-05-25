import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, serverReady } from "../../server/server.js";

// No storage mock needed — mock pool in test mode returns empty rows by default.
// Auth is not required for the three routes tested here (public GET endpoints).

describe("API Contract Compliance", () => {
  beforeAll(async () => {
    await serverReady;
  });

  describe("GET /api/products (Success Envelope)", () => {
    it("should return standard SuccessEnvelope structure", async () => {
      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);

      // Pagination envelope (not meta/requestId — products uses pagination)
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("page");
      expect(res.body.pagination).toHaveProperty("limit");
      expect(res.body.pagination).toHaveProperty("total");
    });
  });

  describe("Validation Error Compliance", () => {
    it("should return standard error for invalid input", async () => {
      // validateIdParam rejects non-numeric :id with 422
      const res = await request(app).get("/api/products/abc").expect(422);

      expect(res.body).toMatchObject({
        message: expect.stringContaining("product"),
        parameter: "id",
        value: "abc",
      });
    });
  });

  describe("404 Error Compliance", () => {
    it("should return standard RFC 9457 Error for non-existent resource", async () => {
      // 9999999 is valid integer but won't exist in mock DB (pool returns empty rows)
      const res = await request(app).get("/api/products/9999999").expect(404);

      expect(res.body).toMatchObject({
        code: "RESOURCE_NOT_FOUND",
        status: 404,
        detail: expect.stringContaining("not found"),
      });
    });
  });
});
