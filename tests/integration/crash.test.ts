import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

const DEBUG_TOKEN = "test-token-123";

// Mock ResizeObserver for Radix UI components
vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

describe("Process Crash Integrity (Integration Tier)", () => {
  let server: TestServer;

  beforeEach(async () => {
    server = await startTestServer({
      NODE_ENV: "test",
      DEBUG_ROUTE_TOKEN: DEBUG_TOKEN,
      FORCE_EXIT_ON_CRASH: "true",
      ENABLE_DEBUG_ROUTES: "true",
    });
  });

  afterEach(() => {
    server?.kill();
  });

  it("should exit with code 1 on uncaught exception", async () => {
    try {
      const res = await fetch(`${server.baseUrl}/api/debug/crash`, {
        method: "POST",
        headers: { "X-RUN-DEBUG-TOKEN": DEBUG_TOKEN },
      });
      if (!res.ok) {
        throw new Error("Request failed");
      }
    } catch (_e: unknown) {
      // Expected connection reset
    }

    const exitCode = await new Promise<number | null>((resolve) => {
      server.process.on("exit", (code) => resolve(code));
      setTimeout(() => resolve(-1), 5000);
    });

    expect(exitCode).toBe(1);
  }, 20000);

  it("should exit with code 1 on unhandled rejection", async () => {
    try {
      await fetch(`${server.baseUrl}/api/debug/crash?type=reject`, {
        method: "POST",
        headers: { "X-RUN-DEBUG-TOKEN": DEBUG_TOKEN },
      });
    } catch (_e) {
      // Expected
    }

    const exitCode = await new Promise<number | null>((resolve) => {
      server.process.on("exit", (code) => resolve(code));
      setTimeout(() => resolve(-1), 5000);
    });

    expect(exitCode).toBe(1);
  }, 20000);
});
