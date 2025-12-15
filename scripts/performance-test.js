async function testManufacturingPerformance() {
  console.log("Starting Manufacturing Performance Test...");
  const startTime = Date.now();

  try {
    const response = await fetch("http://localhost:5001/api/manufacturing-batch");
    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log("=== Manufacturing Batch Performance ===");
    console.log(`Response Time: ${duration}ms`);
    console.log(`Status: ${response.status}`);

    if (response.status !== 200) {
      console.error("❌ FAILED: API Status not 200");
      process.exit(1);
    }

    const payloadSize = JSON.stringify(data).length;
    console.log(`Payload Size: ${payloadSize} bytes`);

    console.log(`Has Hero: ${!!data.hero}`);
    console.log(`Process Count: ${data.processes?.length || 0}`);
    console.log(`Capability Count: ${data.capabilities?.length || 0}`);
    console.log(`Quality Count: ${data.qualities?.length || 0}`);

    // Performance assertions
    if (duration > 1000) {
      console.error("❌ FAILED: Response time exceeds 1000ms threshold");
      process.exit(1);
    }

    if (!data.hero) {
      console.error("❌ FAILED: Missing Hero data");
      process.exit(1);
    }

    // While we expect data, we shouldn't fail if DB is empty but structure is correct
    // But data.hero should usually be present if seeded

    console.log("✅ PASSED: All performance checks");
    process.exit(0);
  } catch (error) {
    console.error("❌ Performance test failed:", error);
    process.exit(1);
  }
}

testManufacturingPerformance();
