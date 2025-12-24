async function testManufacturingPerformance() {
	const startTime = Date.now();

	try {
		const response = await fetch(
			"http://localhost:5001/api/manufacturing-batch",
		);
		const duration = Date.now() - startTime;
		const data = await response.json();

		if (response.status !== 200) {
			process.exit(1);
		}

		const payloadSize = JSON.stringify(data).length;

		// Performance assertions
		if (duration > 1000) {
			process.exit(1);
		}

		if (!data.hero) {
			process.exit(1);
		}
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

testManufacturingPerformance();
