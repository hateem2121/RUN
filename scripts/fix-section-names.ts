import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";

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
  // Get current sections
  const sections = await db.select().from(homepageSections);

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
      await db
        .update(homepageSections)
        .set({ name: newName })
        .where(eq(homepageSections.id, section.id));
    } else {
    }
  }

  // Check if we need to create a "products" section
  const hasProductsSection = sections.some(
    (s) => s.name === "products" || nameMapping[s.name] === "products",
  );
  if (!hasProductsSection) {
    await db.insert(homepageSections).values({
      name: "products",
      sectionType: "featured-products",
      title: "Featured Products",
      content: "Discover our premium athletic wear collection",
      isActive: true,
      sortOrder: 2,
      data: {},
    });
  }
  const finalSections = await db.select().from(homepageSections);
  process.exit(0);
}

fixSectionNames().catch((error) => {
  process.exit(1);
});
