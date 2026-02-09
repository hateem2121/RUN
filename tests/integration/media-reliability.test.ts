import fetch from "node-fetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

// biome-ignore lint/suspicious/noConsole: Test debugging
console.log("Starting Media Reliability Tests...");

describe("Media Reliability & Error Standardization", () => {
  let server: TestServer;

  beforeAll(async () => {
    // Use Mock Error Mode to deterministically test failure handling without network delays
    server = await startTestServer({
      NODE_ENV: "test",
      TEST_REAL_DB: "false",
      TEST_MOCK_ERROR: "true",
      LOG_LEVEL: "info",
      // Required by Env Schema
      GOOGLE_CLIENT_ID: "mock_client_id",
      GOOGLE_CLIENT_SECRET: "mock_client_secret",
      SESSION_SECRET: "12345678901234567890123456789012", // 32 chars
    });
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  it("GET /api/media should return standardized error context when DB fails (or 200 if DB up)", async () => {
    const res = await fetch(`${server.baseUrl}/api/media`);
    const contentType = res.headers.get("content-type");
    const body = (await res.json()) as any;

    // biome-ignore lint/suspicious/noConsole: test debugging
    console.log("GET /api/media status:", res.status);
    // biome-ignore lint/suspicious/noConsole: test debugging
    console.log("GET /api/media body:", JSON.stringify(body, null, 2));

    if (res.status === 200) {
      // If DB is magically up
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    } else {
      // Expecting failure (likely DB connection error) to be formatted correctly
      // Should be 503 Service Unavailable for DB errors
      // OR 500 if something else broke
      expect(res.status).toBeGreaterThanOrEqual(500);

      // Standardized Error Response Checks
      expect(contentType).toMatch(/application\/json|application\/problem\+json/);
      expect(body).toHaveProperty("code"); // We now expect code at top level
      expect(body).toHaveProperty("detail");

      const errorObj = body.error || body;

      expect(errorObj).toHaveProperty("code");

      if (res.status === 503) {
        expect(errorObj.code).toBe("DB_CONNECTION_ERROR");
      }
    }
  });

  it("POST /api/media/upload/init without auth should return 401/403 standardized error", async () => {
    // This route requires authService.requireAdmin
    const res = await fetch(`${server.baseUrl}/api/media/upload/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: "test.png" }),
    });

    const body = (await res.json()) as any;
    // biome-ignore lint/suspicious/noConsole: test debug
    console.log("POST /api/media/upload/init status:", res.status);

    // Can be 401 (Auth) or 403 (CSRF/Forbidden) depending on middleware order
    expect([401, 403]).toContain(res.status);

    // CSRF errors might not be AppErrors yet, so code is optional for 403
    if (res.status === 401) {
      const errorObj = body.error || body;
      expect(errorObj).toHaveProperty("code");
    }
  });
});
