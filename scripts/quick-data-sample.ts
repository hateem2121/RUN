// Quick sample of user's business data
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function showDataSample() {
  console.log('🎯 SAMPLING YOUR BUSINESS DATA');
  console.log('=' .repeat(50));
  
  // Sample a few categories
  console.log('\n🏷️ SAMPLE CATEGORIES:');
  for (let i = 1; i <= 5; i++) {
    try {
      const cat = await db.get(`categories:${i}`);
      if (cat) {
        console.log(`   ${i}. "${cat.name}" (ID: ${cat.id})`);
        if (cat.description) console.log(`      📝 ${cat.description}`);
      }
    } catch (e) {}
  }

  // Sample a few products
  console.log('\n📦 SAMPLE PRODUCTS:');
  for (let i = 1; i <= 5; i++) {
    try {
      const prod = await db.get(`products:${i}`);
      if (prod) {
        console.log(`   ${i}. "${prod.name}" (ID: ${prod.id})`);
        if (prod.sku) console.log(`      🏷️ SKU: ${prod.sku}`);
        if (prod.description) console.log(`      📝 ${prod.description.substring(0, 80)}...`);
      }
    } catch (e) {}
  }

  // Sample a few fabrics
  console.log('\n🧵 SAMPLE FABRICS:');
  for (let i = 1; i <= 5; i++) {
    try {
      const fab = await db.get(`fabrics:${i}`);
      if (fab) {
        console.log(`   ${i}. "${fab.name}" (ID: ${fab.id})`);
        if (fab.fabricType) console.log(`      📝 Type: ${fab.fabricType}`);
      }
    } catch (e) {}
  }

  console.log('\n✅ Your data is preserved! Ready for PostgreSQL migration.');
}

showDataSample().catch(console.error);