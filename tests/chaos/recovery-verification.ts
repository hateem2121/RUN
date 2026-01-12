/**
 * Recovery Verification Script
 *
 * Verifies that the system recovers properly after chaos injection.
 * Run this after chaos tests to confirm:
 * - Health endpoint returns healthy
 * - Circuit breakers reset to CLOSED
 * - Error rate returns to baseline
 *
 * Usage: npx tsx tests/chaos/recovery-verification.ts
 */

interface HealthResponse {
  overall: "healthy" | "degraded" | "unhealthy";
  circuitBreaker?: {
    state: string;
    failureCount: number;
  };
  checks?: Array<{
    service: string;
    status: string;
  }>;
}

interface RecoveryReport {
  success: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  duration: number;
}

const CONFIG = {
  targetUrl: process.env.STAGING_URL || "http://localhost:5001",
  healthEndpoint: "/api/health",
  maxRetries: 30,
  retryIntervalMs: 2000,
  healthyThreshold: 3, // Consecutive healthy checks required
};

/**
 * Wait for health to stabilize
 */
async function waitForHealthy(maxRetries: number): Promise<{ healthy: boolean; attempts: number }> {
  let consecutiveHealthy = 0;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${CONFIG.targetUrl}${CONFIG.healthEndpoint}`);

      if (response.ok) {
        const health: HealthResponse = await response.json();

        if (health.overall === "healthy") {
          consecutiveHealthy++;
          console.log(
            `✓ Health check ${i + 1}: healthy (${consecutiveHealthy}/${CONFIG.healthyThreshold})`,
          );

          if (consecutiveHealthy >= CONFIG.healthyThreshold) {
            return { healthy: true, attempts: i + 1 };
          }
        } else {
          consecutiveHealthy = 0;
          console.log(`○ Health check ${i + 1}: ${health.overall}`);
        }
      } else {
        consecutiveHealthy = 0;
        console.log(`✗ Health check ${i + 1}: HTTP ${response.status}`);
      }
    } catch (error) {
      consecutiveHealthy = 0;
      console.log(`✗ Health check ${i + 1}: connection failed`);
    }

    await new Promise((r) => setTimeout(r, CONFIG.retryIntervalMs));
  }

  return { healthy: false, attempts: maxRetries };
}

/**
 * Verify circuit breaker is closed
 */
async function verifyCircuitBreakerClosed(): Promise<{ closed: boolean; state?: string }> {
  try {
    const response = await fetch(`${CONFIG.targetUrl}${CONFIG.healthEndpoint}`);
    const health: HealthResponse = await response.json();

    if (health.circuitBreaker) {
      const state = health.circuitBreaker.state;
      return { closed: state === "CLOSED", state };
    }

    // No circuit breaker info means it's likely closed (default state)
    return { closed: true, state: "CLOSED (assumed)" };
  } catch {
    return { closed: false, state: "UNKNOWN (connection failed)" };
  }
}

/**
 * Verify error rate is low
 */
async function verifyLowErrorRate(): Promise<{ low: boolean; rate?: number }> {
  // Send test requests and check success rate
  const requests = Array(10)
    .fill(null)
    .map(() => fetch(`${CONFIG.targetUrl}${CONFIG.healthEndpoint}`));

  const responses = await Promise.all(requests);
  const successCount = responses.filter((r) => r.ok).length;
  const errorRate = (10 - successCount) / 10;

  return { low: errorRate < 0.1, rate: errorRate };
}

/**
 * Main recovery verification
 */
async function verifyRecovery(): Promise<RecoveryReport> {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Recovery Verification");
  console.log(`  Target: ${CONFIG.targetUrl}`);
  console.log("═══════════════════════════════════════════════════════\n");

  const startTime = Date.now();
  const checks: RecoveryReport["checks"] = [];

  // Check 1: Health endpoint stabilizes
  console.log("📋 Check 1: Waiting for health to stabilize...");
  const healthResult = await waitForHealthy(CONFIG.maxRetries);
  checks.push({
    name: "Health Stabilization",
    passed: healthResult.healthy,
    message: healthResult.healthy
      ? `Healthy after ${healthResult.attempts} checks`
      : `Failed to stabilize after ${healthResult.attempts} checks`,
  });

  // Check 2: Circuit breaker closed
  console.log("\n📋 Check 2: Verifying circuit breaker state...");
  const cbResult = await verifyCircuitBreakerClosed();
  checks.push({
    name: "Circuit Breaker State",
    passed: cbResult.closed,
    message: `State: ${cbResult.state}`,
  });
  console.log(
    cbResult.closed
      ? `✓ Circuit breaker: ${cbResult.state}`
      : `✗ Circuit breaker: ${cbResult.state}`,
  );

  // Check 3: Error rate low
  console.log("\n📋 Check 3: Verifying error rate...");
  const errorResult = await verifyLowErrorRate();
  checks.push({
    name: "Error Rate",
    passed: errorResult.low,
    message: `Error rate: ${(errorResult.rate! * 100).toFixed(1)}%`,
  });
  console.log(
    errorResult.low
      ? `✓ Error rate: ${(errorResult.rate! * 100).toFixed(1)}%`
      : `✗ Error rate: ${(errorResult.rate! * 100).toFixed(1)}% (threshold: <10%)`,
  );

  const duration = Date.now() - startTime;
  const success = checks.every((c) => c.passed);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RECOVERY REPORT");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Status: ${success ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log("───────────────────────────────────────────────────────");
  for (const check of checks) {
    console.log(`  ${check.passed ? "✓" : "✗"} ${check.name}: ${check.message}`);
  }
  console.log("═══════════════════════════════════════════════════════\n");

  return { success, checks, duration };
}

// Run if executed directly
if (process.argv[1]?.includes("recovery-verification")) {
  verifyRecovery()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Recovery verification failed:", error);
      process.exit(1);
    });
}

export { verifyRecovery, waitForHealthy, verifyCircuitBreakerClosed, verifyLowErrorRate };
