import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { homepageSections } from "../shared/schema.js";

async function activateSection() {
  // Activate the manufacturing section
  const [updated] = await db
    .update(homepageSections)
    .set({ isActive: true })
    .where(eq(homepageSections.name, "manufacturing"))
    .returning();

  if (updated) {
  } else {
  }
  const _sections = await db.select().from(homepageSections);
  process.exit(0);
}

activateSection().catch((_error) => {
  process.exit(1);
});
