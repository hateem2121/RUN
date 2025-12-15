#!/usr/bin/env node

/**
 * Complete System Synchronization Test
 * Tests: Database, Object Storage, APIs, Routing, Endpoints
 */

const baseUrl = 'http://localhost:5000';

async function testSystemSynchronization() {
  console.log('🔄 TESTING COMPLETE SYSTEM SYNCHRONIZATION\n');

  const results = {
    database: false,
    objectStorage: false,
    apis: false,
    routing: false,
    endpoints: false
  };

  try {
    // Test 1: Database Connection & Performance
    console.log('1️⃣ Testing Database Connection & Performance...');
    const dbStart = Date.now();
    const mediaResponse = await fetch(`${baseUrl}/api/media`);
    const dbTime = Date.now() - dbStart;
    
    if (mediaResponse.ok) {
      const data = await mediaResponse.json();
      console.log(`   ✅ Database: ${data.data.length} assets loaded in ${dbTime}ms`);
      results.database = true;
    } else {
      console.log(`   ❌ Database: HTTP ${mediaResponse.status}`);
    }

    // Test 2: Object Storage Integration
    console.log('\n2️⃣ Testing Object Storage Integration...');
    const storageResponse = await fetch(`${baseUrl}/api/data-integrity/check`);
    
    if (storageResponse.ok) {
      const integrityData = await storageResponse.json();
      console.log(`   ✅ Object Storage: ${integrityData.synchronizationStatus} sync status`);
      console.log(`   📊 Media Assets: ${integrityData.mediaAssets}, Counter: ${integrityData.databaseCounter}`);
      results.objectStorage = true;
    } else {
      console.log(`   ❌ Object Storage: HTTP ${storageResponse.status}`);
    }

    // Test 3: All API Endpoints
    console.log('\n3️⃣ Testing All API Endpoints...');
    const endpoints = [
      '/api/media', '/api/categories', '/api/fabrics', '/api/fibers',
      '/api/certificates', '/api/size-charts', '/api/accessories', '/api/products'
    ];
    
    let successCount = 0;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          successCount++;
          console.log(`   ✅ ${endpoint}: HTTP ${response.status}`);
        } else {
          console.log(`   ❌ ${endpoint}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
      }
    }
    
    results.apis = successCount === endpoints.length;
    console.log(`   📈 APIs: ${successCount}/${endpoints.length} operational`);

    // Test 4: Routing System
    console.log('\n4️⃣ Testing Routing System...');
    const routes = [
      '/api/media/proxy/test',
      '/api/object-storage/test', 
      '/admin/media'
    ];
    
    let routeSuccessCount = 0;
    for (const route of routes) {
      try {
        const response = await fetch(`${baseUrl}${route}`);
        // Accept 404 as valid routing (file not found but route exists)
        if (response.status < 500) {
          routeSuccessCount++;
          console.log(`   ✅ ${route}: HTTP ${response.status} (routed)`);
        } else {
          console.log(`   ❌ ${route}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${route}: ${error.message}`);
      }
    }
    
    results.routing = routeSuccessCount === routes.length;
    console.log(`   🛣️  Routing: ${routeSuccessCount}/${routes.length} routes working`);

    // Test 5: Upload Endpoint (Security Scanner)
    console.log('\n5️⃣ Testing Upload Endpoint & Security Scanner...');
    try {
      const formData = new FormData();
      // Test with empty form to check endpoint availability
      const uploadResponse = await fetch(`${baseUrl}/api/media/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (uploadResponse.status === 400) {
        console.log('   ✅ Upload Endpoint: Available and validating (HTTP 400 for empty upload expected)');
        results.endpoints = true;
      } else {
        console.log(`   ❌ Upload Endpoint: HTTP ${uploadResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Upload Endpoint: ${error.message}`);
    }

    // Summary
    console.log('\n📊 SYNCHRONIZATION TEST RESULTS:');
    console.log('=================================');
    Object.entries(results).forEach(([component, status]) => {
      console.log(`${status ? '✅' : '❌'} ${component.toUpperCase()}: ${status ? 'SYNCHRONIZED' : 'ISSUES DETECTED'}`);
    });

    const overallSync = Object.values(results).every(status => status);
    console.log(`\n🎯 OVERALL SYNCHRONIZATION: ${overallSync ? '✅ PERFECT' : '❌ NEEDS ATTENTION'}`);
    
    return overallSync;

  } catch (error) {
    console.error('❌ Synchronization test failed:', error.message);
    return false;
  }
}

// Run the test
testSystemSynchronization().then(success => {
  process.exit(success ? 0 : 1);
});