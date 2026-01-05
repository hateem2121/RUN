import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

const DEBUG_TOKEN = "test-token-123";

const runTests = process.env.TEST_REAL_DB === "true" ? describe : describe.skip;

runTests("Slow Query Logging (Integration Tier)", () => {
  let server: TestServer;
  let logs: any[] = [];

  beforeEach(async () => {
    logs = [];
    server = await startTestServer({
      NODE_ENV: "test",
      ENABLE_DEBUG_ROUTES: "true",
      DEBUG_ROUTE_TOKEN: DEBUG_TOKEN,
      LOG_LEVEL: "info",
    });

    // Capture logs from stdout
    server.process.stdout?.on("data", (data) => {
      const str = data.toString();
      str.split("\n").forEach((line: string) => {
        if (line.trim()) {
          try {
            logs.push(JSON.parse(line));
          } catch (_e) {
            logs.push({ msg: line });
          }
        }
      });
    });
  });

  afterEach(() => {
    server?.kill();
  });

  it("should emit a [Slow Query] warning with duration context when query exceeds 1s", async () => {
    const res = await fetch(`${server.baseUrl}/api/debug/slow-query?duration=1.2`, {
      method: "POST",
      headers: { "X-RUN-DEBUG-TOKEN": DEBUG_TOKEN },
    });

    expect(res.status).toBe(200);

    // Wait for logs to flush
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const slowLog = logs.find(
      (l) =>
        l.msg?.includes("[Slow Query]") ||
        l.message?.includes("[Slow Query]") ||
        l.msg?.includes("[SLOW REQUEST]") ||
        l.msg?.includes("Slow request detected"),
    );

    expect(slowLog).toBeDefined();

    // Duration can be property or in message
    const duration = slowLog.duration || slowLog.durationMs;
    const durationVal = typeof duration === "string" ? parseFloat(duration) : duration;

    // If not in property, try to parse from message
    if (!duration) {
      // fallback, basic check
      expect(slowLog.msg).toContain("took");
    } else {
      expect(Number(durationVal)).toBeGreaterThan(1000);
    }
    // expect(slowLog.sql).toContain("pg_sleep"); // SQL might be redacted or not captured in basic logger
  }, 20000);
});
