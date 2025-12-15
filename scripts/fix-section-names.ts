import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";
import { eq } from "drizzle-orm";
// import { logger } from "../server/lib/smart-logger.js";

/**
 * Fix homepage section names to match frontend expectations
 *
 * Frontend expects (from homepage.tsx):
 * - "manufacturing" - for Process Cards section
 * - "products" - for Featured Products section
 * - "sustainability" - for Sustainability section
 */
async function fixSectionNames() {
  console.log("Fixing homepage section names...\n");

  // Get current sections
  const sections = await db.select().from(homepageSections);
  console.log("Current sections:");
  console.table(sections.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive })));

  // Define the mapping
  const nameMapping: Record<string, string> = {
    "Manufacturing Capabilities": "manufacturing",
    Sustainability: "sustainability",
    // We'll need to determine which section should be "products"
    // For now, let's assume "Get Started" or create a new one
  };

  // Apply updates
  for (const [oldName, newName] of Object.entries(nameMapping)) {
    const section = sections.find((s) => s.name === oldName);
    if (section) {
      console.log(`\nUpdating "${oldName}" -> "${newName}"...`);
      await db
        .update(homepageSections)
        .set({ name: newName })
        .where(eq(homepageSections.id, section.id));
      console.log(`✅ Updated section ID ${section.id}`);
    } else {
      console.log(`⚠️  Section "${oldName}" not found`);
    }
  }

  // Check if we need to create a "products" section
  const hasProductsSection = sections.some(
    (s) => s.name === "products" || nameMapping[s.name] === "products",
  );
  if (!hasProductsSection) {
    console.log('\n⚠️  No "products" section found. Creating one...');
    await db.insert(homepageSections).values({
      name: "products",
      sectionType: "featured-products",
      title: "Featured Products",
      content: "Discover our premium athletic wear collection",
      isActive: true,
      sortOrder: 2,
      data: {},
    });
    console.log('✅ Created "products" section');
  }

  // Show final state
  console.log("\n📊 Final sections:");
  const finalSections = await db.select().from(homepageSections);
  console.table(
    finalSections.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive, title: s.title })),
  );

  console.log("\n✨ Section name fix complete!");
  process.exit(0);
}

fixSectionNames().catch((error) => {
  console.error("❌ Error fixing section names:", error);
  process.exit(1);
});
