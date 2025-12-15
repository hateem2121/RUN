#!/usr/bin/env node

/**
 * Comprehensive Hierarchical URL Testing Script
 * Tests all aspects of the hierarchical URL system
 */

async function testHierarchicalUrls() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 HIERARCHICAL URL SYSTEM TEST');
  console.log('================================');
  
  // Test 1: Basic product slug endpoint (known working)
  console.log('\n1. Testing basic product slug endpoint...');
  try {
    const slugResponse = await fetch(`${baseUrl}/api/products/slug/relaxed-fit-performance-t-shirt`);
    const slugData = await slugResponse.json();
    console.log(`✅ Slug endpoint: ${slugData.name} (${slugResponse.status})`);
  } catch (error) {
    console.log(`❌ Slug endpoint failed: ${error.message}`);
  }
  
  // Test 2: By-path endpoint with debug logging
  console.log('\n2. Testing by-path endpoint...');
  try {
    const byPathResponse = await fetch(`${baseUrl}/api/products/by-path?path=relaxed-fit-performance-t-shirt`);
    const byPathData = await byPathResponse.json();
    console.log(`By-path response (${byPathResponse.status}):`, JSON.stringify(byPathData, null, 2));
    
    if (byPathData.product) {
      console.log(`✅ By-path endpoint: Found ${byPathData.product.name}`);
    } else {
      console.log(`❌ By-path endpoint: ${byPathData.error?.message || 'Product not found'}`);
    }
  } catch (error) {
    console.log(`❌ By-path endpoint failed: ${error.message}`);
  }
  
  // Test 3: Frontend hierarchical route
  console.log('\n3. Testing frontend hierarchical route...');
  try {
    const frontendResponse = await fetch(`${baseUrl}/category/casual-wear/relaxed-fit-performance-t-shirt`);
    console.log(`Frontend route status: ${frontendResponse.status}`);
    if (frontendResponse.ok) {
      console.log(`✅ Frontend hierarchical route working`);
    } else {
      console.log(`❌ Frontend hierarchical route failed`);
    }
  } catch (error) {
    console.log(`❌ Frontend route test failed: ${error.message}`);
  }
  
  // Test 4: Database performance check
  console.log('\n4. Testing database performance...');
  const startTime = Date.now();
  try {
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const elapsed = Date.now() - startTime;
    console.log(`Database query time: ${elapsed}ms`);
    if (elapsed < 1000) {
      console.log(`✅ Database performance good (${elapsed}ms)`);
    } else {
      console.log(`⚠️ Database performance slow (${elapsed}ms)`);
    }
  } catch (error) {
    console.log(`❌ Database performance test failed: ${error.message}`);
  }
  
  console.log('\n🏁 Test completed');
}

testHierarchicalUrls().catch(console.error);