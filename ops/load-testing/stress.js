/**
 * Stress Test Configuration
 *
 * Tests system behavior under heavy load
 * Peak: 500 concurrent users
 * Duration: 30 minutes total
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const productLatency = new Trend("product_api_latency");

// Configuration
export const options = {
  stages: [
    // Ramp up to 100 users over 2 minutes
    { duration: "2m", target: 100 },
    // Ramp up to peak 500 users over 5 minutes
    { duration: "5m", target: 500 },
    // Hold at 500 users for 15 minutes
    { duration: "15m", target: 500 },
    // Ramp down to 100 users over 3 minutes
    { duration: "3m", target: 100 },
    // Ramp down to 0 over 5 minutes
    { duration: "5m", target: 0 },
  ],

  thresholds: {
    // P95 latency should be under 500ms under stress
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    // Error rate should be under 2% under stress
    http_req_failed: ["rate<0.02"],
    // Custom product API latency
    product_api_latency: ["p(95)<300"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5002";

// Mix of realistic user scenarios
const scenarios = [
  { weight: 40, fn: browseProducts },
  { weight: 25, fn: viewProduct },
  { weight: 20, fn: browseCategories },
  { weight: 10, fn: healthCheck },
  { weight: 5, fn: searchProducts },
];

export default function () {
  // Select scenario based on weight
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      scenario.fn();
      return;
    }
  }

  // Default fallback
  browseProducts();
}

function browseProducts() {
  const response = http.get(`${BASE_URL}/api/products`, {
    tags: { name: "GET /api/products" },
  });

  const success = check(response, {
    "products: status 200": (r) => r.status === 200,
    "products: has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  productLatency.add(response.timings.duration);

  sleep(1 + Math.random() * 2);
}

function viewProduct() {
  // First get product list
  const listResponse = http.get(`${BASE_URL}/api/products?limit=10`, {
    tags: { name: "GET /api/products" },
  });

  if (listResponse.status === 200) {
    try {
      const products = JSON.parse(listResponse.body).data;
      if (products && products.length > 0) {
        const productId = products[Math.floor(Math.random() * products.length)].id;

        const response = http.get(`${BASE_URL}/api/products/${productId}`, {
          tags: { name: "GET /api/products/:id" },
        });

        const success = check(response, {
          "product detail: status 200": (r) => r.status === 200,
        });

        errorRate.add(!success);
      }
    } catch (_e) {
      errorRate.add(true);
    }
  }

  sleep(2 + Math.random() * 3);
}

function browseCategories() {
  const response = http.get(`${BASE_URL}/api/categories`, {
    tags: { name: "GET /api/categories" },
  });

  const success = check(response, {
    "categories: status 200": (r) => r.status === 200,
  });

  errorRate.add(!success);
  sleep(1 + Math.random() * 2);
}

function healthCheck() {
  const response = http.get(`${BASE_URL}/api/health`, {
    tags: { name: "GET /api/health" },
  });

  check(response, {
    "health: status 200": (r) => r.status === 200,
  });

  sleep(0.5);
}

function searchProducts() {
  const queries = ["running", "athletic", "sustainable", "performance"];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const response = http.get(`${BASE_URL}/api/products?search=${query}`, {
    tags: { name: "GET /api/products?search" },
  });

  const success = check(response, {
    "search: status 200": (r) => r.status === 200,
  });

  errorRate.add(!success);
  sleep(1 + Math.random() * 2);
}

// Summary handler
export function handleSummary(data) {
  return {
    "stress-summary.json": JSON.stringify(data, null, 2),
  };
}
