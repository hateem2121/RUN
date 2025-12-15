import { db } from "../db.js";
import { homepageProcessCards } from "../../shared/schema.js";
import { desc } from "drizzle-orm"; // Added 'eq' as per snippet, kept 'desc' for the orderBy in the snippet's context

async function main() {
  console.log("🔍 Verifying Homepage Process Cards...");

  try {
    // 1. Count total cards
    const allCards = await db
      .select()
      .from(homepageProcessCards)
      .orderBy(desc(homepageProcessCards.id)); // Re-added orderBy based on original logic and snippet's partial line
    console.log(`\n📊 Total Cards in DB: ${allCards.length}`);

    // 2. Count active cards
    const activeCards = allCards.filter((c) => c.isActive);
    console.log(`✅ Active Cards: ${activeCards.length}`);

    // 3. List IDs and Titles
    console.log("\n📋 Card Details (First 5):");
    allCards.slice(0, 5).forEach((card: any) => {
      // Added type annotation as requested
      console.log(
        `ID: ${card.id} | Title: "${card.title}" | Active: ${card.isActive} | Created: ${card.createdAt}`,
      );
    });

    if (allCards.length === 0) {
      console.log("\nWARNING: Table is empty.");
    } else {
      console.log("\nData verification successful (Read Access OK).");
    }
  } catch (error) {
    console.error("\nCRITICAL: Database Read Failed!", error);
  }

  console.log("--- DIAGNOSTIC END ---");
  process.exit(0);
}

main();
