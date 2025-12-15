import { db } from "../server/db.js";
import { homepageProcessCards } from "../shared/schema.js";

async function checkCards() {
  const cards = await db.select().from(homepageProcessCards);
  console.log('\n📊 Process Cards in Database:');
  console.table(cards.map(c => ({ 
    id: c.id, 
    title: c.title, 
    isActive: c.isActive 
  })));
  console.log(`\nTotal: ${cards.length} cards`);
  process.exit(0);
}

checkCards().catch(console.error);
