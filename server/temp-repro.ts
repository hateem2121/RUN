
import "dotenv/config";
import { getStorage } from "./lib/storage-singleton.js";
import { logger } from "./lib/monitoring/logger.js";


async function main() {
  try {
    const storage = getStorage();
    logger.info("Storage initialized");

    logger.info("Fetching Homepage Batch Data...");
    const startTime = performance.now();

    const [hero, slogans, sections, featuredProductsSettings, products, categories] =
      await Promise.all([
        storage.getHomepageHero(),
        storage.getHomepageSlogans(),
        storage.getHomepageSections(),
        storage.getHomepageFeaturedProductsSettings(),
        storage.getProducts(20),
        storage.getCategories(),
      ]);

    const duration = performance.now() - startTime;
    logger.info(`Batch fetch completed in ${duration.toFixed(2)}ms`);

    logger.info("Hero:", hero ? "Found" : "Null");
    logger.info("Slogans count:", slogans.length);
    logger.info("Sections count:", sections.length);
    logger.info("Featured Settings:", featuredProductsSettings ? "Found" : "Null");
    logger.info("Products count:", products.length);
    logger.info("Categories count:", categories.length);

  } catch (error) {
    logger.error("Error fetching batch data:", error);
    if (error instanceof Error) {
        logger.error("Stack:", error.stack);
    }
  }
}

main();
