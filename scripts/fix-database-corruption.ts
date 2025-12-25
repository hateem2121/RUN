import { storage } from "../server/storage.js";

async function fixDatabaseCorruption() {
  try {
    const categories = await storage.getCategories();

    // If categories are empty but database shows records, there's likely corruption
    if (categories.length === 0) {
    }
    const testCategory = await storage.createCategory({
      name: "Test Performance Category",
      slug: "test-performance-category",
      description: "Test category for database functionality",
      isActive: true,
      metaTitle: "Test Performance Category",
      metaDescription: "Test category for verifying database functionality",
    });

    // Now check if we can retrieve it
    const categoriesAfterTest = await storage.getCategories();

    if (categoriesAfterTest.length > 0) {
    } else {
    }
  } catch (error) {}
}

// Run the fix
fixDatabaseCorruption().catch(() => {});
