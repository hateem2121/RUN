import fetch from 'node-fetch';

async function triggerCacheInvalidation() {
  try {
    console.log('🔄 Triggering cache invalidation via API...\n');
    
    // 1. Create dummy accessory to force cache clear
    console.log('1️⃣ Creating dummy accessory...');
    const createRes = await fetch('http://localhost:5001/api/accessories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER",
        category: "System",
        description: "Temporary item to trigger cache invalidation",
        isActive: false
      })
    });
    
    if (!createRes.ok) {
      throw new Error(`Failed to create dummy: ${createRes.status}`);
    }
    
    const dummy = await createRes.json();
    console.log(`✅ Created dummy accessory ID: ${dummy.id}`);
    
    // 2. Delete the dummy accessory
    console.log('2️⃣ Deleting dummy accessory...');
    const deleteRes = await fetch(`http://localhost:5001/api/accessories/${dummy.id}`, {
      method: 'DELETE'
    });
    
    if (!deleteRes.ok) {
      throw new Error(`Failed to delete dummy: ${deleteRes.status}`);
    }
    console.log('✅ Deleted dummy accessory');
    
    // 3. Verify cache is cleared by fetching list
    console.log('3️⃣ Verifying fresh data...');
    const listRes = await fetch('http://localhost:5001/api/accessories');
    const list = await listRes.json();
    
    console.log(`\n🎉 Success! API now returns ${list.length} accessories.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

await triggerCacheInvalidation();
