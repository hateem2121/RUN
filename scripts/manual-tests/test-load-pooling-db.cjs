// NEON Connection Pooling Load Test - Database Heavy
const http = require('http');

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 300;
const ENDPOINT = '/api/health/db'; // Health check endpoint that always hits DB

function makeRequest(id) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`${BASE_URL}${ENDPOINT}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          id,
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          duration: Date.now() - startTime
        });
      });
    });
    req.on('error', (error) => {
      resolve({ id, success: false, error: error.message });
    });
    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ id, success: false, error: 'timeout' });
    });
  });
}

async function runTest() {
  console.log(`\n🔥 Testing ${CONCURRENT_USERS} concurrent DB queries (no cache)...\n`);
  
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_USERS }, (_, i) => makeRequest(i + 1));
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  const successful = results.filter(r => r.success).length;
  const failed = CONCURRENT_USERS - successful;
  
  console.log(`✅ Results:`);
  console.log(`   Successful: ${successful}/${CONCURRENT_USERS} (${(successful/CONCURRENT_USERS*100).toFixed(1)}%)`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Duration: ${duration}ms`);
  
  if (successful >= CONCURRENT_USERS * 0.95) {
    console.log(`\n✅ PASS - Connection pooling handles 300+ concurrent DB queries!\n`);
    return 0;
  } else {
    console.log(`\n❌ FAIL - Only ${(successful/CONCURRENT_USERS*100).toFixed(1)}% success rate\n`);
    return 1;
  }
}

runTest().then(code => process.exit(code)).catch(e => { console.error(e); process.exit(1); });
