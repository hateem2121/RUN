import fetch from 'node-fetch';

async function triggerSizeChartCacheClear() {
  try {
    console.log('🔄 Triggering size chart cache invalidation via API...\n');
    
    // 1. Create dummy size chart to force cache clear
    console.log('1️⃣ Creating dummy size chart...');
    const createRes = await fetch('http://localhost:5001/api/size-charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER",
        region: "US",
        type: "System",
        description: "Temporary item to trigger cache invalidation",
        measurements: { "S": { "Chest": "100" } },
        isActive: false
      })
    });
    
    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Failed to create dummy: ${createRes.status} - ${text}`);
    }
    
    const dummy = await createRes.json();
    console.log(`✅ Created dummy size chart ID: ${dummy.id}`);
    
    // 2. Delete the dummy size chart
    console.log('2️⃣ Deleting dummy size chart...');
    const deleteRes = await fetch(`http://localhost:5001/api/size-charts/${dummy.id}`, {
      method: 'DELETE'
    });
    
    if (!deleteRes.ok) {
      throw new Error(`Failed to delete dummy: ${deleteRes.status}`);
    }
    console.log('✅ Deleted dummy size chart');
    
    // 3. Verify cache is cleared by fetching list
    console.log('3️⃣ Verifying fresh data...');
    const listRes = await fetch('http://localhost:5001/api/size-charts');
    const list = await listRes.json();
    
    console.log(`\n🎉 Success! API now returns ${list.length} size charts.`);
    
    // List the new charts to confirm
    const newCharts = list.filter((c: any) => 
      c.name.includes("Sculpt & Stride") || 
      c.name.includes("Heavyweight Fleece") || 
      c.name.includes("Pro-Grip")
    );
    
    if (newCharts.length > 0) {
      console.log('\nFound newly added charts:');
      newCharts.forEach((c: any) => console.log(`- ${c.name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

await triggerSizeChartCacheClear();
