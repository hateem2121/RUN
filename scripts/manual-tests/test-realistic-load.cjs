// Realistic Load Test - Gradual Ramp-up
const http = require("node:http");

const BASE_URL = "http://localhost:5000";
const TOTAL_REQUESTS = 350;
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // Stagger batches

function makeRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    http
      .get(`${BASE_URL}/api/products`, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            id,
            success: res.statusCode === 200,
            duration: Date.now() - start,
          }),
        );
      })
      .on("error", (err) => resolve({ id, success: false, error: err.message }));
  });
}

async function runTest() {
  const numBatches = Math.ceil(TOTAL_REQUESTS / BATCH_SIZE);
  const allResults = [];

  for (let batch = 0; batch < numBatches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min((batch + 1) * BATCH_SIZE, TOTAL_REQUESTS);
    const batchRequests = [];

    for (let i = batchStart; i < batchEnd; i++) {
      batchRequests.push(makeRequest(i + 1));
    }
    const batchResults = await Promise.all(batchRequests);
    allResults.push(...batchResults);

    if (batch < numBatches - 1) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const successful = allResults.filter((r) => r.success).length;
  const _failed = TOTAL_REQUESTS - successful;
  const _avgDuration =
    allResults.filter((r) => r.duration).reduce((sum, r) => sum + r.duration, 0) /
    allResults.filter((r) => r.duration).length;

  if (successful >= TOTAL_REQUESTS * 0.95) {
    return 0;
  } else {
    return 1;
  }
}

runTest()
  .then((code) => process.exit(code))
  .catch((_e) => {
    process.exit(1);
  });
