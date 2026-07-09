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
  targetUrl: process.env.STAGING_URL || "http://localhost:5002",
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

          if (consecutiveHealthy >= CONFIG.healthyThreshold) {
            return { healthy: true, attempts: i + 1 };
          }
        } else {
          consecutiveHealthy = 0;
        }
      } else {
        consecutiveHealthy = 0;
      }
    } catch (_error) {
      consecutiveHealthy = 0;
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
  const startTime = Date.now();
  const checks: RecoveryReport["checks"] = [];
  const healthResult = await waitForHealthy(CONFIG.maxRetries);
  checks.push({
    name: "Health Stabilization",
    passed: healthResult.healthy,
    message: healthResult.healthy
      ? `Healthy after ${healthResult.attempts} checks`
      : `Failed to stabilize after ${healthResult.attempts} checks`,
  });
  const cbResult = await verifyCircuitBreakerClosed();
  checks.push({
    name: "Circuit Breaker State",
    passed: cbResult.closed,
    message: `State: ${cbResult.state}`,
  });
  const errorResult = await verifyLowErrorRate();
  checks.push({
    name: "Error Rate",
    passed: errorResult.low,
    message: `Error rate: ${(errorResult.rate! * 100).toFixed(1)}%`,
  });

  const duration = Date.now() - startTime;
  const success = checks.every((c) => c.passed);
  for (const _check of checks) {
  }

  return { success, checks, duration };
}

// Run if executed directly
if (process.argv[1]?.includes("recovery-verification")) {
  verifyRecovery()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((_error) => {
      process.exit(1);
    });
}

export { verifyCircuitBreakerClosed, verifyLowErrorRate, verifyRecovery, waitForHealthy };
