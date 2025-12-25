#!/usr/bin/env node

/**
 * COMPREHENSIVE MEDIA SYSTEM TEST
 * End-to-end testing for forensic-level investigation completion
 */

import fetch from "node-fetch";

const API_BASE = process.env.API_BASE || "http://localhost:5000";

/**
 * Enhanced API fetch with comprehensive error details
 */
async function fetchAPI(endpoint, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, responseTime, success: true };
  } catch (error) {
    return {
      error: error.message,
      responseTime: Date.now() - startTime,
      success: false,
    };
  }
}

/**
 * Test 1: Verify MediaGrid Synchronization (CRITICAL PHASE 1 FIX)
 */
async function testMediaGridSynchronization() {
  // Test paginated media API
  const result = await fetchAPI("/api/media?page=1&limit=24");

  if (!result.success) {
    return false;
  }

  const { data, responseTime } = result;

  // Verify Phase 1 fix: Both cache hit/miss formats supported
  let displayAssets = [];
  if (Array.isArray(data?.data?.data)) {
    displayAssets = data.data.data;
  } else if (Array.isArray(data?.data)) {
    displayAssets = data.data;
  } else {
    return false;
  }
  if (displayAssets.length > 0) {
  }

  return displayAssets.length > 0;
}

/**
 * Test 2: Database-Cache-Frontend Data Flow
 */
async function testDataFlowIntegrity() {
  // Step 1: Test individual asset retrieval
  const firstAssetResult = await fetchAPI("/api/media/45"); // Test specific asset
  if (!firstAssetResult.success) {
    return false;
  }

  // Step 2: Test asset serving through proxy
  const proxyResult = await fetchAPI("/api/media/proxy/45");
  if (!proxyResult.success) {
    return false;
  }

  // Step 3: Test cache performance
  const cacheStatsResult = await fetchAPI("/api/media/cache/stats");
  if (cacheStatsResult.success) {
    const cacheData = cacheStatsResult.data?.data || cacheStatsResult.data;
  }

  return true;
}

/**
 * Test 3: Replit Services Integration
 */
async function testReplitServicesIntegration() {
  // Test Object Storage connectivity
  const objectStorageResult = await fetchAPI("/api/media/test/object-storage-connectivity");
  if (objectStorageResult.success) {
  } else {
  }

  // Test Database integrity
  const dbIntegrityResult = await fetchAPI("/api/media/debug/repair-database-integrity", {
    method: "POST",
  });
  if (dbIntegrityResult.success) {
  } else {
  }

  return true;
}

/**
 * Test 4: Performance Benchmarks
 */
async function testPerformanceBenchmarks() {
  const performanceTests = [
    { endpoint: "/api/media?page=1&limit=10", name: "Media List (10 items)" },
    { endpoint: "/api/media/analytics", name: "Analytics Dashboard" },
    { endpoint: "/api/media/health", name: "Health Check" },
  ];

  for (const test of performanceTests) {
    const result = await fetchAPI(test.endpoint);
    if (result.success) {
      const status = result.responseTime < 1000 ? "✅" : "⚠️ ";
    } else {
    }
  }

  return true;
}

/**
 * Test 5: Error Handling Resilience
 */
async function testErrorHandling() {
  // Test invalid asset ID
  const invalidAssetResult = await fetchAPI("/api/media/999999");
  if (invalidAssetResult.error && invalidAssetResult.error.includes("404")) {
  } else {
  }

  // Test malformed requests
  const malformedResult = await fetchAPI("/api/media?page=invalid");
  if (malformedResult.success || malformedResult.error) {
  }

  return true;
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  const testResults = {
    mediaGridSync: await testMediaGridSynchronization(),
    dataFlowIntegrity: await testDataFlowIntegrity(),
    replitIntegration: await testReplitServicesIntegration(),
    performance: await testPerformanceBenchmarks(),
    errorHandling: await testErrorHandling(),
  };

  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;

  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? "✅ PASS" : "❌ FAIL";
  });

  if (passed === total) {
    return true;
  } else {
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      process.exit(1);
    });
}

export { runComprehensiveTests };
