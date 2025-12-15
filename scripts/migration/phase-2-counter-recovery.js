#!/usr/bin/env node

// PHASE 2: Counter Recovery & Data Restoration
import Database from "@replit/database";

async function fixCounterCorruption() {
  const db = new Database();
  
  console.log("=== PHASE 2: COUNTER RECOVERY & DATA RESTORATION ===\n");
  
  const tables = ['fibers', 'fabrics', 'certificates', 'mediaAssets', 'categories'];
  
  for (const table of tables) {
    console.log(`\n🔧 Processing ${table}...`);
    
    // Step 1: Scan for existing records regardless of counter
    const existingRecords = [];
    for (let i = 1; i <= 50; i++) { // Scan up to 50 potential records
      try {
        const recordKey = `${table}:${i}`;
        const record = await db.get(recordKey);
        
        if (record && record.ok && record.value && record.value !== 'null') {
          try {
            const parsed = JSON.parse(record.value);
            if (parsed && parsed.id && typeof parsed === 'object') {
              existingRecords.push({ id: i, data: parsed });
              console.log(`  ✅ Found valid record: ${recordKey} - ${parsed.name || 'NO_NAME'}`);
            }
          } catch (parseError) {
            console.log(`  ⚠️  Parse error for ${recordKey}:`, parseError.message);
          }
        }
      } catch (error) {
        // Silent fail for non-existent records
      }
    }
    
    // Step 2: Get current counter
    const counterKey = `${table}:counter`;
    const currentCounter = await db.get(counterKey);
    const currentCounterValue = currentCounter?.ok ? currentCounter.value : 0;
    
    console.log(`  📊 Current counter: ${currentCounterValue}`);
    console.log(`  📊 Existing records found: ${existingRecords.length}`);
    
    // Step 3: Fix counter if corruption detected
    if (existingRecords.length > currentCounterValue) {
      const maxId = Math.max(...existingRecords.map(r => r.id));
      console.log(`  🚨 CORRUPTION DETECTED! Fixing counter: ${currentCounterValue} → ${maxId}`);
      
      // Fix the counter
      await db.set(counterKey, maxId);
      
      // Verify the fix
      const verifyCounter = await db.get(counterKey);
      if (verifyCounter?.ok && verifyCounter.value === maxId) {
        console.log(`  ✅ Counter fixed successfully: ${table}:counter = ${maxId}`);
      } else {
        console.log(`  ❌ Counter fix failed for ${table}`);
      }
    } else if (existingRecords.length === currentCounterValue) {
      console.log(`  ✅ Counter is correct (${currentCounterValue})`);
    } else {
      console.log(`  ⚠️  Counter higher than existing records (may be normal after deletions)`);
    }
    
    // Step 4: Display recovered data summary
    if (existingRecords.length > 0) {
      console.log(`  📋 Recovered ${table} records:`);
      existingRecords.forEach(record => {
        console.log(`    - ID ${record.id}: ${record.data.name || record.data.title || 'NO_NAME'}`);
      });
    }
  }
  
  console.log("\n=== COUNTER RECOVERY COMPLETE ===");
  console.log("Your existing data should now be accessible through the admin interface!");
}

fixCounterCorruption().catch(console.error);