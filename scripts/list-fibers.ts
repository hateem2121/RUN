
import { db } from '../server/db.js';
import { fibers } from '../shared/schema.js';

async function listFibers() {
  try {
    const allFibers = await db.select().from(fibers);
    console.log('🧵 Available Fibers:\n');
    allFibers.forEach(f => {
      console.log(`[${f.id}] ${f.name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing fibers:', error);
    process.exit(1);
  }
}

listFibers();
