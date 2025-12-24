// NEON Connection Pooling Load Test
// Tests 300+ concurrent requests to verify connection pooling handles high load

const http = require("http");

const BASE_URL = "http://localhost:5000";
const CONCURRENT_USERS = 350; // Test 350 concurrent users (exceeds 300 target)
const ENDPOINT = "/api/products"; // Database-heavy endpoint

// Fetch pool metrics
async function getPoolMetrics() {
	return new Promise((resolve, reject) => {
		http
			.get(`${BASE_URL}/api/metrics/database`, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => {
					try {
						const json = JSON.parse(data);
						resolve(json.pool);
					} catch (e) {
						reject(e);
					}
				});
			})
			.on("error", reject);
	});
}

// Make a single request
function makeRequest(id) {
	return new Promise((resolve) => {
		const startTime = Date.now();
		const req = http.get(`${BASE_URL}${ENDPOINT}`, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				const duration = Date.now() - startTime;
				resolve({
					id,
					success: res.statusCode === 200,
					statusCode: res.statusCode,
					duration,
					error: null,
				});
			});
		});

		req.on("error", (error) => {
			const duration = Date.now() - startTime;
			resolve({
				id,
				success: false,
				statusCode: null,
				duration,
				error: error.message,
			});
		});

		req.setTimeout(10000, () => {
			req.destroy();
			resolve({
				id,
				success: false,
				statusCode: null,
				duration: 10000,
				error: "Request timeout",
			});
		});
	});
}

// Run load test
async function runLoadTest() {
	try {
		const baseline = await getPoolMetrics();
	} catch (e) {}
	const startTime = Date.now();

	// Launch all requests concurrently
	const promises = [];
	for (let i = 0; i < CONCURRENT_USERS; i++) {
		promises.push(makeRequest(i + 1));
	}

	// Wait for all to complete
	const results = await Promise.all(promises);
	const totalDuration = Date.now() - startTime;

	// Analyze results
	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;
	const errors = results.filter((r) => r.error).map((r) => r.error);
	const avgDuration =
		results.reduce((sum, r) => sum + r.duration, 0) / results.length;
	const maxDuration = Math.max(...results.map((r) => r.duration));
	const minDuration = Math.min(...results.map((r) => r.duration));
	let postMetrics;
	try {
		postMetrics = await getPoolMetrics();
	} catch (e) {}

	if (postMetrics) {
	}

	// Check for connection-related errors
	const connectionErrors = errors.filter(
		(e) =>
			e &&
			(e.includes("ECONNREFUSED") ||
				e.includes("pool") ||
				e.includes("connection")),
	);

	if (connectionErrors.length > 0) {
		connectionErrors.forEach((err, i) => {});
	} else if (failed > 0) {
		const uniqueErrors = [...new Set(errors.filter(Boolean))];
		uniqueErrors.forEach((err, i) => {
			const count = errors.filter((e) => e === err).length;
		});
	}
	if (successful >= CONCURRENT_USERS * 0.95) {
		if (postMetrics && postMetrics.connectionPooling === "enabled") {
		}
		return 0; // Exit code 0 = success
	} else {
		return 1; // Exit code 1 = failure
	}
}

// Run the test
runLoadTest()
	.then((exitCode) => {
		process.exit(exitCode);
	})
	.catch((error) => {
		process.exit(1);
	});
