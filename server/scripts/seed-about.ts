
import { db } from "../db.js";
import { aboutSections, aboutTeamMessages } from "../../shared/schema/content/about.js";
import { eq } from "drizzle-orm";

async function seedAboutData() {
  console.log("🌱 Seeding About Page data...");

  try {
    // 1. Seed Team Message
    const existingTeamMessages = await db.select().from(aboutTeamMessages).limit(1);
    if (existingTeamMessages.length === 0) {
      console.log("Creating default Team Message...");
      await db.insert(aboutTeamMessages).values({
        name: "Alex Runner",
        position: "Founder & CEO",
        message: "At RUN Apparel, we believe that true innovation lies at the intersection of performance and sustainability. For over two decades, we've been pushing the boundaries of what's possible in activewear manufacturing, not just to create better products, but to build a better future for our industry and our planet.",
        isActive: true,
      });
    } else {
      console.log("Team Message already exists, skipping.");
    }

    // 2. Seed Sections (Manufacturing & Capabilities)
    const existingSections = await db.select().from(aboutSections).limit(1);
    // We expect at least one section. If none, we seed a set.
    if (existingSections.length === 0) {
      console.log("Creating default About Sections (Stacking Cards)...");
      
      const sectionsData = [
        {
          title: "Precision Manufacturing",
          description: "State-of-the-art facilities equipped with automated cutting and bonding technologies ensure millimeter-perfect precision for every garment we produce.",
          sectionType: "manufacturing",
          type: "manufacturing",
          mediaIds: [], // We'll assume no media for now or need to seed media separately
          sortOrder: 1,
          isActive: true
        },
        {
          title: "Sustainable Innovation",
          description: "Pioneering eco-friendly production methods, from waterless dyeing processes to recycled fabric integration, drastically reducing our environmental footprint.",
          sectionType: "sustainability",
          type: "sustainability",
          mediaIds: [],
          sortOrder: 2,
          isActive: true
        },
        {
          title: "Material Science",
          description: "Our in-house R&D lab continuously tests and develops new high-performance fabrics that offer superior breathability, durability, and comfort.",
          sectionType: "innovation",
          type: "innovation",
          mediaIds: [],
          sortOrder: 3,
          isActive: true
        }
      ];

      await db.insert(aboutSections).values(sectionsData);
    } else {
      console.log("About Sections already exist, skipping.");
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedAboutData();
