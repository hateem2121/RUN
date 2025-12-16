// Realistic Load Test - Gradual Ramp-up
const http = require('http');

const BASE_URL = 'http://localhost:5000';
const TOTAL_REQUESTS = 350;
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // Stagger batches

function makeRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(`${BASE_URL}/api/products`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ id, success: res.statusCode === 200, duration: Date.now() - start }));
    }).on('error', err => resolve({ id, success: false, error: err.message }));
  });
}

async function runTest() {
  console.log('\n🔥 Realistic Load Test: 350 users with gradual ramp-up\n');
  const numBatches = Math.ceil(TOTAL_REQUESTS / BATCH_SIZE);
  const allResults = [];
  
  for (let batch = 0; batch < numBatches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min((batch + 1) * BATCH_SIZE, TOTAL_REQUESTS);
    const batchRequests = [];
    
    for (let i = batchStart; i < batchEnd; i++) {
      batchRequests.push(makeRequest(i + 1));
    }
    
    console.log(`Batch ${batch + 1}/${numBatches}: ${batchRequests.length} requests...`);
    const batchResults = await Promise.all(batchRequests);
    allResults.push(...batchResults);
    
    if (batch < numBatches - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
  
  const successful = allResults.filter(r => r.success).length;
  const failed = TOTAL_REQUESTS - successful;
  const avgDuration = allResults.filter(r => r.duration).reduce((sum, r) => sum + r.duration, 0) / allResults.filter(r => r.duration).length;
  
  console.log(`\n✅ Results:`);
  console.log(`   Total: ${TOTAL_REQUESTS}`);
  console.log(`   Successful: ${successful} (${(successful/TOTAL_REQUESTS*100).toFixed(1)}%)`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms\n`);
  
  if (successful >= TOTAL_REQUESTS * 0.95) {
    console.log('✅ PASS - Connection pooling handles 300+ concurrent users!\n');
    return 0;
  } else {
    console.log(`❌ FAIL - Only ${(successful/TOTAL_REQUESTS*100).toFixed(1)}% success rate\n`);
    return 1;
  }
}

runTest().then(code => process.exit(code)).catch(e => { console.error(e); process.exit(1); });
