import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startTestServer, type TestServer } from "./test-utils";

const DEBUG_TOKEN = "test-token-123";

describe("Proxy & IP Security (Integration Tier)", () => {
	let server: TestServer;

	beforeEach(async () => {
		server = await startTestServer({
			NODE_ENV: "development",
			DEBUG_ROUTE_TOKEN: DEBUG_TOKEN,
			ENABLE_DEBUG_ROUTES: "true",
			// server/index.ts sets app.set("trust proxy", true) by default
		});
	});

	afterEach(() => {
		server?.kill();
	});

	it("should allow request from localhost (default behavior)", async () => {
		const res = await fetch(
			`${server.baseUrl}/api/debug/slow-query?duration=0.1`,
			{
				method: "POST",
				headers: { "X-RUN-DEBUG-TOKEN": DEBUG_TOKEN },
			},
		);
		expect(res.status).toBe(200);
	});

	it("should IGNORE spoofed X-Forwarded-For header and ALLOW valid localhost connection", async () => {
		// We now verify physical connection.
		// Even if header says 1.2.3.4, we are PHYSICALLY localhost, so we should be allowed.
		const res = await fetch(
			`${server.baseUrl}/api/debug/slow-query?duration=0.1`,
			{
				method: "POST",
				headers: {
					"X-RUN-DEBUG-TOKEN": DEBUG_TOKEN,
					"X-Forwarded-For": "1.2.3.4",
				},
			},
		);

		// Returned 200 means it ignored the 1.2.3.4 header and trusted the ::1 socket.
		expect(res.status).toBe(200);
	});

	it("should ALLOW request if X-Forwarded-For is 127.0.0.1 (Spoofing Vulnerability Check)", async () => {
		// This demonstrates the vulnerability. If this passes (200), it means
		// anyone can bypass the IP check by sending this header if trust proxy is on.
		const res = await fetch(
			`${server.baseUrl}/api/debug/slow-query?duration=0.1`,
			{
				method: "POST",
				headers: {
					"X-RUN-DEBUG-TOKEN": DEBUG_TOKEN,
					"X-Forwarded-For": "127.0.0.1",
				},
			},
		);

		// If robust, this should arguably fail if we don't trust the proxy...
		// But since we are localhost, we ARE 127.0.0.1 at the TCP layer.
		// However, Express logic uses the header preferred.
		// Ideally, for "Security Hardening", we should NOT blindly trust proxy headers
		// for security gates unless we verify the immediate peer is a trusted proxy.

		// For now, let's see what happens.
		expect(res.status).toBe(200);
	});
});
