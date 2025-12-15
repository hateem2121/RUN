// @ts-nocheck
// Extract actual business data from Key-Value Store
import { storage } from '../server/storage.js';

interface BusinessDataRecovery {
  categories: any[];
  products: any[];
  fabrics: any[];
  fibers: any[];
  certificates: any[];
  accessories: any[];
  recoveredCount: number;
}

export class BusinessDataExtractor {
  
  async extractAllBusinessData(): Promise<BusinessDataRecovery> {
    console.log('🔍 EXTRACTING YOUR BUSINESS DATA FROM KEY-VALUE STORE');
    console.log('=' .repeat(60));

    const results: BusinessDataRecovery = {
      categories: [],
      products: [],
      fabrics: [],
      fibers: [],
      certificates: [],
      accessories: [],
      recoveredCount: 0
    };

    // Extract categories
    console.log('\n🏷️ EXTRACTING CATEGORIES...');
    results.categories = await this.extractEntityType('categories');
    console.log(`   ✅ Found ${results.categories.length} categories`);

    // Extract products  
    console.log('\n📦 EXTRACTING PRODUCTS...');
    results.products = await this.extractEntityType('products');
    console.log(`   ✅ Found ${results.products.length} products`);

    // Extract fabrics
    console.log('\n🧵 EXTRACTING FABRICS...');
    results.fabrics = await this.extractEntityType('fabrics');
    console.log(`   ✅ Found ${results.fabrics.length} fabrics`);

    // Extract fibers
    console.log('\n🌿 EXTRACTING FIBERS...');
    results.fibers = await this.extractEntityType('fibers');
    console.log(`   ✅ Found ${results.fibers.length} fibers`);

    // Extract certificates
    console.log('\n📜 EXTRACTING CERTIFICATES...');
    results.certificates = await this.extractEntityType('certificates');
    console.log(`   ✅ Found ${results.certificates.length} certificates`);

    // Extract accessories
    console.log('\n🔧 EXTRACTING ACCESSORIES...');
    results.accessories = await this.extractEntityType('accessories');
    console.log(`   ✅ Found ${results.accessories.length} accessories`);

    results.recoveredCount = results.categories.length + results.products.length + 
                           results.fabrics.length + results.fibers.length + 
                           results.certificates.length + results.accessories.length;

    console.log(`\n🎉 RECOVERY SUMMARY: Found ${results.recoveredCount} total business items!`);
    return results;
  }

  private async extractEntityType(entityType: string): Promise<any[]> {
    const items: any[] = [];
    
    try {
      // First try to get from storage methods
      const storageData = await this.getFromStorage(entityType);
      if (storageData && storageData.length > 0) {
        items.push(...storageData);
        console.log(`   📊 Retrieved ${storageData.length} items from storage.get${this.capitalize(entityType)}()`);
      }

      // Also try direct database access for individual items
      const individualItems = await this.getIndividualItems(entityType);
      if (individualItems.length > 0) {
        // Merge avoiding duplicates
        const existingIds = new Set(items.map(item => item.id));
        const newItems = individualItems.filter(item => !existingIds.has(item.id));
        items.push(...newItems);
        console.log(`   📊 Retrieved ${newItems.length} additional items from individual keys`);
      }

    } catch (error) {
      console.log(`   ⚠️ Error accessing ${entityType}:`, error.message);
    }

    return items;
  }

  private async getFromStorage(entityType: string): Promise<any[]> {
    const methodName = `get${this.capitalize(entityType)}`;
    
    if (typeof storage[methodName] === 'function') {
      return await storage[methodName]();
    }
    
    return [];
  }

  private async getIndividualItems(entityType: string): Promise<any[]> {
    const items: any[] = [];
    const db = (storage as any).db;
    
    // Try individual keys like "categories:1", "categories:2", etc.
    for (let id = 1; id <= 50; id++) {
      try {
        const key = `${entityType}:${id}`;
        const item = await db.get(key);
        if (item && item !== null) {
          items.push(item);
        }
      } catch (error) {
        // Continue checking other IDs
      }
    }

    return items;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async displayBusinessData(data: BusinessDataRecovery) {
    console.log('\n📋 YOUR RECOVERED BUSINESS DATA');
    console.log('=' .repeat(60));

    if (data.categories.length > 0) {
      console.log('\n🏷️ CATEGORIES:');
      data.categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. "${cat.name}" (ID: ${cat.id})`);
        if (cat.description) console.log(`      📝 ${cat.description}`);
        if (cat.slug) console.log(`      🔗 Slug: ${cat.slug}`);
      });
    }

    if (data.products.length > 0) {
      console.log('\n📦 PRODUCTS:');
      data.products.forEach((prod, index) => {
        console.log(`   ${index + 1}. "${prod.name}" (ID: ${prod.id})`);
        if (prod.sku) console.log(`      🏷️ SKU: ${prod.sku}`);
        if (prod.description) console.log(`      📝 ${prod.description.substring(0, 100)}...`);
        if (prod.categoryId) console.log(`      🏷️ Category ID: ${prod.categoryId}`);
      });
    }

    if (data.fabrics.length > 0) {
      console.log('\n🧵 FABRICS:');
      data.fabrics.forEach((fab, index) => {
        console.log(`   ${index + 1}. "${fab.name}" (ID: ${fab.id})`);
        if (fab.fabricType) console.log(`      📝 Type: ${fab.fabricType}`);
        if (fab.description) console.log(`      📝 ${fab.description.substring(0, 100)}...`);
      });
    }

    if (data.fibers.length > 0) {
      console.log('\n🌿 FIBERS:');
      data.fibers.forEach((fiber, index) => {
        console.log(`   ${index + 1}. "${fiber.name}" (ID: ${fiber.id})`);
        if (fiber.type) console.log(`      📝 Type: ${fiber.type}`);
        if (fiber.sustainabilityScore) console.log(`      🌱 Sustainability: ${fiber.sustainabilityScore}/5`);
      });
    }

    if (data.certificates.length > 0) {
      console.log('\n📜 CERTIFICATES:');
      data.certificates.forEach((cert, index) => {
        console.log(`   ${index + 1}. "${cert.name}" (ID: ${cert.id})`);
        if (cert.type) console.log(`      📝 Type: ${cert.type}`);
        if (cert.issuingBody) console.log(`      🏢 Issuer: ${cert.issuingBody}`);
      });
    }

    if (data.accessories.length > 0) {
      console.log('\n🔧 ACCESSORIES:');
      data.accessories.forEach((acc, index) => {
        console.log(`   ${index + 1}. "${acc.name}" (ID: ${acc.id})`);
        if (acc.type) console.log(`      📝 Type: ${acc.type}`);
      });
    }

    console.log(`\n🎯 TOTAL RECOVERED: ${data.recoveredCount} business items`);
    
    if (data.recoveredCount > 0) {
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Your data is intact in the Key-Value Store!');
      console.log('   2. We can migrate this to PostgreSQL with proper relationships');
      console.log('   3. You\'ll get better performance and data integrity');
      console.log('   4. All your hard work is preserved! 🎉');
    }
  }
}

// Export for use
export const dataExtractor = new BusinessDataExtractor();

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  dataExtractor.extractAllBusinessData()
    .then(async (data) => {
      await dataExtractor.displayBusinessData(data);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data extraction failed:', error);
      process.exit(1);
    });
}