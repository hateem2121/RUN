/**
 * k6 Load Testing Script - Baseline Performance Test
 * Phase 4: Multi-Region & Performance
 *
 * Run with: k6 run ops/load-testing/baseline.js
 * Or with cloud: k6 cloud ops/load-testing/baseline.js
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const homeLatency = new Trend("home_latency");

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: "2m", target: 50 },   // Ramp to 50 users over 2 minutes
    { duration: "5m", target: 50 },   // Stay at 50 users for 5 minutes
    { duration: "2m", target: 100 },  // Ramp to 100 users
    { duration: "5m", target: 100 },  // Stay at 100 users for 5 minutes
    { duration: "2m", target: 0 },    // Ramp-down
  ],
  thresholds: {
    // SLO-aligned thresholds
    http_req_duration: ["p(95)<200", "p(99)<500"],  // P95 < 200ms, P99 < 500ms
    http_req_failed: ["rate<0.01"],                  // Error rate < 1%
    errors: ["rate<0.01"],
    api_latency: ["p(95)<150"],                      // API P95 < 150ms
    home_latency: ["p(95)<300"],                     // Homepage P95 < 300ms (includes SSR)
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.runapparel.com";

export default function () {
  group("Homepage Load", function () {
    const res = http.get(`${BASE_URL}/`);
    
    check(res, {
      "homepage status is 200": (r) => r.status === 200,
      "homepage has content": (r) => r.body.length > 1000,
      "homepage loads fast": (r) => r.timings.duration < 500,
    });
    
    errorRate.add(res.status !== 200);
    homeLatency.add(res.timings.duration);
  });

  sleep(1);

  group("API Health Check", function () {
    const res = http.get(`${BASE_URL}/api/health`);
    
    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health response is fast": (r) => r.timings.duration < 50,
    });
    
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  });

  sleep(0.5);

  group("Product Catalog API", function () {
    const res = http.get(`${BASE_URL}/api/products`);
    
    check(res, {
      "products status is 200": (r) => r.status === 200,
      "products returns array": (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) || (data.products && Array.isArray(data.products));
        } catch {
          return false;
        }
      },
      "products response time OK": (r) => r.timings.duration < 200,
    });
    
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  });

  sleep(1);

  group("Categories API", function () {
    const res = http.get(`${BASE_URL}/api/categories`);
    
    check(res, {
      "categories status is 200": (r) => r.status === 200,
      "categories response time OK": (r) => r.timings.duration < 150,
    });
    
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  });

  sleep(0.5);

  group("Static Assets", function () {
    // Test that static assets are served quickly (CDN)
    const res = http.get(`${BASE_URL}/favicon.ico`);
    
    check(res, {
      "static asset served": (r) => r.status === 200 || r.status === 304,
      "static asset fast": (r) => r.timings.duration < 100,
    });
  });

  sleep(Math.random() * 2);  // Random sleep to simulate real user behavior
}

// Lifecycle hooks
export function setup() {
  console.log(`Running baseline load test against: ${BASE_URL}`);
  
  // Verify target is accessible
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error(`Target not healthy: ${res.status}`);
  }
  
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Test completed. Started at: ${data.startTime}`);
}

export function handleSummary(data) {
  return {
    "summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  // Custom summary output
  const { metrics } = data;
  
  let output = "\n========== LOAD TEST SUMMARY ==========\n\n";
  
  output += "Key Metrics:\n";
  output += `  HTTP Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `  P95 Latency: ${metrics.http_req_duration?.values?.["p(95)"]?.toFixed(2) || 0}ms\n`;
  output += `  P99 Latency: ${metrics.http_req_duration?.values?.["p(99)"]?.toFixed(2) || 0}ms\n`;
  output += `  Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  
  output += "\nThreshold Status:\n";
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    output += `  ${name}: ${threshold.ok ? "✅ PASS" : "❌ FAIL"}\n`;
  }
  
  output += "\n========================================\n";
  
  return output;
}
