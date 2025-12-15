import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function activateSection() {
  console.log("Activating 'manufacturing' section...\n");
  
  // Activate the manufacturing section
  const [updated] = await db.update(homepageSections)
    .set({ isActive: true })
    .where(eq(homepageSections.name, "manufacturing"))
    .returning();
  
  if (updated) {
    console.log("✅ Activated 'manufacturing' section:", {
      id: updated.id,
      name: updated.name,
      title: updated.title,
      isActive: updated.isActive
    });
  } else {
    console.log("❌ Section not found");
  }
  
  // Show final state
  console.log("\n📊 Final section states:");
  const sections = await db.select().from(homepageSections);
  console.table(sections.map(s => ({ 
    name: s.name, 
    isActive: s.isActive,
    title: s.title 
  })));
  
  console.log("\n✨ Done! Now clear your browser cache and refresh http://localhost:5001/");
  process.exit(0);
}

activateSection().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
