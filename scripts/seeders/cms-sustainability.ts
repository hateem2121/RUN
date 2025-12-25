/**
 * CMS SUSTAINABILITY PAGE SEEDER
 * Seeds all sustainability-page-related CMS tables
 */

import { eq } from "drizzle-orm";
import { db } from "../../server/db.js";
import {
  mediaAssets,
  sustainabilityFeatures,
  sustainabilityGoals,
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetrics,
  unifiedSustainability,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed sustainability hero section
 */
export async function seedSustainabilityHero(): Promise<SeedResult> {
  return seedWithTransaction("sustainabilityHero", async () => {
    const heroImages = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.filename, "hero-sustainability.jpg"));
    const heroImageId = heroImages[0]?.id || null;

    const heroData = {
      title: "Sustainable Manufacturing for a Better Tomorrow",
      subtitle: "Leading the Industry in Environmental Responsibility",
      description:
        "Our commitment to sustainability goes beyond compliance—it's embedded in every decision we make, from material sourcing to energy consumption.",
      imageId: heroImageId,
      videoId: null,
      isActive: true,
    };

    return await db.insert(sustainabilityHero).values(heroData).returning();
  });
}

/**
 * Seed sustainability initiatives
 */
export async function seedSustainabilityInitiatives(): Promise<SeedResult> {
  return seedWithTransaction("sustainabilityInitiatives", async () => {
    const allMedia = await db.select().from(mediaAssets);
    const sustainImages = allMedia.filter((m) => m.filename?.startsWith("sustainability-"));

    const initiativesData = [
      {
        title: "Solar Energy Transition",
        description:
          "80% of our manufacturing facilities now powered by renewable solar energy, reducing carbon emissions by 45% since 2020.",
        category: "energy",
        impact: "Reduced 2,500 tons of CO2 annually",
        imageId: sustainImages[1]?.id || null,
        launchDate: "2020-01-01",
        status: "active",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Water Recycling System",
        description:
          "Advanced water treatment and recycling system recovers 60% of water used in dyeing and finishing processes.",
        category: "water",
        impact: "Saves 1.5 million gallons annually",
        imageId: sustainImages[2]?.id || null,
        launchDate: "2019-06-01",
        status: "active",
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Waste Reduction Program",
        description:
          "Comprehensive waste management system diverts 90% of production waste from landfills through recycling and repurposing.",
        category: "waste",
        impact: "450 tons of waste recycled yearly",
        imageId: sustainImages[0]?.id || null,
        launchDate: "2018-03-01",
        status: "active",
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Sustainable Materials Program",
        description:
          "Prioritizing organic cotton, recycled polyester, and biodegradable materials across our product lines.",
        category: "materials",
        impact: "65% sustainable material usage",
        imageId: null,
        launchDate: "2021-01-01",
        status: "active",
        isActive: true,
        sortOrder: 4,
      },
      {
        title: "Carbon Offset Program",
        description:
          "Partnership with certified carbon offset projects to achieve carbon neutrality across all operations.",
        category: "carbon",
        impact: "Carbon neutral since 2023",
        imageId: null,
        launchDate: "2022-01-01",
        status: "active",
        isActive: true,
        sortOrder: 5,
      },
    ];

    return await db.insert(sustainabilityInitiatives).values(initiativesData).returning();
  });
}

/**
 * Seed sustainability goals
 */
export async function seedSustainabilityGoals(): Promise<SeedResult> {
  return seedWithTransaction("sustainabilityGoals", async () => {
    const goalsData = [
      {
        title: "100% Renewable Energy",
        description: "Transition all facilities to 100% renewable energy by 2026",
        targetYear: 2026,
        category: "energy",
        progress: 80,
        status: "in_progress",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Zero Waste to Landfill",
        description: "Achieve zero waste to landfill status across all manufacturing sites",
        targetYear: 2025,
        category: "waste",
        progress: 90,
        status: "in_progress",
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Water Neutral Operations",
        description: "Become water neutral through 100% recycling and rainwater harvesting",
        targetYear: 2027,
        category: "water",
        progress: 60,
        status: "in_progress",
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Sustainable Materials",
        description: "Source 95% of materials from certified sustainable suppliers",
        targetYear: 2026,
        category: "materials",
        progress: 65,
        status: "in_progress",
        isActive: true,
        sortOrder: 4,
      },
      {
        title: "Supply Chain Transparency",
        description: "Achieve full supply chain transparency and ethical sourcing certification",
        targetYear: 2025,
        category: "ethics",
        progress: 75,
        status: "in_progress",
        isActive: true,
        sortOrder: 5,
      },
    ];

    return await db.insert(sustainabilityGoals).values(goalsData).returning();
  });
}

/**
 * Seed sustainability metrics
 */
export async function seedSustainabilityMetrics(): Promise<SeedResult> {
  return seedWithTransaction("sustainabilityMetrics", async () => {
    const metricsData = [
      {
        name: "Carbon Emissions Reduction",
        value: "45%",
        unit: "percentage",
        category: "carbon",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Renewable Energy Usage",
        value: "80%",
        unit: "percentage",
        category: "energy",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Water Recycling Rate",
        value: "60%",
        unit: "percentage",
        category: "water",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Waste Diverted from Landfill",
        value: "90%",
        unit: "percentage",
        category: "waste",
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Sustainable Materials",
        value: "65%",
        unit: "percentage",
        category: "materials",
        isActive: true,
        sortOrder: 5,
      },
    ];

    return await db.insert(sustainabilityMetrics).values(metricsData).returning();
  });
}

/**
 * Seed sustainability features
 */
export async function seedSustainabilityFeatures(): Promise<SeedResult> {
  return seedWithTransaction("sustainabilityFeatures", async () => {
    const featuresData = [
      {
        title: "GOTS Certified Organic Cotton",
        description:
          "Global Organic Textile Standard certified organic cotton from verified sustainable farms",
        category: "materials",
        icon: "Leaf",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Recycled Polyester Fabrics",
        description: "High-performance recycled polyester made from post-consumer plastic bottles",
        category: "materials",
        icon: "Recycle",
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Low-Impact Dyes",
        description: "Water-based, non-toxic dyes with minimal environmental impact",
        category: "chemicals",
        icon: "Droplet",
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Energy-Efficient Equipment",
        description: "Latest generation equipment reduces energy consumption by 40%",
        category: "energy",
        icon: "Zap",
        isActive: true,
        sortOrder: 4,
      },
      {
        title: "Biodegradable Packaging",
        description: "Compostable packaging materials for minimal environmental footprint",
        category: "packaging",
        icon: "Package",
        isActive: true,
        sortOrder: 5,
      },
    ];

    return await db.insert(sustainabilityFeatures).values(featuresData).returning();
  });
}

/**
 * Seed unified sustainability
 */
export async function seedUnifiedSustainability(): Promise<SeedResult> {
  return seedWithTransaction("unifiedSustainability", async () => {
    const unifiedData = {
      title: "Unified Sustainability Strategy",
      headline: "Our Holistic Approach",
      subheadline: "Integrating environmental, social, and economic responsibility",
      content: "We believe in a future where manufacturing is a force for good.",
      sectionType: "strategy",
      data: {
        cards: [
          {
            title: "Environmental Stewardship",
            description: "Minimizing our ecological footprint.",
            icon: "Leaf",
            link: "/sustainability/environment",
          },
          {
            title: "Social Responsibility",
            description: "Ensuring fair labor practices.",
            icon: "Users",
            link: "/sustainability/social",
          },
          {
            title: "Economic Viability",
            description: "Creating long-term value.",
            icon: "TrendingUp",
            link: "/sustainability/economic",
          },
        ],
      },
      isActive: true,
    };

    return await db.insert(unifiedSustainability).values(unifiedData).returning();
  });
}

// Export all seeders
export const sustainabilitySeeders = {
  seedSustainabilityHero,
  seedSustainabilityInitiatives,
  seedSustainabilityGoals,
  seedSustainabilityMetrics,
  seedSustainabilityFeatures,
  seedUnifiedSustainability,
};
