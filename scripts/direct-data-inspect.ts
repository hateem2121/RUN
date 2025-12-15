// @ts-nocheck
// Direct inspection of Key-Value Store data
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function inspectRawData() {
  console.log('🔍 DIRECT DATA INSPECTION');
  console.log('=' .repeat(50));
  
  // Check first few categories directly
  console.log('\n🏷️ RAW CATEGORY DATA:');
  for (let i = 1; i <= 3; i++) {
    try {
      const raw = await db.get(`categories:${i}`);
      console.log(`   categories:${i} =>`, JSON.stringify(raw, null, 2));
    } catch (e) {
      console.log(`   categories:${i} => ERROR:`, e.message);
    }
  }

  // Check first few products directly
  console.log('\n📦 RAW PRODUCT DATA:');
  for (let i = 1; i <= 3; i++) {
    try {
      const raw = await db.get(`products:${i}`);
      console.log(`   products:${i} =>`, JSON.stringify(raw, null, 2));
    } catch (e) {
      console.log(`   products:${i} => ERROR:`, e.message);
    }
  }

  // Check batch keys too
  console.log('\n📋 BATCH DATA:');
  try {
    const catBatch = await db.get('categories');
    console.log('   categories (batch) =>', Array.isArray(catBatch) ? `Array with ${catBatch.length} items` : typeof catBatch);
    if (Array.isArray(catBatch) && catBatch.length > 0) {
      console.log('   First category:', JSON.stringify(catBatch[0], null, 2));
    }
  } catch (e) {
    console.log('   categories (batch) => ERROR:', e.message);
  }

  try {
    const prodBatch = await db.get('products');
    console.log('   products (batch) =>', Array.isArray(prodBatch) ? `Array with ${prodBatch.length} items` : typeof prodBatch);
    if (Array.isArray(prodBatch) && prodBatch.length > 0) {
      console.log('   First product:', JSON.stringify(prodBatch[0], null, 2));
    }
  } catch (e) {
    console.log('   products (batch) => ERROR:', e.message);
  }
}

inspectRawData().catch(console.error);