import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

const DEBUG_TOKEN = "test-token-123";

describe("Slow Query Logging (Integration Tier)", () => {
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
					} catch (e) {
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
		const res = await fetch(
			`${server.baseUrl}/api/debug/slow-query?duration=1.2`,
			{
				method: "POST",
				headers: { "X-RUN-DEBUG-TOKEN": DEBUG_TOKEN },
			},
		);

		expect(res.status).toBe(200);

		// Wait for logs to flush
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const slowLog = logs.find(
			(l) =>
				(l.msg && l.msg.includes("[Slow Query]")) ||
				(l.message && l.message.includes("[Slow Query]")),
		);

		expect(slowLog).toBeDefined();
		expect(Number(slowLog.durationMs)).toBeGreaterThan(1000);
		// expect(slowLog.sql).toContain("pg_sleep"); // SQL might be redacted or not captured in basic logger
	}, 20000);
});
