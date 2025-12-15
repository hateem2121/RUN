#!/usr/bin/env tsx

import { db } from '../server/db.js';
import { accessories } from '../shared/schema.js';

async function checkAccessories() {
  try {
    console.log('🔍 Checking accessories in database...\n');
    
    const allAccessories = await db.select().from(accessories);
    
    console.log(`Found ${allAccessories.length} accessories in database:\n`);
    
    allAccessories.forEach((acc, index) => {
      console.log(`${index + 1}. ID: ${acc.id}`);
      console.log(`   Name: ${acc.name}`);
      console.log(`   Category: ${acc.category || 'N/A'}`);
      console.log(`   Active: ${acc.isActive}`);
      console.log(`   Deleted: ${acc.deletedAt ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking accessories:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

try {
  await checkAccessories();
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
