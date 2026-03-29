import { eq } from "drizzle-orm";
import { db } from "./server/db";
import { footerConfiguration } from "./shared/schemas/content/common";

async function run() {
  console.log("Starting manual DB update...");

  const [existing] = await db.select().from(footerConfiguration).limit(1);
  if (!existing) {
    console.log("No footer configuration found to update.");
    return;
  }

  const newBrandText = `RUN APPAREL AUDIT TEST ${new Date().toISOString()}`;
  console.log(`Updating brandText to: ${newBrandText}`);

  const [updated] = await db
    .update(footerConfiguration)
    .set({
      brandText: newBrandText,
      companyName: "RUN APPAREL AUDIT ENTITY",
      updatedAt: new Date(),
    })
    .where(eq(footerConfiguration.id, existing.id))
    .returning();

  console.log("Update complete:", JSON.stringify(updated, null, 2));
  process.exit(0);
}

run().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
