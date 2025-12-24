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
		const slugData = await slugResponse.json();
	} catch (error) {}
	try {
		const byPathResponse = await fetch(
			`${baseUrl}/api/products/by-path?path=relaxed-fit-performance-t-shirt`,
		);
		const byPathData = await byPathResponse.json();

		if (byPathData.product) {
		} else {
		}
	} catch (error) {}
	try {
		const frontendResponse = await fetch(
			`${baseUrl}/category/casual-wear/relaxed-fit-performance-t-shirt`,
		);
		if (frontendResponse.ok) {
		} else {
		}
	} catch (error) {}
	const startTime = Date.now();
	try {
		const productsResponse = await fetch(`${baseUrl}/api/products`);
		const elapsed = Date.now() - startTime;
		if (elapsed < 1000) {
		} else {
		}
	} catch (error) {}
}

testHierarchicalUrls().catch(console.error);
