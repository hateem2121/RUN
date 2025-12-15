/**
 * CMS HOMEPAGE SEEDER
 * Seeds all homepage-related CMS tables
 */

import { db } from "../../server/db.js";
import { eq } from "drizzle-orm";
import {
  homepageHero,
  homepageSections,
  homepageSlogans,
  homepageProcessCards,
  homepageFeaturedProductsSettings,
  mediaAssets,
} from "../../shared/schema.js";
import { SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed homepage hero section
 */
export async function seedHomepageHero(): Promise<SeedResult> {
  return seedWithTransaction("homepageHero", async () => {
    // Get hero image
    const heroImages = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.filename, "hero-homepage.jpg"));
    const heroImageId = heroImages[0]?.id || null;

    const heroData = {
      title: "Elevate Your Brand with Premium Sportswear",
      subtitle: "B2B Manufacturing Excellence Since 2010",
      description:
        "Industry-leading manufacturer of custom athletic wear, team uniforms, and corporate sportswear. Minimum order 50 units. Global shipping available.",
      ctaText: "View Product Catalog",
      ctaLink: "/products",
      backgroundImageId: heroImageId,
      isActive: true,
      sortOrder: 1,
    };

    return await db.insert(homepageHero).values(heroData).returning();
  });
}

/**
 * Seed homepage slogans
 */
export async function seedHomepageSlogans(): Promise<SeedResult> {
  return seedWithTransaction("homepageSlogans", async () => {
    const sloganData = [
      {
        text: "Quality You Can Trust",
        position: "center",
        isActive: true,
        sortOrder: 1,
      },
      {
        text: "Innovation in Every Stitch",
        position: "center",
        isActive: true,
        sortOrder: 2,
      },
      {
        text: "Sustainable Manufacturing",
        position: "center",
        isActive: true,
        sortOrder: 3,
      },
      {
        text: "Built for Performance",
        position: "center",
        isActive: true,
        sortOrder: 4,
      },
      {
        text: "Made with Precision",
        position: "center",
        isActive: true,
        sortOrder: 5,
      },
      {
        text: "Crafted for Champions",
        position: "center",
        isActive: true,
        sortOrder: 6,
      },
      {
        text: "Excellence in Manufacturing",
        position: "center",
        isActive: true,
        sortOrder: 7,
      },
      {
        text: "Your Vision, Our Expertise",
        position: "center",
        isActive: true,
        sortOrder: 8,
      },
    ];

    return await db.insert(homepageSlogans).values(sloganData).returning();
  });
}

/**
 * Seed homepage process cards
 */
export async function seedHomepageProcessCards(): Promise<SeedResult> {
  return seedWithTransaction("homepageProcessCards", async () => {
    // Get process images
    const allMedia = await db.select().from(mediaAssets);
    const processImages = allMedia.filter((m) => m.filename?.startsWith("process-"));

    const processData = [
      {
        title: "Consultation",
        description: "Work with our design team to bring your vision to life",
        icon: "MessageSquare",
        imageId: null,
        step: 1,
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Design & Sampling",
        description: "Receive detailed mockups and physical samples for approval",
        icon: "Palette",
        imageId: null,
        step: 2,
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Production",
        description: "State-of-the-art manufacturing with rigorous quality control",
        icon: "Factory",
        imageId: processImages[0]?.id || null,
        step: 3,
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Delivery",
        description: "Fast global shipping with full tracking and support",
        icon: "Truck",
        imageId: processImages[processImages.length - 1]?.id || null,
        step: 4,
        isActive: true,
        sortOrder: 4,
      },
    ];

    return await db.insert(homepageProcessCards).values(processData).returning();
  });
}

/**
 * Seed homepage sections
 */
export async function seedHomepageSections(): Promise<SeedResult> {
  return seedWithTransaction("homepageSections", async () => {
    const sectionsData = [
      {
        name: "Why Choose Us",
        title: "Why Choose RUN Apparel",
        content:
          "With over a decade of experience, we deliver premium quality athletic wear and team uniforms to businesses worldwide. Our commitment to sustainability, innovation, and customer satisfaction sets us apart.",
        sectionType: "feature-grid",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Manufacturing Capabilities",
        title: "Our Manufacturing Capabilities",
        content:
          "From cutting-edge fabric technology to precision manufacturing, our facilities are equipped to handle orders of any scale with consistent quality and fast turnaround times.",
        sectionType: "image-text",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Sustainability",
        title: "Sustainability First",
        content:
          "We prioritize eco-friendly materials, renewable energy, and waste reduction in every aspect of our production process. Our GOTS and OEKO-TEX certifications demonstrate our commitment.",
        sectionType: "feature-list",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Global Partnerships",
        title: "Trusted by Brands Worldwide",
        content:
          "We partner with sports teams, corporate brands, and retailers across 40+ countries, delivering excellence in every order.",
        sectionType: "testimonial",
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Get Started",
        title: "Ready to Get Started?",
        content:
          "Whether you need team uniforms, corporate apparel, or custom sportswear, our team is ready to help bring your vision to life.",
        sectionType: "cta",
        isActive: true,
        sortOrder: 5,
      },
    ];

    return await db.insert(homepageSections).values(sectionsData).returning();
  });
}

/**
 * Seed homepage featured products settings
 */
export async function seedHomepageFeaturedProducts(): Promise<SeedResult> {
  return seedWithTransaction("homepageFeaturedProductsSettings", async () => {
    const settingsData = {
      title: "Featured Products",
      maxProducts: 8,
      autoSelect: true,
      sortBy: "featured",
      isActive: true,
    };

    return await db.insert(homepageFeaturedProductsSettings).values(settingsData).returning();
  });
}

// Export all seeders
export const homepageSeeders = {
  seedHomepageHero,
  seedHomepageSlogans,
  seedHomepageProcessCards,
  seedHomepageSections,

  seedHomepageFeaturedProducts,
};
