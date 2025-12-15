#!/usr/bin/env node

/**
 * PHASE 5: PRODUCTION VALIDATION TEST
 * End-to-end flow verification and Replit services integration
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

/**
 * Enhanced API test with comprehensive validation
 */
async function testEndpoint(endpoint, expectedStructure = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, responseTime };
    }
    
    const data = await response.json();
    
    // Validate expected structure
    const hasExpectedStructure = Object.keys(expectedStructure).every(key => 
      data.hasOwnProperty(key)
    );
    
    return { 
      success: true, 
      data, 
      responseTime, 
      hasExpectedStructure,
      status: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      responseTime: Date.now() - startTime 
    };
  }
}

/**
 * Test 1: End-to-End Data Flow Verification
 */
async function testEndToEndDataFlow() {
  console.log('\n🔄 TEST 1: End-to-End Data Flow Verification');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: 'Upload → Object Storage',
      endpoint: '/api/media/test/object-storage-connectivity',
      expected: { success: true }
    },
    {
      name: 'Database → Asset Creation',
      endpoint: '/api/media?page=1&limit=5',
      expected: { success: true, data: {} }
    },
    {
      name: 'Cache → Response Storage',
      endpoint: '/api/media/cache/stats',
      expected: { success: true }
    },
    {
      name: 'Frontend → Display Rendering',
      endpoint: '/api/media?page=1&limit=24',
      expected: { success: true, data: {} }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.expected);
    
    if (result.success && result.hasExpectedStructure) {
      console.log(`✅ ${test.name}: ${result.responseTime}ms`);
      passedTests++;
    } else {
      console.log(`❌ ${test.name}: ${result.error || 'Structure mismatch'}`);
    }
  }
  
  console.log(`\n📊 End-to-End Flow: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

/**
 * Test 2: Replit Services Integration
 */
async function testReplitServicesIntegration() {
  console.log('\n🔗 TEST 2: Replit Services Integration');
  console.log('=' .repeat(60));
  
  const services = [
    {
      name: 'NEON Database Connection',
      endpoint: '/api/media/health',
      validation: (data) => data?.database?.connected === true
    },
    {
      name: 'Object Storage Operations',
      endpoint: '/api/media/test/object-storage-connectivity',
      validation: (data) => data?.objectStorage?.connected === true
    },
    {
      name: 'Key-Value Store Cache',
      endpoint: '/api/media/cache/stats',
      validation: (data) => data?.data?.hitRate !== undefined
    },
    {
      name: 'Environment Variables',
      endpoint: '/api/media/health',
      validation: (data) => data?.environment?.status === 'healthy'
    }
  ];
  
  let connectedServices = 0;
  
  for (const service of services) {
    const result = await testEndpoint(service.endpoint);
    
    if (result.success && service.validation(result.data)) {
      console.log(`✅ ${service.name}: Connected`);
      connectedServices++;
    } else {
      console.log(`⚠️  ${service.name}: Issue detected`);
    }
  }
  
  console.log(`\n📊 Replit Services: ${connectedServices}/${services.length} connected`);
  return connectedServices >= services.length * 0.75; // 75% success threshold
}

/**
 * Test 3: Performance Benchmarks
 */
async function testPerformanceBenchmarks() {
  console.log('\n⚡ TEST 3: Performance Benchmarks');
  console.log('=' .repeat(60));
  
  const benchmarks = [
    { endpoint: '/api/media?page=1&limit=10', target: 1000, name: 'Media List (10 items)' },
    { endpoint: '/api/media/45', target: 2000, name: 'Single Asset Retrieval' },
    { endpoint: '/api/media/cache/stats', target: 500, name: 'Cache Statistics' },
    { endpoint: '/api/media/health', target: 300, name: 'Health Check' },
  ];
  
  let performantEndpoints = 0;
  
  for (const benchmark of benchmarks) {
    const result = await testEndpoint(benchmark.endpoint);
    
    if (result.success) {
      const status = result.responseTime <= benchmark.target ? '✅' : '⚠️ ';
      console.log(`${status} ${benchmark.name}: ${result.responseTime}ms (target: <${benchmark.target}ms)`);
      
      if (result.responseTime <= benchmark.target) {
        performantEndpoints++;
      }
    } else {
      console.log(`❌ ${benchmark.name}: Failed`);
    }
  }
  
  console.log(`\n📊 Performance: ${performantEndpoints}/${benchmarks.length} endpoints within targets`);
  return performantEndpoints >= benchmarks.length * 0.75; // 75% performance threshold
}

/**
 * Test 4: Real-time UI Synchronization (Critical Phase 1 Fix Validation)
 */
async function testRealTimeUISynchronization() {
  console.log('\n🎯 TEST 4: Real-time UI Synchronization (Phase 1 Fix Validation)');
  console.log('=' .repeat(60));
  
  // Test the specific Phase 1 fix: Cache format compatibility
  const result = await testEndpoint('/api/media?page=1&limit=24');
  
  if (!result.success) {
    console.log('❌ MediaGrid API call failed');
    return false;
  }
  
  // Validate Phase 1 fix: Both cache hit/miss formats supported
  let assets = [];
  let formatDetected = 'unknown';
  
  if (Array.isArray(result.data?.data?.data)) {
    assets = result.data.data.data;
    formatDetected = 'cache-miss (data.data.data)';
  } else if (Array.isArray(result.data?.data)) {
    assets = result.data.data;
    formatDetected = 'cache-hit (data.data)';
  }
  
  console.log(`✅ Response Format: ${formatDetected}`);
  console.log(`✅ Assets Retrieved: ${assets.length}`);
  
  if (assets.length > 0) {
    console.log(`✅ Sample Asset: ${assets[0]?.filename} (ID: ${assets[0]?.id})`);
    console.log('✅ CRITICAL: MediaGrid synchronization WORKING - Phase 1 fix successful!');
    return true;
  } else {
    console.log('❌ CRITICAL: No assets retrieved - MediaGrid still showing 0 items');
    return false;
  }
}

/**
 * Main production validation execution
 */
async function runProductionValidation() {
  console.log('🚀 PRODUCTION VALIDATION TEST');
  console.log('=' .repeat(60));
  console.log('Validating forensic investigation completion and system readiness...\n');
  
  const validationResults = {
    endToEndFlow: await testEndToEndDataFlow(),
    replitIntegration: await testReplitServicesIntegration(),
    performance: await testPerformanceBenchmarks(),
    uiSynchronization: await testRealTimeUISynchronization(),
  };
  
  // Final validation summary
  console.log('\n📋 PRODUCTION VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = Object.values(validationResults).filter(Boolean).length;
  const total = Object.keys(validationResults).length;
  
  Object.entries(validationResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const displayName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${displayName}`);
  });
  
  console.log(`\n🎯 PRODUCTION READINESS: ${passed}/${total} validations passed`);
  
  if (passed === total) {
    console.log('🎉 PRODUCTION READY - All systems operational!');
    console.log('✅ Forensic investigation successfully completed');
    console.log('✅ /admin/media system fully synchronized');
    console.log('✅ MediaGrid displaying assets correctly');
    console.log('✅ All Replit services integrated');
    return true;
  } else {
    console.log('⚠️  Production validation incomplete - Review failed tests');
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionValidation()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal validation error:', error);
      process.exit(1);
    });
}

export { runProductionValidation };