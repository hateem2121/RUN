
import fetch from 'node-fetch';

async function triggerFibersCacheClear() {
  try {
    console.log('🔄 Triggering fibers cache clear...');

    // 1. Create a dummy fiber
    console.log('  - Creating dummy fiber to invalidate cache...');
    const createResponse = await fetch('http://localhost:5001/api/fibers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER_" + Date.now(),
        type: "System",
        description: "Temporary fiber to trigger cache invalidation",
        sustainabilityScore: 1,
        isActive: false
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create dummy fiber: ${createResponse.statusText}`);
    }

    const createdFiber = await createResponse.json();
    const fiberId = createdFiber.id;
    console.log(`    > Created dummy fiber ID: ${fiberId}`);

    // 2. Delete the dummy fiber
    console.log('  - Deleting dummy fiber...');
    const deleteResponse = await fetch(`http://localhost:5001/api/fibers/${fiberId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete dummy fiber: ${deleteResponse.statusText}`);
    }

    console.log('✅ Cache invalidation triggered successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error triggering cache clear:', error);
    process.exit(1);
  }
}

await triggerFibersCacheClear();
