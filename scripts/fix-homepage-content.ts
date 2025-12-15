// @ts-nocheck
import { storage } from "../server/storage.js";

async function fixHomepageContent() {
  console.log("=== FIXING HOMEPAGE CONTENT ===\n");

  const createdItems = [];

  try {
    // Update Homepage Hero (singleton)
    const heroData = {
      title: "Premium B2B Sportswear Manufacturing",
      subtitle: "Quality athletic apparel for teams and organizations worldwide",
      description:
        "Partner with RUN APPAREL for premium sportswear manufacturing with cutting-edge materials and technologies.",
      isActive: true,
    };

    const updatedHero = await storage.updateHomepageHero(heroData);
    console.log(`✅ Updated homepage hero: ${updatedHero.title}`);
    createdItems.push(`Homepage Hero: ${updatedHero.title}`);

    // Create Homepage Slogans (collection)
    const slogans = await storage.getHomepageSlogans();
    if (slogans.length === 0) {
      const sampleSlogans = [
        {
          text: "Performance Engineered",
          description: "Advanced materials for superior athletic performance",
          order: 1,
          isActive: true,
        },
        {
          text: "Sustainably Crafted",
          description: "Eco-friendly manufacturing with recycled materials",
          order: 2,
          isActive: true,
        },
        {
          text: "Globally Delivered",
          description: "Worldwide shipping for organizations of all sizes",
          order: 3,
          isActive: true,
        },
      ];

      for (const slogan of sampleSlogans) {
        const created = await storage.createHomepageSlogan(slogan);
        console.log(`✅ Created homepage slogan: ${created.text}`);
        createdItems.push(`Homepage Slogan: ${created.text}`);
      }
    }

    // Create Homepage Process Cards (collection)
    const processCards = await storage.getHomepageProcessCards();
    if (processCards.length === 0) {
      const cards = [
        {
          title: "Design & Development",
          description: "Custom sportswear design that meets your specific requirements",
          order: 1,
          isActive: true,
        },
        {
          title: "Material Selection",
          description: "Choose from extensive library of high-performance fabrics",
          order: 2,
          isActive: true,
        },
        {
          title: "Precision Manufacturing",
          description: "State-of-the-art facilities ensure consistent quality",
          order: 3,
          isActive: true,
        },
      ];

      for (const card of cards) {
        const created = await storage.createHomepageProcessCard(card);
        console.log(`✅ Created process card: ${created.title}`);
        createdItems.push(`Process Card: ${created.title}`);
      }
    }

    // Update Homepage Sections (singleton per name)
    const sectionData = [
      {
        name: "manufacturing",
        title: "Advanced Manufacturing",
        content: "State-of-the-art facilities utilize the latest technology",
        isActive: true,
      },
      {
        name: "sustainability",
        title: "Sustainable Practices",
        content: "Committed to environmental responsibility and eco-friendly materials",
        isActive: true,
      },
    ];

    for (const section of sectionData) {
      const updated = await storage.updateHomepageSection(section.name, section);
      console.log(`✅ Updated homepage section: ${updated.title}`);
      createdItems.push(`Homepage Section: ${updated.title}`);
    }
  } catch (error) {
    console.error("Homepage content creation failed:", error);
  }

  console.log("\n=== HOMEPAGE CONTENT COMPLETE ===");
  console.log(`Items created/updated: ${createdItems.length}`);
  createdItems.forEach((item) => console.log(`  - ${item}`));
}

// Run the fix
fixHomepageContent().catch(console.error);
