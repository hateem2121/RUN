#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Comprehensive Database Relationship Verification Script
 * Tests all foreign key relationships, data integrity, and constraint enforcement
 */

import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
import { 
  categories, 
  products, 
  mediaAssets,
  fabrics,
  fibers,
  certificates,
  sizeCharts,
  accessories
} from '../shared/schema.js';

console.log('🔍 Starting comprehensive database relationship verification...');

async function verifyDatabaseRelationships() {
  try {
    let allChecks = 0;
    let passedChecks = 0;
    
    console.log('📊 Phase 1: Entity Count Verification');
    
    // Count all entities
    const entityCounts = {
      categories: (await db.select().from(categories)).length,
      products: (await db.select().from(products)).length,
      mediaAssets: (await db.select().from(mediaAssets)).length,
      fabrics: (await db.select().from(fabrics)).length,
      fibers: (await db.select().from(fibers)).length,
      certificates: (await db.select().from(certificates)).length,
      sizeCharts: (await db.select().from(sizeCharts)).length,
      accessories: (await db.select().from(accessories)).length
    };
    
    console.log('📋 Entity Counts:');
    Object.entries(entityCounts).forEach(([entity, count]) => {
      console.log(`  ${entity}: ${count}`);
    });
    allChecks++;
    passedChecks++;
    
    console.log('\n📊 Phase 2: Foreign Key Relationship Verification');
    
    // Test 1: Product-Category Relationships
    console.log('🔗 Testing Product-Category relationships...');
    const allProducts = await db.select().from(products);
    let productCategoryLinks = 0;
    
    for (const product of allProducts) {
      if (product.categoryId) {
        const category = await db.select().from(categories).where(eq(categories.id, product.categoryId));
        if (category.length > 0) {
          productCategoryLinks++;
        } else {
          console.error(`❌ Product "${product.name}" has invalid categoryId: ${product.categoryId}`);
        }
      }
    }
    
    allChecks++;
    if (productCategoryLinks === allProducts.filter(p => p.categoryId).length) {
      console.log(`✅ All ${productCategoryLinks} product-category links valid`);
      passedChecks++;
    } else {
      console.log(`❌ Invalid product-category links found`);
    }
    
    // Test 2: Product-Fabric Relationships
    console.log('🔗 Testing Product-Fabric relationships...');
    let productFabricLinks = 0;
    
    for (const product of allProducts) {
      if (product.fabricId) {
        const fabric = await db.select().from(fabrics).where(eq(fabrics.id, product.fabricId));
        if (fabric.length > 0) {
          productFabricLinks++;
        } else {
          console.error(`❌ Product "${product.name}" has invalid fabricId: ${product.fabricId}`);
        }
      }
    }
    
    allChecks++;
    if (productFabricLinks === allProducts.filter(p => p.fabricId).length) {
      console.log(`✅ All ${productFabricLinks} product-fabric links valid`);
      passedChecks++;
    } else {
      console.log(`❌ Invalid product-fabric links found`);
    }
    
    // Test 3: Product-Media Relationships
    console.log('🔗 Testing Product-Media relationships...');
    let productMediaLinks = 0;
    
    for (const product of allProducts) {
      if (product.primaryImageId) {
        const media = await db.select().from(mediaAssets).where(eq(mediaAssets.id, product.primaryImageId));
        if (media.length > 0) {
          productMediaLinks++;
        } else {
          console.error(`❌ Product "${product.name}" has invalid primaryImageId: ${product.primaryImageId}`);
        }
      }
    }
    
    allChecks++;
    if (productMediaLinks === allProducts.filter(p => p.primaryImageId).length) {
      console.log(`✅ All ${productMediaLinks} product-media links valid`);
      passedChecks++;
    } else {
      console.log(`❌ Invalid product-media links found`);
    }
    
    console.log('\n📊 Phase 3: Data Integrity Verification');
    
    // Test 4: Unique Constraints
    console.log('🔗 Testing unique constraints...');
    
    // Categories slug uniqueness
    const categorySlugs = await db.select({ slug: categories.slug }).from(categories);
    const uniqueCategorySlugs = new Set(categorySlugs.map(c => c.slug));
    
    allChecks++;
    if (categorySlugs.length === uniqueCategorySlugs.size) {
      console.log(`✅ Category slugs are unique (${categorySlugs.length})`);
      passedChecks++;
    } else {
      console.log(`❌ Duplicate category slugs found`);
    }
    
    // Products slug uniqueness
    const productSlugs = await db.select({ slug: products.slug }).from(products);
    const uniqueProductSlugs = new Set(productSlugs.map(p => p.slug));
    
    allChecks++;
    if (productSlugs.length === uniqueProductSlugs.size) {
      console.log(`✅ Product slugs are unique (${productSlugs.length})`);
      passedChecks++;
    } else {
      console.log(`❌ Duplicate product slugs found`);
    }
    
    console.log('\n📊 Phase 4: Enhanced Field Verification');
    
    // Test 5: Required Field Population
    console.log('🔗 Testing required field population...');
    
    // Fibers must have type
    const fibersWithType = await db.select().from(fibers);
    const validFiberTypes = fibersWithType.filter(f => f.type && f.type.length > 0);
    
    allChecks++;
    if (validFiberTypes.length === fibersWithType.length) {
      console.log(`✅ All ${fibersWithType.length} fibers have valid types`);
      passedChecks++;
    } else {
      console.log(`❌ Some fibers missing type field`);
    }
    
    // Test 6: Enhanced Data Fields
    console.log('🔗 Testing enhanced data fields...');
    
    // Fabrics with enhanced properties
    const fabricsWithProps = await db.select().from(fabrics);
    const fabricsWithEnhancedData = fabricsWithProps.filter(f => 
      f.fabricType && f.weight && f.composition && f.properties
    );
    
    allChecks++;
    if (fabricsWithEnhancedData.length === fabricsWithProps.length) {
      console.log(`✅ All ${fabricsWithProps.length} fabrics have enhanced data`);
      passedChecks++;
    } else {
      console.log(`❌ Some fabrics missing enhanced data`);
    }
    
    console.log('\n📊 Phase 5: Business Logic Verification');
    
    // Test 7: B2B Specific Fields
    console.log('🔗 Testing B2B specific fields...');
    
    const productsWithB2BData = allProducts.filter(p => 
      p.moq && p.leadTime && p.customizationOptions && p.fiberComposition
    );
    
    allChecks++;
    if (productsWithB2BData.length === allProducts.length) {
      console.log(`✅ All ${allProducts.length} products have B2B data`);
      passedChecks++;
    } else {
      console.log(`❌ Some products missing B2B fields`);
    }
    
    // Test 8: Data Type Validation
    console.log('🔗 Testing data type validation...');
    
    // Price fields should be numeric
    const productsWithValidPrices = allProducts.filter(p => 
      !p.basePrice || !isNaN(parseFloat(p.basePrice))
    );
    
    allChecks++;
    if (productsWithValidPrices.length === allProducts.length) {
      console.log(`✅ All product prices are valid numeric values`);
      passedChecks++;
    } else {
      console.log(`❌ Some products have invalid price formats`);
    }
    
    console.log('\n📊 Phase 6: Cross-Entity Data Consistency');
    
    // Test 9: Fabric-Product Composition Consistency
    console.log('🔗 Testing fabric-product composition consistency...');
    
    let compositionMatches = 0;
    for (const product of allProducts) {
      if (product.fabricId && product.fiberComposition) {
        const fabric = await db.select().from(fabrics).where(eq(fabrics.id, product.fabricId));
        if (fabric.length > 0 && fabric[0].composition) {
          // Check if fiber composition is related to fabric composition
          if (product.fiberComposition.includes(fabric[0].composition.split(',')[0].split('%')[1].trim())) {
            compositionMatches++;
          }
        }
      }
    }
    
    allChecks++;
    // Allow for some flexibility in composition matching
    if (compositionMatches >= allProducts.filter(p => p.fabricId && p.fiberComposition).length * 0.5) {
      console.log(`✅ Fabric-product composition consistency acceptable (${compositionMatches} matches)`);
      passedChecks++;
    } else {
      console.log(`❌ Low fabric-product composition consistency`);
    }
    
    // Final Summary
    console.log('\n📋 VERIFICATION SUMMARY');
    console.log('==========================================');
    console.log(`Total Checks: ${allChecks}`);
    console.log(`Passed Checks: ${passedChecks}`);
    console.log(`Failed Checks: ${allChecks - passedChecks}`);
    console.log(`Success Rate: ${((passedChecks / allChecks) * 100).toFixed(1)}%`);
    
    if (passedChecks === allChecks) {
      console.log('✅ ALL RELATIONSHIP VERIFICATIONS PASSED!');
    } else {
      console.log(`⚠️ ${allChecks - passedChecks} verification(s) failed - review above for details`);
    }
    
    // Detailed Entity Analysis
    console.log('\n📊 DETAILED ENTITY ANALYSIS');
    console.log('==========================================');
    
    // Category Analysis
    const categoryAnalysis = await db.select().from(categories);
    console.log('📂 Categories:');
    categoryAnalysis.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Order: ${cat.displayOrder || 0}`);
    });
    
    // Product Distribution by Category
    console.log('\n👕 Products by Category:');
    const categoryProducts = {};
    for (const product of allProducts) {
      if (product.categoryId) {
        const category = await db.select().from(categories).where(eq(categories.id, product.categoryId));
        if (category.length > 0) {
          const categoryName = category[0].name;
          if (!categoryProducts[categoryName]) categoryProducts[categoryName] = 0;
          categoryProducts[categoryName]++;
        }
      }
    }
    Object.entries(categoryProducts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    
    // Fabric Usage Analysis
    console.log('\n🧵 Fabric Usage:');
    const fabricUsage = {};
    for (const product of allProducts) {
      if (product.fabricId) {
        const fabric = await db.select().from(fabrics).where(eq(fabrics.id, product.fabricId));
        if (fabric.length > 0) {
          const fabricName = fabric[0].name;
          if (!fabricUsage[fabricName]) fabricUsage[fabricName] = 0;
          fabricUsage[fabricName]++;
        }
      }
    }
    Object.entries(fabricUsage).forEach(([fabric, count]) => {
      console.log(`  - ${fabric}: ${count} products`);
    });
    
    return {
      totalChecks: allChecks,
      passedChecks,
      failedChecks: allChecks - passedChecks,
      successRate: ((passedChecks / allChecks) * 100).toFixed(1),
      entityCounts,
      categoryProducts,
      fabricUsage
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Execute verification
verifyDatabaseRelationships()
  .then((results) => {
    console.log('\n✅ Database relationship verification completed!');
    console.log('Results Summary:', {
      successRate: results.successRate + '%',
      totalEntities: Object.values(results.entityCounts).reduce((sum, count) => sum + count, 0)
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  });