// NEON Connection Pooling Load Test
// Tests 300+ concurrent requests to verify connection pooling handles high load

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 350; // Test 350 concurrent users (exceeds 300 target)
const ENDPOINT = '/api/products'; // Database-heavy endpoint

// Fetch pool metrics
async function getPoolMetrics() {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}/api/metrics/database`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.pool);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Make a single request
function makeRequest(id) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`${BASE_URL}${ENDPOINT}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          id,
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          duration,
          error: null
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        id,
        success: false,
        statusCode: null,
        duration,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        id,
        success: false,
        statusCode: null,
        duration: 10000,
        error: 'Request timeout'
      });
    });
  });
}

// Run load test
async function runLoadTest() {
  console.log('\n🔥 NEON Connection Pooling Load Test');
  console.log('=====================================');
  console.log(`Target: ${CONCURRENT_USERS} concurrent users`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  // Get baseline metrics
  console.log('📊 Baseline Pool Metrics:');
  try {
    const baseline = await getPoolMetrics();
    console.log(JSON.stringify(baseline, null, 2));
  } catch (e) {
    console.log('⚠️  Could not fetch baseline metrics:', e.message);
  }

  console.log(`\n🚀 Launching ${CONCURRENT_USERS} concurrent requests...`);
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
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results.filter(r => r.error).map(r => r.error);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));

  // Get post-load metrics
  console.log('\n📊 Post-Load Pool Metrics:');
  let postMetrics;
  try {
    postMetrics = await getPoolMetrics();
    console.log(JSON.stringify(postMetrics, null, 2));
  } catch (e) {
    console.log('⚠️  Could not fetch post-load metrics:', e.message);
  }

  // Print results
  console.log('\n📈 Load Test Results:');
  console.log('=====================================');
  console.log(`Total Requests: ${CONCURRENT_USERS}`);
  console.log(`Successful: ${successful} (${(successful / CONCURRENT_USERS * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${(failed / CONCURRENT_USERS * 100).toFixed(1)}%)`);
  console.log(`\nTiming:`);
  console.log(`  Total Test Duration: ${totalDuration}ms`);
  console.log(`  Avg Request Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`  Min Request Duration: ${minDuration}ms`);
  console.log(`  Max Request Duration: ${maxDuration}ms`);

  if (postMetrics) {
    console.log(`\nConnection Pool Performance:`);
    console.log(`  Total Queries: ${postMetrics.totalQueries}`);
    console.log(`  Successful Queries: ${postMetrics.successfulQueries}`);
    console.log(`  Failed Queries: ${postMetrics.failedQueries}`);
    console.log(`  Peak Concurrent Queries: ${postMetrics.peakConcurrentQueries}`);
    console.log(`  Avg Query Time: ${postMetrics.averageQueryTime.toFixed(2)}ms`);
    console.log(`  Pooling Status: ${postMetrics.connectionPooling}`);
  }

  // Check for connection-related errors
  const connectionErrors = errors.filter(e => 
    e && (e.includes('ECONNREFUSED') || e.includes('pool') || e.includes('connection'))
  );

  if (connectionErrors.length > 0) {
    console.log(`\n❌ CONNECTION ERRORS DETECTED (${connectionErrors.length}):`);
    connectionErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else if (failed > 0) {
    console.log(`\n⚠️  ${failed} requests failed with errors:`);
    const uniqueErrors = [...new Set(errors.filter(Boolean))];
    uniqueErrors.forEach((err, i) => {
      const count = errors.filter(e => e === err).length;
      console.log(`  ${i + 1}. ${err} (${count}x)`);
    });
  }

  // Final verdict
  console.log('\n🎯 Load Test Verdict:');
  console.log('=====================================');
  if (successful >= CONCURRENT_USERS * 0.95) {
    console.log('✅ PASS - Application handles 300+ concurrent users successfully!');
    console.log(`   Success rate: ${(successful / CONCURRENT_USERS * 100).toFixed(1)}%`);
    if (postMetrics && postMetrics.connectionPooling === 'enabled') {
      console.log('✅ Connection pooling is enabled and working correctly');
      console.log(`✅ Peak concurrent queries: ${postMetrics.peakConcurrentQueries}`);
    }
    return 0; // Exit code 0 = success
  } else {
    console.log('❌ FAIL - Too many requests failed');
    console.log(`   Success rate: ${(successful / CONCURRENT_USERS * 100).toFixed(1)}% (threshold: 95%)`);
    return 1; // Exit code 1 = failure
  }
}

// Run the test
runLoadTest()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Load test crashed:', error);
    process.exit(1);
  });
