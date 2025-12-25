import { afterEach, describe, expect, it } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

const DEBUG_TOKEN = "test-token-123";

describe("Security Hardening (Integration Tier)", () => {
  let server: TestServer;

  afterEach(() => {
    server?.kill();
  });

  it("should RETURN_404 for /api/debug/crash in PRODUCTION mode", async () => {
    server = await startTestServer({
      NODE_ENV: "production",
      ENABLE_DEBUG_ROUTES: "true",
    });

    const res = await fetch(`${server.baseUrl}/api/debug/crash`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  }, 20000);

  it("should RETURN_404 for /api/debug/crash in TEST mode if ENABLE_DEBUG_ROUTES is missing", async () => {
    server = await startTestServer({
      NODE_ENV: "test",
      // ENABLE_DEBUG_ROUTES missing
    });

    const res = await fetch(`${server.baseUrl}/api/debug/crash`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  }, 20000);

  it("should RETURN_404 if Token is missing (even if enabled)", async () => {
    server = await startTestServer({
      NODE_ENV: "test",
      ENABLE_DEBUG_ROUTES: "true",
      DEBUG_ROUTE_TOKEN: DEBUG_TOKEN,
    });

    const res = await fetch(`${server.baseUrl}/api/debug/crash`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  }, 20000);

  it("should RETURN_404 if Token is incorrect", async () => {
    server = await startTestServer({
      NODE_ENV: "test",
      ENABLE_DEBUG_ROUTES: "true",
      DEBUG_ROUTE_TOKEN: DEBUG_TOKEN,
    });

    const res = await fetch(`${server.baseUrl}/api/debug/crash`, {
      method: "POST",
      headers: { "X-RUN-DEBUG-TOKEN": "wrong-token" },
    });
    expect(res.status).toBe(404);
  }, 20000);

  it("should BLOCK .map files with 404 in PRODUCTION", async () => {
    server = await startTestServer({
      NODE_ENV: "production",
    });

    // Even if we don't request a real file, middleware should block any .map path
    const res = await fetch(`${server.baseUrl}/assets/main.js.map`);
    expect(res.status).toBe(404);

    // Test case insensitivity
    const resCase = await fetch(`${server.baseUrl}/assets/main.js.MAP`);
    expect(resCase.status).toBe(404);

    // Test encoded
    const resEnc = await fetch(`${server.baseUrl}/assets/main.js%2e%6d%61%70`);
    expect(resEnc.status).toBe(404);
  }, 20000);

  it("should REMOVE X-Powered-By header in PRODUCTION", async () => {
    server = await startTestServer({
      NODE_ENV: "production",
    });

    const res = await fetch(`${server.baseUrl}/health`);
    expect(res.headers.get("x-powered-by")).toBeNull();
  });

  it("should ENFORCE Content-Security-Policy header in PRODUCTION", async () => {
    server = await startTestServer({
      NODE_ENV: "production",
    });

    const res = await fetch(`${server.baseUrl}/health`);
    const csp = res.headers.get("content-security-policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
  });
});
