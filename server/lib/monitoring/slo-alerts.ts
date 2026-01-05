/**
 * SLO ALERTING MODULE
 * Monitors Service Level Objectives and alerts on violations
 *
 * Reference: Google SRE Book - Alerting on SLOs
 * https://sre.google/workbook/alerting-on-slos/
 */

import * as Sentry from "@sentry/node";
import { logger } from "./logger.js";

// SLO Configuration
export const SLO_CONFIG = {
  availability: {
    target: 0.999, // 99.9%
    windowDays: 30,
    errorBudgetMonthlyMinutes: 43, // ~43 minutes of allowed downtime
  },
  latency: {
    p95Target: 500, // 500ms
    p99Target: 1000, // 1000ms
    windowDays: 7,
  },
  alerting: {
    fastBurnRate: 0.02, // 2% error budget in 1 hour = P0
    slowBurnRate: 0.05, // 5% error budget in 6 hours = P1
  },
};

// Tracking state
interface SLOState {
  totalRequests: number;
  failedRequests: number;
  latencySum: number;
  latencies: number[];
  windowStart: number;
  lastAlertTime: number;
}

const state: SLOState = {
  totalRequests: 0,
  failedRequests: 0,
  latencySum: 0,
  latencies: [],
  windowStart: Date.now(),
  lastAlertTime: 0,
};

// Minimum time between alerts (15 minutes)
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Record a request for SLO tracking
 */
export function recordRequest(durationMs: number, statusCode: number): void {
  state.totalRequests++;
  state.latencySum += durationMs;
  state.latencies.push(durationMs);

  // Keep only last 1000 latencies for percentile calculation
  if (state.latencies.length > 1000) {
    state.latencies.shift();
  }

  // Track failures (5xx errors)
  if (statusCode >= 500) {
    state.failedRequests++;
  }

  // Check SLOs periodically (every 100 requests)
  if (state.totalRequests % 100 === 0) {
    checkSLOs();
  }
}

/**
 * Check SLOs and alert on violations
 */
function checkSLOs(): void {
  const now = Date.now();

  // Avoid alert storms
  if (now - state.lastAlertTime < ALERT_COOLDOWN_MS) {
    return;
  }

  // Calculate current availability
  const availability =
    state.totalRequests > 0
      ? (state.totalRequests - state.failedRequests) / state.totalRequests
      : 1;

  // Calculate p95 latency
  const p95Latency = calculatePercentile(state.latencies, 95);

  // Check availability SLO
  if (availability < SLO_CONFIG.availability.target) {
    const errorRate = ((1 - availability) * 100).toFixed(2);
    const message = `SLO Violation: Availability at ${(availability * 100).toFixed(2)}% (target: ${SLO_CONFIG.availability.target * 100}%, error rate: ${errorRate}%)`;

    logger.error(`[SLO Alert] ${message}`);
    Sentry.captureMessage(message, {
      level: "error",
      tags: {
        slo: "availability",
        severity: "P0",
      },
      extra: {
        totalRequests: state.totalRequests,
        failedRequests: state.failedRequests,
        availability: availability,
        target: SLO_CONFIG.availability.target,
      },
    });

    state.lastAlertTime = now;
  }

  // Check latency SLO
  if (p95Latency > SLO_CONFIG.latency.p95Target) {
    const message = `SLO Violation: p95 latency at ${p95Latency}ms (target: ${SLO_CONFIG.latency.p95Target}ms)`;

    logger.warn(`[SLO Alert] ${message}`);
    Sentry.captureMessage(message, {
      level: "warning",
      tags: {
        slo: "latency",
        severity: "P1",
      },
      extra: {
        p95Latency: p95Latency,
        target: SLO_CONFIG.latency.p95Target,
        sampleSize: state.latencies.length,
      },
    });

    state.lastAlertTime = now;
  }
}

/**
 * Calculate percentile from array of values
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

/**
 * Get current SLO metrics
 */
export function getSLOMetrics() {
  const availability =
    state.totalRequests > 0
      ? (state.totalRequests - state.failedRequests) / state.totalRequests
      : 1;

  const windowHours = (Date.now() - state.windowStart) / (1000 * 60 * 60);

  return {
    availability: {
      current: availability,
      target: SLO_CONFIG.availability.target,
      passing: availability >= SLO_CONFIG.availability.target,
    },
    latency: {
      p95: calculatePercentile(state.latencies, 95),
      p99: calculatePercentile(state.latencies, 99),
      target: SLO_CONFIG.latency.p95Target,
      passing:
        calculatePercentile(state.latencies, 95) <=
        SLO_CONFIG.latency.p95Target,
    },
    stats: {
      totalRequests: state.totalRequests,
      failedRequests: state.failedRequests,
      windowHours: windowHours.toFixed(2),
    },
  };
}

/**
 * Reset SLO tracking state (for testing or window rotation)
 */
export function resetSLOState(): void {
  state.totalRequests = 0;
  state.failedRequests = 0;
  state.latencySum = 0;
  state.latencies = [];
  state.windowStart = Date.now();
  state.lastAlertTime = 0;
  logger.info("[SLO] State reset");
}

// Rotate window daily
setInterval(
  () => {
    const windowAge = Date.now() - state.windowStart;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (windowAge > oneDayMs) {
      logger.info("[SLO] Rotating daily window");
      resetSLOState();
    }
  },
  60 * 60 * 1000,
); // Check hourly
