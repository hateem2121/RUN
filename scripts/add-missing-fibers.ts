
import { db } from '../server/db.js';
import { fibers } from '../shared/schema.js';

async function addMissingFibers() {
  try {
    console.log('➕ Adding missing fibers...\n');

    const newFibers = [
      {
        name: "Merino Wool",
        type: "Natural",
        description: "High-performance natural wool fiber known for temperature regulation and odor resistance.",
        sustainabilityScore: 5,
        environmentalImpact: "Renewable and biodegradable.",
        properties: {},
        isActive: true
      }
    ];

    const inserted = await db.insert(fibers).values(newFibers).returning();

    console.log(`✅ Successfully added ${inserted.length} fibers:`);
    inserted.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding fibers:', error);
    process.exit(1);
  }
}

addMissingFibers();
