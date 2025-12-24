import { eq } from "drizzle-orm";
import { homepageFeaturedProductsSettings, homepageSections } from "../../shared/schema.js";
import { db } from "../db.js";

async function seedHomepageSections() {
  console.log("🌱 Seeding homepage sections...");

  // 1. Seed Stats Section
  const statsSectionName = "stats";
  const existingStats = await db
    .select()
    .from(homepageSections)
    .where(eq(homepageSections.name, statsSectionName));

  if (existingStats.length === 0) {
    console.log("Creating default Stats section...");
    await db.insert(homepageSections).values({
      name: statsSectionName,
      title: "Impact by the Numbers",
      sectionType: "stats",
      data: {
        stats: [
          { id: "1", label: "Active Users", value: "10k+" },
          { id: "2", label: "Products Sold", value: "50k+" },
          { id: "3", label: "Countries Served", value: "25" },
        ],
      },
      isActive: true,
      sortOrder: 2,
    });
  } else {
    console.log("Stats section already exists.");
  }

  // 2. Seed Values Section
  const valuesSectionName = "values";
  const existingValues = await db
    .select()
    .from(homepageSections)
    .where(eq(homepageSections.name, valuesSectionName));

  if (existingValues.length === 0) {
    console.log("Creating default Values section...");
    await db.insert(homepageSections).values({
      name: valuesSectionName,
      title: "Our Core Values",
      sectionType: "values",
      data: {
        values: [
          {
            id: "1",
            title: "Sustainability",
            subtitle: "Eco-friendly materials",
            description: "We prioritize the planet in every step.",
            colSpan: "col-span-1",
          },
          {
            id: "2",
            title: "Innovation",
            subtitle: "Cutting-edge tech",
            description: "Always pushing boundaries.",
            colSpan: "col-span-2",
          },
          {
            id: "3",
            title: "Quality",
            subtitle: "Built to last",
            description: "Durability you can trust.",
            colSpan: "col-span-1",
          },
        ],
      },
      isActive: true,
      sortOrder: 4,
    });
  } else {
    console.log("Values section already exists.");
  }

  // 3. Seed Featured Products Settings
  const existingSettings = await db.select().from(homepageFeaturedProductsSettings).limit(1);

  if (existingSettings.length === 0) {
    console.log("Creating default Featured Products settings...");
    await db.insert(homepageFeaturedProductsSettings).values({
      title: "Featured Collection",
      maxProducts: 8,
      autoSelect: true,
      sortBy: "featured",
      isActive: true,
      isEnabled: true,
    });
  } else {
    console.log("Featured Products settings already exist.");
  }

  console.log("✅ Seeding completed successfully.");
  process.exit(0);
}

seedHomepageSections().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
