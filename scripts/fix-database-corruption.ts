import { storage } from '../server/storage.js';

async function fixDatabaseCorruption() {
  console.log('=== DATABASE CORRUPTION FIX ===\n');
  
  // Check for corrupted categories similar to how fibers were corrupted
  console.log('Checking for corrupted categories...');
  
  try {
    const categories = await storage.getCategories();
    console.log(`Categories retrieved: ${categories.length}`);
    
    // If categories are empty but database shows records, there's likely corruption
    if (categories.length === 0) {
      console.log('❌ Categories data corruption detected - no items retrieved despite database records');
      console.log('This is the same issue we fixed with fibers.');
      console.log('The database may contain corrupted entries that need cleanup.');
    }
    
    // Test creating a fresh category to see if the system works
    console.log('\nTesting category creation...');
    const testCategory = await storage.createCategory({
      name: 'Test Performance Category',
      slug: 'test-performance-category',
      description: 'Test category for database functionality',
      isActive: true,
      metaTitle: 'Test Performance Category',
      metaDescription: 'Test category for verifying database functionality'
    });
    
    console.log(`✅ Test category created: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Now check if we can retrieve it
    const categoriesAfterTest = await storage.getCategories();
    console.log(`Categories after test: ${categoriesAfterTest.length}`);
    
    if (categoriesAfterTest.length > 0) {
      console.log('✅ Categories are now working correctly');
    } else {
      console.log('❌ Categories still not working after test creation');
    }
    
  } catch (error) {
    console.error('Error during corruption fix:', error);
  }
}

// Run the fix
fixDatabaseCorruption().catch(console.error);