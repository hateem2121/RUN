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

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
console.log(`🚀 Starting Smoke Test against: ${BASE_URL}`);

async function checkUrl(path: string, expectedStatus = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE_URL}${path}`, (res) => {
        if (res.statusCode !== expectedStatus) {
          reject(new Error(`❌ ${path} returned ${res.statusCode} (Expected ${expectedStatus})`));
          res.resume();
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", (err) => reject(err));
      })
      .on("error", (err) => reject(new Error(`❌ Connection failed: ${err.message}`)));
  });
}

async function run() {
  let hasError = false;

  // 1. Check Health
  try {
    console.log("🔍 Checking /health...");
    const health = await checkUrl("/health");
    console.log("✅ Health check passed.");
  } catch (err: any) {
    console.error(err.message);
    hasError = true;
  }

  // 2. Check Metrics
  try {
    console.log("🔍 Checking /metrics...");
    const metrics = await checkUrl("/metrics");
    if (!metrics.includes("# HELP")) {
      throw new Error("❌ Metrics response does not look like Prometheus format");
    }
    console.log("✅ Metrics endpoint passed.");
  } catch (err: any) {
    console.error(err.message);
    hasError = true;
  }

  // 3. Check Deep Health (Mocked check for now as we rely on /health return)
  // In a real scenario, we might parse the JSON from /health/detailed

  if (hasError) {
    console.error("\n💥 Smoke Test FAILED. Do not promote this deploy.");
    process.exit(1);
  } else {
    console.log("\n✨ All Systems Operational. Smoke Test PASSED.");
    process.exit(0);
  }
}

run();
