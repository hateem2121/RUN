import { db } from "../server/db.js";
import { homepageProcessCards } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function reproduce() {
  console.log(
    "🧪 REPRODUCTION TEST: Creating Process Card via DB directly (simulating API success)\n",
  );

  // 1. Create a card directly in DB to verify persistence works
  const newCard = {
    title: "Test Card " + Date.now(),
    description: "This is a test card created by the reproduction script.",
    step: 1,
    icon: "settings",
    iconType: "text",
    isActive: true,
    position: 0,
  };

  console.log("📝 Inserting card:", newCard);
  const [created] = await db.insert(homepageProcessCards).values(newCard).returning();
  if (!created) {
    console.error("❌ Failed to create card");
    process.exit(1);
  }

  const fetched = await db.query.homepageProcessCards.findFirst({
    where: (cards, { eq }) => eq(cards.id, created.id),
  });

  if (!fetched) {
    console.error("❌ Failed to fetch created card");
    process.exit(1);
  }

  if (fetched.id !== created.id) {
    console.error("❌ Failed to create card");
    process.exit(1);
  }
  console.log("✅ Created Card ID:", created.id);

  // 2. Verify it exists in DB
  const inDb = await db
    .select()
    .from(homepageProcessCards)
    .where(eq(homepageProcessCards.id, created.id));
  console.log("📊 Found in DB:", inDb.length > 0 ? "YES" : "NO");

  if (inDb.length > 0) {
    console.log("   - Title:", inDb[0]?.title);
    console.log("   - Active:", inDb[0]?.isActive);
  }

  console.log("\n🧹 Cleaning up test card...");
  await db.delete(homepageProcessCards).where(eq(homepageProcessCards.id, created.id));
  console.log("✅ Cleanup complete");

  process.exit(0);
}

reproduce().catch(console.error);
