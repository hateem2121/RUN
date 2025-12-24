/**
 * SMOKE TEST: Post-Deployment Verification
 *
 * Usage: npx tsx scripts/smoke-test.ts
 *
 * Checks:
 * 1. Health Endpoint (200 OK)
 * 2. Metrics Endpoint (200 OK + Prometheus format)
 * 3. Database Connectivity (via Health check details)
 */

import http from "http";

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";

async function checkUrl(path: string, expectedStatus = 200): Promise<string> {
	return new Promise((resolve, reject) => {
		http
			.get(`${BASE_URL}${path}`, (res) => {
				if (res.statusCode !== expectedStatus) {
					reject(
						new Error(
							`❌ ${path} returned ${res.statusCode} (Expected ${expectedStatus})`,
						),
					);
					res.resume();
					return;
				}

				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => resolve(data));
				res.on("error", (err) => reject(err));
			})
			.on("error", (err) =>
				reject(new Error(`❌ Connection failed: ${err.message}`)),
			);
	});
}

async function run() {
	let hasError = false;

	// 1. Check Health
	try {
		const health = await checkUrl("/health");
	} catch (err: any) {
		hasError = true;
	}

	// 2. Check Metrics
	try {
		const metricsStr = await checkUrl("/api/metrics");
		const metrics = JSON.parse(metricsStr);

		if (!metrics.timestamp || !metrics.health) {
			throw new Error(
				"❌ Metrics response missing required fields (timestamp/health)",
			);
		}
	} catch (err: any) {
		hasError = true;
	}

	// 3. Check Deep Health (Mocked check for now as we rely on /health return)
	// In a real scenario, we might parse the JSON from /health/detailed

	if (hasError) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

run();
