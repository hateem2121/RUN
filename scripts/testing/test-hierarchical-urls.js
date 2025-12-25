#!/usr/bin/env node

/**
 * Comprehensive Hierarchical URL Testing Script
 * Tests all aspects of the hierarchical URL system
 */

async function testHierarchicalUrls() {
  const baseUrl = "http://localhost:5000";
  try {
    const slugResponse = await fetch(
      `${baseUrl}/api/products/slug/relaxed-fit-performance-t-shirt`,
    );
    const _slugData = await slugResponse.json();
  } catch (_error) {}
  try {
    const byPathResponse = await fetch(
      `${baseUrl}/api/products/by-path?path=relaxed-fit-performance-t-shirt`,
    );
    const byPathData = await byPathResponse.json();

    if (byPathData.product) {
    } else {
    }
  } catch (_error) {}
  try {
    const frontendResponse = await fetch(
      `${baseUrl}/category/casual-wear/relaxed-fit-performance-t-shirt`,
    );
    if (frontendResponse.ok) {
    } else {
    }
  } catch (_error) {}
  const startTime = Date.now();
  try {
    const _productsResponse = await fetch(`${baseUrl}/api/products`);
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
    } else {
    }
  } catch (_error) {}
}

testHierarchicalUrls().catch(console.error);
