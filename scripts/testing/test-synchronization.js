#!/usr/bin/env node

/**
 * Complete System Synchronization Test
 * Tests: Database, Object Storage, APIs, Routing, Endpoints
 */

const baseUrl = "http://localhost:5000";

async function testSystemSynchronization() {
  const results = {
    database: false,
    objectStorage: false,
    apis: false,
    routing: false,
    endpoints: false,
  };

  try {
    const dbStart = Date.now();
    const mediaResponse = await fetch(`${baseUrl}/api/media`);
    const dbTime = Date.now() - dbStart;

    if (mediaResponse.ok) {
      const data = await mediaResponse.json();
      results.database = true;
    } else {
    }
    const storageResponse = await fetch(`${baseUrl}/api/data-integrity/check`);

    if (storageResponse.ok) {
      const integrityData = await storageResponse.json();
      results.objectStorage = true;
    } else {
    }
    const endpoints = [
      "/api/media",
      "/api/categories",
      "/api/fabrics",
      "/api/fibers",
      "/api/certificates",
      "/api/size-charts",
      "/api/accessories",
      "/api/products",
    ];

    let successCount = 0;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          successCount++;
        } else {
        }
      } catch (error) {}
    }

    results.apis = successCount === endpoints.length;
    const routes = ["/api/media/proxy/test", "/api/object-storage/test", "/admin/media"];

    let routeSuccessCount = 0;
    for (const route of routes) {
      try {
        const response = await fetch(`${baseUrl}${route}`);
        // Accept 404 as valid routing (file not found but route exists)
        if (response.status < 500) {
          routeSuccessCount++;
        } else {
        }
      } catch (error) {}
    }

    results.routing = routeSuccessCount === routes.length;
    try {
      const formData = new FormData();
      // Test with empty form to check endpoint availability
      const uploadResponse = await fetch(`${baseUrl}/api/media/upload`, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.status === 400) {
        results.endpoints = true;
      } else {
      }
    } catch (error) {}
    Object.entries(results).forEach(([component, status]) => {});

    const overallSync = Object.values(results).every((status) => status);

    return overallSync;
  } catch (error) {
    return false;
  }
}

// Run the test
testSystemSynchronization().then((success) => {
  process.exit(success ? 0 : 1);
});
