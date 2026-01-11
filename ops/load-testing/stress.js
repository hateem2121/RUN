/**
 * k6 Stress Test Script
 * Phase 4: Multi-Region & Performance
 *
 * Tests system behavior under 2x expected load
 * Run with: k6 run ops/load-testing/stress.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    // Aggressive ramp-up to stress the system
    { duration: "2m", target: 100 },   // Ramp to normal load
    { duration: "3m", target: 100 },   // Hold normal load
    { duration: "2m", target: 200 },   // Ramp to 2x load (STRESS)
    { duration: "5m", target: 200 },   // Hold stress load
    { duration: "2m", target: 300 },   // Push to 3x (BREAKING POINT)
    { duration: "3m", target: 300 },   // Hold and observe
    { duration: "3m", target: 0 },     // Recovery
  ],
  thresholds: {
    // Relaxed thresholds for stress test (expect some degradation)
    http_req_duration: ["p(95)<500", "p(99)<1000"],  // Allow higher latency
    http_req_failed: ["rate<0.05"],                   // Allow up to 5% errors
    errors: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.runapparel.com";

export default function () {
  // Mixed workload simulating real traffic patterns
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Homepage views
    const res = http.get(`${BASE_URL}/`);
    check(res, { "homepage OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else if (scenario < 0.7) {
    // 30% - Product browsing
    const res = http.get(`${BASE_URL}/api/products`);
    check(res, { "products OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else if (scenario < 0.9) {
    // 20% - Category browsing
    const res = http.get(`${BASE_URL}/api/categories`);
    check(res, { "categories OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else {
    // 10% - Health checks (simulating monitoring)
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { "health OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  }
  
  sleep(Math.random() * 0.5);  // Minimal sleep for high throughput
}

export function handleSummary(data) {
  return {
    "stress-summary.json": JSON.stringify(data, null, 2),
  };
}
