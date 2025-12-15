// Extract and display user's business data for confirmation
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function showUserBusinessData() {
  console.log('📋 YOUR BUSINESS DATA EXTRACTION');
  console.log('=' .repeat(60));

  // Extract categories
  console.log('\n🏷️ CATEGORIES:');
  console.log('-' .repeat(40));
  let categoryCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`categories:${i}`);
      if (result?.ok && result?.value) {
        const cat = JSON.parse(result.value);
        categoryCount++;
        console.log(`${categoryCount}. ${cat.name}`);
        console.log(`   📝 ${cat.description?.substring(0, 100)}...`);
        console.log(`   🔗 Slug: ${cat.slug}`);
        console.log(`   📅 Created: ${new Date(cat.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Extract products
  console.log('\n📦 PRODUCTS:');
  console.log('-' .repeat(40));
  let productCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`products:${i}`);
      if (result?.ok && result?.value) {
        const prod = JSON.parse(result.value);
        productCount++;
        console.log(`${productCount}. ${prod.name}`);
        if (prod.sku) console.log(`   🏷️ SKU: ${prod.sku}`);
        if (prod.description) console.log(`   📝 ${prod.description.substring(0, 100)}...`);
        if (prod.categoryId) console.log(`   🏷️ Category ID: ${prod.categoryId}`);
        console.log(`   📅 Created: ${new Date(prod.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Extract fabrics
  console.log('\n🧵 FABRICS:');
  console.log('-' .repeat(40));
  let fabricCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`fabrics:${i}`);
      if (result?.ok && result?.value) {
        const fab = JSON.parse(result.value);
        fabricCount++;
        console.log(`${fabricCount}. ${fab.name}`);
        if (fab.fabricType) console.log(`   📝 Type: ${fab.fabricType}`);
        if (fab.description) console.log(`   📝 ${fab.description.substring(0, 100)}...`);
        console.log(`   📅 Created: ${new Date(fab.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Extract fibers
  console.log('\n🌿 FIBERS:');
  console.log('-' .repeat(40));
  let fiberCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`fibers:${i}`);
      if (result?.ok && result?.value) {
        const fiber = JSON.parse(result.value);
        fiberCount++;
        console.log(`${fiberCount}. ${fiber.name}`);
        if (fiber.type) console.log(`   📝 Type: ${fiber.type}`);
        if (fiber.sustainabilityScore) console.log(`   🌱 Sustainability: ${fiber.sustainabilityScore}/5`);
        console.log(`   📅 Created: ${new Date(fiber.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Extract certificates
  console.log('\n📜 CERTIFICATES:');
  console.log('-' .repeat(40));
  let certCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`certificates:${i}`);
      if (result?.ok && result?.value) {
        const cert = JSON.parse(result.value);
        certCount++;
        console.log(`${certCount}. ${cert.name}`);
        if (cert.type) console.log(`   📝 Type: ${cert.type}`);
        if (cert.issuingBody) console.log(`   🏢 Issuer: ${cert.issuingBody}`);
        console.log(`   📅 Created: ${new Date(cert.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Extract accessories
  console.log('\n🔧 ACCESSORIES:');
  console.log('-' .repeat(40));
  let accessoryCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`accessories:${i}`);
      if (result?.ok && result?.value) {
        const acc = JSON.parse(result.value);
        accessoryCount++;
        console.log(`${accessoryCount}. ${acc.name}`);
        if (acc.type) console.log(`   📝 Type: ${acc.type}`);
        if (acc.description) console.log(`   📝 ${acc.description.substring(0, 100)}...`);
        console.log(`   📅 Created: ${new Date(acc.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   🏷️ Categories: ${categoryCount}`);
  console.log(`   📦 Products: ${productCount}`);
  console.log(`   🧵 Fabrics: ${fabricCount}`);
  console.log(`   🌿 Fibers: ${fiberCount}`);
  console.log(`   📜 Certificates: ${certCount}`);
  console.log(`   🔧 Accessories: ${accessoryCount}`);
  console.log(`   🎯 Total: ${categoryCount + productCount + fabricCount + fiberCount + certCount + accessoryCount}`);
}

showUserBusinessData().catch(console.error);