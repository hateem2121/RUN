#!/usr/bin/env node

// PHASE 2: Counter Recovery & Data Restoration
import Database from "@replit/database";

async function fixCounterCorruption() {
  const db = new Database();

  const tables = ["fibers", "fabrics", "certificates", "mediaAssets", "categories"];

  for (const table of tables) {
    // Step 1: Scan for existing records regardless of counter
    const existingRecords = [];
    for (let i = 1; i <= 50; i++) {
      // Scan up to 50 potential records
      try {
        const recordKey = `${table}:${i}`;
        const record = await db.get(recordKey);

        if (record?.ok && record.value && record.value !== "null") {
          try {
            const parsed = JSON.parse(record.value);
            if (parsed?.id && typeof parsed === "object") {
              existingRecords.push({ id: i, data: parsed });
            }
          } catch (_parseError) {}
        }
      } catch (_error) {
        // Silent fail for non-existent records
      }
    }

    // Step 2: Get current counter
    const counterKey = `${table}:counter`;
    const currentCounter = await db.get(counterKey);
    const currentCounterValue = currentCounter?.ok ? currentCounter.value : 0;

    // Step 3: Fix counter if corruption detected
    if (existingRecords.length > currentCounterValue) {
      const maxId = Math.max(...existingRecords.map((r) => r.id));

      // Fix the counter
      await db.set(counterKey, maxId);

      // Verify the fix
      const verifyCounter = await db.get(counterKey);
      if (verifyCounter?.ok && verifyCounter.value === maxId) {
      } else {
      }
    } else if (existingRecords.length === currentCounterValue) {
    } else {
    }

    // Step 4: Display recovered data summary
    if (existingRecords.length > 0) {
      existingRecords.forEach((_record) => {});
    }
  }
}

fixCounterCorruption().catch(console.error);
