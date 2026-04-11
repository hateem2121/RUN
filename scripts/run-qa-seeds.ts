import { logger } from "../server/lib/monitoring/logger.js";
import { aboutSeeders } from "./seeders/cms-about.js";
import { productEcosystemSeeders } from "./seeders/product-ecosystem.js";

async function runSeeds() {
  logger.info("🚀 Starting QA Data Seeding...");

  try {
    // 1. About Page Data
    logger.info("--- Seeding About Page ---");
    await aboutSeeders.seedAboutHero();
    await aboutSeeders.seedAboutSections();
    await aboutSeeders.seedAboutStatistics();
    await aboutSeeders.seedAboutTeamMessages();
    await aboutSeeders.seedAboutTimelineEntries();
    await aboutSeeders.seedAboutMapLocations();

    // 2. Product Ecosystem Data
    logger.info("--- Seeding Product Ecosystem ---");
    await productEcosystemSeeders.seedCategories();
    await productEcosystemSeeders.seedFibers();
    await productEcosystemSeeders.seedFabrics();
    await productEcosystemSeeders.seedFabricCompositions();
    // await productEcosystemSeeders.seedProducts(); // Might need more dependencies (images)
    await productEcosystemSeeders.seedCertificates();
    await productEcosystemSeeders.seedSizeCharts();
    await productEcosystemSeeders.seedAccessories();

    logger.info("✅ QA Data Seeding Completed Successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();
