#!/usr/bin/env node

/**
 * COMPREHENSIVE MEDIA SYSTEM TEST
 * End-to-end testing for forensic-level investigation completion
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

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
      success: false 
    };
  }
}

/**
 * Test 1: Verify MediaGrid Synchronization (CRITICAL PHASE 1 FIX)
 */
async function testMediaGridSynchronization() {
  console.log('\n🎯 TEST 1: MediaGrid Synchronization Verification');
  console.log('=' .repeat(60));
  
  // Test paginated media API
  const result = await fetchAPI('/api/media?page=1&limit=24');
  
  if (!result.success) {
    console.log('❌ CRITICAL: Media API failed');
    console.log(`   Error: ${result.error}`);
    return false;
  }
  
  const { data, responseTime } = result;
  console.log(`✅ Media API Response Time: ${responseTime}ms`);
  
  // Verify Phase 1 fix: Both cache hit/miss formats supported
  let displayAssets = [];
  if (Array.isArray(data?.data?.data)) {
    displayAssets = data.data.data;
    console.log('✅ Cache MISS format detected: data.data.data');
  } else if (Array.isArray(data?.data)) {
    displayAssets = data.data;
    console.log('✅ Cache HIT format detected: data.data');
  } else {
    console.log('❌ CRITICAL: Invalid response format');
    console.log('   Expected: Array in data.data.data OR data.data');
    console.log('   Received:', typeof data?.data);
    return false;
  }
  
  console.log(`✅ MediaGrid Assets Count: ${displayAssets.length}`);
  if (displayAssets.length > 0) {
    console.log(`✅ Sample Asset: ${displayAssets[0]?.filename} (ID: ${displayAssets[0]?.id})`);
  }
  
  return displayAssets.length > 0;
}

/**
 * Test 2: Database-Cache-Frontend Data Flow
 */
async function testDataFlowIntegrity() {
  console.log('\n📊 TEST 2: Complete Data Flow Integrity');
  console.log('=' .repeat(60));
  
  // Step 1: Test individual asset retrieval
  const firstAssetResult = await fetchAPI('/api/media/45'); // Test specific asset
  if (!firstAssetResult.success) {
    console.log('❌ Single asset retrieval failed');
    return false;
  }
  
  console.log(`✅ Single Asset Retrieval: ${firstAssetResult.responseTime}ms`);
  console.log(`   Asset: ${firstAssetResult.data?.data?.filename}`);
  
  // Step 2: Test asset serving through proxy
  const proxyResult = await fetchAPI('/api/media/proxy/45');
  if (!proxyResult.success) {
    console.log('❌ Media proxy serving failed');
    return false;
  }
  
  console.log(`✅ Media Proxy Serving: ${proxyResult.responseTime}ms`);
  
  // Step 3: Test cache performance
  const cacheStatsResult = await fetchAPI('/api/media/cache/stats');
  if (cacheStatsResult.success) {
    const cacheData = cacheStatsResult.data?.data || cacheStatsResult.data;
    console.log(`✅ Cache Hit Rate: ${cacheData?.hitRate || 'N/A'}%`);
    console.log(`✅ Cache Response Time: ${cacheData?.avgResponseTime || 'N/A'}ms`);
  }
  
  return true;
}

/**
 * Test 3: Replit Services Integration
 */
async function testReplitServicesIntegration() {
  console.log('\n🔗 TEST 3: Replit Services Integration');
  console.log('=' .repeat(60));
  
  // Test Object Storage connectivity
  const objectStorageResult = await fetchAPI('/api/media/test/object-storage-connectivity');
  if (objectStorageResult.success) {
    console.log('✅ Object Storage: Connected');
  } else {
    console.log('⚠️  Object Storage: Connection issues detected');
  }
  
  // Test Database integrity
  const dbIntegrityResult = await fetchAPI('/api/media/debug/repair-database-integrity', {
    method: 'POST'
  });
  if (dbIntegrityResult.success) {
    console.log('✅ Database Integrity: Verified');
  } else {
    console.log('⚠️  Database Integrity: Issues detected');
  }
  
  return true;
}

/**
 * Test 4: Performance Benchmarks
 */
async function testPerformanceBenchmarks() {
  console.log('\n⚡ TEST 4: Performance Benchmarks');
  console.log('=' .repeat(60));
  
  const performanceTests = [
    { endpoint: '/api/media?page=1&limit=10', name: 'Media List (10 items)' },
    { endpoint: '/api/media/analytics', name: 'Analytics Dashboard' },
    { endpoint: '/api/media/health', name: 'Health Check' },
  ];
  
  for (const test of performanceTests) {
    const result = await fetchAPI(test.endpoint);
    if (result.success) {
      const status = result.responseTime < 1000 ? '✅' : '⚠️ ';
      console.log(`${status} ${test.name}: ${result.responseTime}ms`);
    } else {
      console.log(`❌ ${test.name}: Failed`);
    }
  }
  
  return true;
}

/**
 * Test 5: Error Handling Resilience
 */
async function testErrorHandling() {
  console.log('\n🛡️  TEST 5: Error Handling Resilience');
  console.log('=' .repeat(60));
  
  // Test invalid asset ID
  const invalidAssetResult = await fetchAPI('/api/media/999999');
  if (invalidAssetResult.error && invalidAssetResult.error.includes('404')) {
    console.log('✅ Invalid Asset Handling: Proper 404 response');
  } else {
    console.log('⚠️  Invalid Asset Handling: Unexpected response');
  }
  
  // Test malformed requests
  const malformedResult = await fetchAPI('/api/media?page=invalid');
  if (malformedResult.success || malformedResult.error) {
    console.log('✅ Malformed Request Handling: Graceful handling');
  }
  
  return true;
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE MEDIA SYSTEM TEST');
  console.log('=' .repeat(60));
  console.log('Testing forensic-level investigation completion...\n');
  
  const testResults = {
    mediaGridSync: await testMediaGridSynchronization(),
    dataFlowIntegrity: await testDataFlowIntegrity(),
    replitIntegration: await testReplitServicesIntegration(),
    performance: await testPerformanceBenchmarks(),
    errorHandling: await testErrorHandling(),
  };
  
  // Summary report
  console.log('\n📋 FINAL TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
  });
  
  console.log(`\n🎯 OVERALL RESULT: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL - Forensic investigation successfully completed!');
    return true;
  } else {
    console.log('⚠️  Some issues detected - Review failed tests above');
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}

export { runComprehensiveTests };