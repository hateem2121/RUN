import { appStorageService } from '../app-storage-service.js';

async function analyzeCircuitBreaker() {
  console.log('='.repeat(80));
  console.log('PHASE 5B - TASK 5B-7: CIRCUIT BREAKER ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Get circuit breaker status
  const circuitStatus = appStorageService.getCircuitStatus();
  const metrics = (appStorageService as any).getMetrics();

  console.log('CIRCUIT BREAKER STATUS:');
  console.log('='.repeat(80));
  console.log();

  console.log(`Current State: ${circuitStatus.state}`);
  console.log(`Failure Count: ${circuitStatus.failureCount}`);
  console.log(`Success Count: ${circuitStatus.successCount}`);
  console.log(`Total State Changes: ${circuitStatus.stateChanges}`);
  console.log(`Last State Change: ${circuitStatus.lastStateChange || 'Never'}`);
  console.log(`Total Failures (all-time): ${circuitStatus.totalFailures}`);
  console.log(`Total Successes (all-time): ${circuitStatus.totalSuccesses}`);
  console.log();

  // Calculate success rate
  const totalOperations = circuitStatus.totalFailures + circuitStatus.totalSuccesses;
  const successRate = totalOperations > 0
    ? ((circuitStatus.totalSuccesses / totalOperations) * 100).toFixed(2)
    : 'N/A';

  console.log('RELIABILITY METRICS:');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total Operations: ${totalOperations}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Failure Rate: ${totalOperations > 0 ? (100 - parseFloat(successRate)).toFixed(2) : 'N/A'}%`);
  console.log();

  // Performance metrics
  console.log('PERFORMANCE METRICS:');
  console.log('='.repeat(80));
  console.log();

  console.log('UPLOADS:');
  console.log(`  Count: ${metrics.uploads.count}`);
  console.log(`  Failures: ${metrics.uploads.failures}`);
  console.log(`  Retries: ${metrics.uploads.retries}`);
  console.log(`  Avg Duration: ${metrics.uploads.avgDuration}ms`);
  console.log(`  Total Duration: ${metrics.uploads.totalDuration}ms`);
  console.log();

  console.log('DOWNLOADS:');
  console.log(`  Count: ${metrics.downloads.count}`);
  console.log(`  Failures: ${metrics.downloads.failures}`);
  console.log(`  Retries: ${metrics.downloads.retries}`);
  console.log(`  Avg Duration: ${metrics.downloads.avgDuration}ms`);
  console.log(`  Total Duration: ${metrics.downloads.totalDuration}ms`);
  console.log();

  console.log('DELETES:');
  console.log(`  Count: ${metrics.deletes.count}`);
  console.log(`  Failures: ${metrics.deletes.failures}`);
  console.log(`  Retries: ${metrics.deletes.retries}`);
  console.log(`  Avg Duration: ${metrics.deletes.avgDuration}ms`);
  console.log(`  Total Duration: ${metrics.deletes.totalDuration}ms`);
  console.log();

  // Circuit breaker configuration analysis
  console.log('CIRCUIT BREAKER CONFIGURATION:');
  console.log('='.repeat(80));
  console.log();
  console.log('THRESHOLDS:');
  console.log(`  Failure Threshold: 5 failures → OPEN circuit`);
  console.log(`  Success Threshold: 2 successes in HALF_OPEN → CLOSED circuit`);
  console.log(`  Timeout Duration: 30000ms (30s) before HALF_OPEN attempt`);
  console.log(`  Half-Open Max Requests: 3 concurrent requests max`);
  console.log(`  Max Retries: 3 attempts per operation`);
  console.log(`  Initial Retry Delay: 1000ms (exponential backoff)`);
  console.log();

  // State analysis
  console.log('STATE ANALYSIS:');
  console.log('='.repeat(80));
  console.log();

  let stateHealth = 'Unknown';
  let recommendation = '';

  if (circuitStatus.state === 'CLOSED') {
    if (circuitStatus.failureCount === 0) {
      stateHealth = '✅ HEALTHY - All operations successful';
      recommendation = 'No action needed. Circuit breaker is working optimally.';
    } else {
      stateHealth = `⚠️ WARNING - ${circuitStatus.failureCount}/5 failures accumulated`;
      recommendation = `Monitor closely. ${5 - circuitStatus.failureCount} more failure(s) will open circuit.`;
    }
  } else if (circuitStatus.state === 'HALF_OPEN') {
    stateHealth = `🔄 RECOVERING - Testing service (${circuitStatus.successCount}/2 successes)`;
    recommendation = `System is recovering. ${2 - circuitStatus.successCount} more success(es) needed to close circuit.`;
  } else if (circuitStatus.state === 'OPEN') {
    stateHealth = '🚨 CRITICAL - Circuit breaker OPEN (service unavailable)';
    recommendation = `Service is down. Circuit will attempt recovery in 30s. Investigate root cause immediately.`;
  }

  console.log(`State Health: ${stateHealth}`);
  console.log(`Recommendation: ${recommendation}`);
  console.log();

  // Retry analysis
  const totalRetries = metrics.uploads.retries + metrics.downloads.retries + metrics.deletes.retries;
  const totalOps = metrics.uploads.count + metrics.downloads.count + metrics.deletes.count;
  const retryRate = totalOps > 0 ? ((totalRetries / totalOps) * 100).toFixed(2) : '0';

  console.log('RETRY ANALYSIS:');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total Retries: ${totalRetries}`);
  console.log(`Total Operations: ${totalOps}`);
  console.log(`Retry Rate: ${retryRate}% (${totalRetries} retries across ${totalOps} operations)`);
  console.log();

  if (parseFloat(retryRate) > 20) {
    console.log('⚠️ HIGH RETRY RATE: >20% of operations are being retried');
    console.log('   Recommendation: Investigate network stability or service health');
  } else if (parseFloat(retryRate) > 10) {
    console.log('⚠️ MODERATE RETRY RATE: 10-20% of operations are being retried');
    console.log('   Recommendation: Monitor for degradation');
  } else {
    console.log('✅ LOW RETRY RATE: <10% of operations are being retried (acceptable)');
  }
  console.log();

  // Threshold optimization analysis
  console.log('THRESHOLD OPTIMIZATION ANALYSIS:');
  console.log('='.repeat(80));
  console.log();

  const failureThreshold = 5;
  const successThreshold = 2;
  const timeoutDuration = 30000;

  console.log('CURRENT THRESHOLDS:');
  console.log(`  Failure Threshold: ${failureThreshold}`);
  console.log(`  Success Threshold: ${successThreshold}`);
  console.log(`  Timeout Duration: ${timeoutDuration}ms`);
  console.log();

  // Analyze if thresholds are optimal
  const totalFailures = circuitStatus.totalFailures;
  // const totalSuccesses = circuitStatus.totalSuccesses;
  const stateChanges = circuitStatus.stateChanges as unknown as number;

  if (stateChanges > 10) {
    console.log('⚠️ HIGH STATE CHANGE FREQUENCY:');
    console.log(`   ${stateChanges} state changes detected`);
    console.log('   This indicates circuit is "flapping" (opening/closing frequently)');
    console.log();
    console.log('RECOMMENDATIONS:');
    console.log('   1. INCREASE failure threshold (5 → 8-10) for more tolerance');
    console.log('   2. INCREASE timeout duration (30s → 60s) to allow more recovery time');
    console.log('   3. INCREASE success threshold (2 → 3-5) for more confidence in recovery');
  } else if (stateChanges === 0 && totalFailures === 0) {
    console.log('✅ OPTIMAL CONFIGURATION:');
    console.log('   No state changes and no failures - thresholds are working well');
  } else if (stateChanges < 5) {
    console.log('✅ STABLE CONFIGURATION:');
    console.log('   Low state change frequency indicates appropriate thresholds');
  }
  console.log();

  // Test scenario recommendations
  console.log('RECOMMENDED TEST SCENARIOS:');
  console.log('='.repeat(80));
  console.log();
  console.log('1. FAILURE THRESHOLD TEST:');
  console.log('   - Simulate 5 consecutive failures');
  console.log('   - Verify circuit opens after 5th failure');
  console.log('   - Confirm operations are blocked while OPEN');
  console.log();
  console.log('2. RECOVERY TEST:');
  console.log('   - Wait 30s after circuit opens');
  console.log('   - Verify circuit moves to HALF_OPEN');
  console.log('   - Simulate 2 successful operations');
  console.log('   - Confirm circuit closes');
  console.log();
  console.log('3. HALF-OPEN FAILURE TEST:');
  console.log('   - Move circuit to HALF_OPEN state');
  console.log('   - Simulate failure during recovery');
  console.log('   - Verify circuit returns to OPEN immediately');
  console.log();
  console.log('4. CONCURRENT REQUEST TEST (HALF_OPEN):');
  console.log('   - Move circuit to HALF_OPEN');
  console.log('   - Send 4+ concurrent requests');
  console.log('   - Verify only 3 are allowed (HALF_OPEN_MAX_REQUESTS)');
  console.log();

  console.log('='.repeat(80));
  console.log('CIRCUIT BREAKER ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

analyzeCircuitBreaker()
  .then(() => {
    console.log('\n✅ Analysis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
