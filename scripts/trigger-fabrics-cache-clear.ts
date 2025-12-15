
import fetch from 'node-fetch';

async function triggerFabricsCacheClear() {
  try {
    console.log('🔄 Triggering fabrics cache clear...');

    // 1. Create a dummy fabric
    console.log('  - Creating dummy fabric to invalidate cache...');
    const createResponse = await fetch('http://localhost:5001/api/fabrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER_" + Date.now(),
        description: "Temporary fabric to trigger cache invalidation",
        weight: "0 GSM",
        isActive: false,
        properties: {}
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create dummy fabric: ${createResponse.statusText}`);
    }

    const createdFabric = await createResponse.json();
    const fabricId = createdFabric.id;
    console.log(`    > Created dummy fabric ID: ${fabricId}`);

    // 2. Delete the dummy fabric
    console.log('  - Deleting dummy fabric...');
    const deleteResponse = await fetch(`http://localhost:5001/api/fabrics/${fabricId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete dummy fabric: ${deleteResponse.statusText}`);
    }

    console.log('✅ Cache invalidation triggered successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error triggering cache clear:', error);
    process.exit(1);
  }
}

await triggerFabricsCacheClear();
