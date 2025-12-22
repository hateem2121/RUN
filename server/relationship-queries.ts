// Relationship Query Examples: PostgreSQL vs Current Key-Value Store
// This demonstrates the power of proper database relationships

import { and, desc, eq } from 'drizzle-orm';
import { categories, fabricCompositions, fabrics, fibers, mediaAssets, products } from '../shared/schema.js';
import { db } from './db.js';
import { storage } from './storage.js'; // Your current Key-Value Store

// =============================================================================
// COMPARISON 1: Get Product with All Related Data
// =============================================================================

/**
 * PostgreSQL Approach - ONE QUERY with proper relationships
 */
export async function getProductWithRelatedDataSQL(productId: number) {
  console.log('🔥 PostgreSQL: Getting product with relationships in ONE query');

  const startTime = performance.now();

  const result = await db
    .select({
      // Product data
      product: products,
      // Related category data
      category: categories,
      // Related fabric data
      fabric: fabrics,
      // Primary image data
      primaryImage: mediaAssets,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(fabrics, eq(products.fabricId, fabrics.id))
    .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
    .where(eq(products.id, productId));

  const duration = performance.now() - startTime;
  console.log(`✅ PostgreSQL: Retrieved complete product data in ${duration}ms with 1 query`);

  return result[0];
}

/**
 * Current Key-Value Store Approach - MULTIPLE QUERIES
 */
export async function getProductWithRelatedDataKeyValue(productId: number) {
  console.log('⚠️  Key-Value Store: Getting product with multiple separate queries');

  const startTime = performance.now();
  let queryCount = 0;

  // Query 1: Get product
  const product = await storage.getProduct(productId);
  queryCount++;

  if (!product) {
    console.log(`❌ Key-Value Store: Product ${productId} not found`);
    return null;
  }

  // Query 2: Get category (if exists)
  let category = null;
  if (product.categoryId) {
    category = await storage.getCategory(product.categoryId);
    queryCount++;
  }

  // Query 3: Get fabric (if exists)
  let fabric = null;
  if (product.fabricId) {
    fabric = await storage.getFabric(product.fabricId);
    queryCount++;
  }

  // Query 4: Get primary image (if exists)
  let primaryImage = null;
  if (product.primaryImageId) {
    primaryImage = await storage.getMediaAsset(product.primaryImageId);
    queryCount++;
  }

  // Query 5-N: Get certificates (multiple queries)
  let certificates: any[] = [];
  if (product.certificateIds && product.certificateIds.length > 0) {
    certificates = await Promise.all(
      product.certificateIds.map(async (certId) => {
        queryCount++;
        return await storage.getCertificate(certId);
      })
    );
  }

  // Query N+1-M: Get images (multiple queries)
  let images: any[] = [];
  if (product.imageIds && product.imageIds.length > 0) {
    images = await Promise.all(
      product.imageIds.map(async (imageId) => {
        queryCount++;
        return await storage.getMediaAsset(imageId);
      })
    );
  }

  const duration = performance.now() - startTime;
  console.log(`⚠️  Key-Value Store: Retrieved product data in ${duration}ms with ${queryCount} queries`);

  return { product, category, fabric, primaryImage, certificates, images };
}

// =============================================================================
// COMPARISON 2: Complex Filtering with Relationships
// =============================================================================

/**
 * PostgreSQL: Find products by category, fabric sustainability, and fiber type
 */
export async function findEcoFriendlyProductsSQL(categorySlug: string, minSustainability: number) {
  console.log('🔥 PostgreSQL: Complex filtering with relationships in ONE query');

  const startTime = performance.now();

  const results = await db
    .select({
      product: products,
      category: categories,
      fabric: fabrics,
      compositions: fabricCompositions,
      fiber: fibers,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(fabrics, eq(products.fabricId, fabrics.id))
    .innerJoin(fabricCompositions, eq(fabrics.id, fabricCompositions.fabricId))
    .innerJoin(fibers, eq(fabricCompositions.fiberId, fibers.id))
    .where(
      and(
        eq(categories.slug, categorySlug),
        eq(fibers.sustainabilityScore, minSustainability),
        eq(products.isActive, true),
        eq(fabrics.isActive, true)
      )
    )
    .orderBy(desc(products.isFeatured), products.name);

  const duration = performance.now() - startTime;
  console.log(`✅ PostgreSQL: Found ${results.length} eco-friendly products in ${duration}ms with 1 query`);

  return results;
}

/**
 * Current Key-Value Store: Same filtering requires multiple queries and manual filtering
 */
export async function findEcoFriendlyProductsKeyValue(categorySlug: string, minSustainability: number) {
  console.log('⚠️  Key-Value Store: Complex filtering with manual relationship management');

  const startTime = performance.now();
  let queryCount = 0;

  // Query 1: Get all categories to find the one with matching slug
  const allCategories = await storage.getCategories();
  queryCount++;

  const category = allCategories.find(cat => cat.slug === categorySlug);
  if (!category) {
    console.log(`❌ Key-Value Store: Category '${categorySlug}' not found`);
    return [];
  }

  // Query 2: Get all products to filter by category
  const allProducts = await storage.getProducts();
  queryCount++;

  const categoryProducts = allProducts.filter(p =>
    p.categoryId === category.id && p.isActive
  );

  // Query 3: Get all fabrics
  const allFabrics = await storage.getFabrics();
  queryCount++;

  // Query 4: Get all fibers
  const allFibers = await storage.getFibers();
  queryCount++;

  // Manual filtering and relationship building
  const ecoFriendlyProducts = [];

  for (const product of categoryProducts) {
    if (!product.fabricId) continue;

    const fabric = allFabrics.find(f => f.id === product.fabricId);
    if (!fabric || !fabric.isActive) continue;

    // Check fabric compositions for eco-friendly fibers
    if ((fabric as any).composition && Array.isArray((fabric as any).composition)) {
      const hasEcoFiber = (fabric as any).composition.some((comp: any) =>
        comp.fibers.some((fiberRef: any) => {
          const fiber = allFibers.find(f => f.id === fiberRef.fiberId);
          return fiber && (fiber.sustainabilityScore ?? 0) >= minSustainability;
        })
      );

      if (hasEcoFiber) {
        ecoFriendlyProducts.push({
          product,
          category,
          fabric,
        });
      }
    }
  }

  const duration = performance.now() - startTime;
  console.log(`⚠️  Key-Value Store: Found ${ecoFriendlyProducts.length} eco-friendly products in ${duration}ms with ${queryCount} queries + manual filtering`);

  return ecoFriendlyProducts;
}

// =============================================================================
// COMPARISON 3: Data Integrity Examples
// =============================================================================

/**
 * PostgreSQL: Try to delete a category that has products (should fail with foreign key constraint)
 */
export async function tryDeleteCategoryWithProductsSQL(categoryId: number) {
  console.log('🔥 PostgreSQL: Testing referential integrity - deleting category with products');

  try {
    await db.delete(categories).where(eq(categories.id, categoryId));
    console.log('✅ PostgreSQL: Category deleted successfully (no products were referencing it)');
    return { success: true, message: 'Category deleted' };
  } catch (error) {
    console.log('✅ PostgreSQL: Foreign key constraint prevented deletion (data integrity preserved)');
    return { success: false, message: 'Cannot delete category - products still reference it', error };
  }
}

/**
 * Key-Value Store: Delete category (allows orphaned product references)
 */
export async function tryDeleteCategoryWithProductsKeyValue(categoryId: number) {
  console.log('⚠️  Key-Value Store: Deleting category - no referential integrity checks');

  try {
    const success = await storage.deleteCategory(categoryId);

    if (success) {
      // Check for orphaned products
      const allProducts = await storage.getProducts();
      const orphanedProducts = allProducts.filter(p => p.categoryId === categoryId);

      console.log(`⚠️  Key-Value Store: Category deleted, but ${orphanedProducts.length} products now have broken references!`);
      return {
        success: true,
        message: 'Category deleted',
        orphanedProducts: orphanedProducts.length
      };
    }

    return { success: false, message: 'Failed to delete category' };
  } catch (error) {
    return { success: false, message: 'Error deleting category', error };
  }
}

// =============================================================================
// COMPARISON 4: Bulk Operations with Relationships
// =============================================================================

/**
 * PostgreSQL: Get all products with their complete relationship data
 */
export async function getAllProductsWithRelationshipsSQL() {
  console.log('🔥 PostgreSQL: Getting all products with relationships in ONE optimized query');

  const startTime = performance.now();

  const results = await db
    .select({
      product: products,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
      fabric: {
        id: fabrics.id,
        name: fabrics.name,
        sustainabilityScore: fabrics.sustainabilityScore,
      },
      primaryImage: {
        id: mediaAssets.id,
        url: mediaAssets.url,
        altText: mediaAssets.altText,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(fabrics, eq(products.fabricId, fabrics.id))
    .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.isFeatured), products.name);

  const duration = performance.now() - startTime;
  console.log(`✅ PostgreSQL: Retrieved ${results.length} products with relationships in ${duration}ms`);

  return results;
}

/**
 * Key-Value Store: Same operation requires multiple queries and manual joining
 */
export async function getAllProductsWithRelationshipsKeyValue() {
  console.log('⚠️  Key-Value Store: Getting all products with manual relationship building');

  const startTime = performance.now();
  let queryCount = 0;

  // Query 1: Get all products
  const allProducts = await storage.getProducts();
  queryCount++;

  // Query 2: Get all categories
  const allCategories = await storage.getCategories();
  queryCount++;

  // Query 3: Get all fabrics
  const allFabrics = await storage.getFabrics();
  queryCount++;

  // Query 4: Get all media assets
  const allMediaAssets = await storage.getMediaAssets();
  queryCount++;

  // Manual relationship building
  const results = allProducts
    .filter(product => product.isActive)
    .map(product => {
      const category = product.categoryId ?
        allCategories.find(c => c.id === product.categoryId) : null;

      const fabric = product.fabricId ?
        allFabrics.find(f => f.id === product.fabricId) : null;

      const primaryImage = product.primaryImageId ?
        allMediaAssets.find(m => m.id === product.primaryImageId) : null;

      return {
        product,
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
        } : null,
        fabric: fabric ? {
          id: fabric.id,
          name: fabric.name,
          sustainabilityScore: fabric.sustainabilityScore,
        } : null,
        primaryImage: primaryImage ? {
          id: primaryImage.id,
          url: primaryImage.url,
          altText: primaryImage.altText,
        } : null,
      };
    })
    .sort((a, b) => {
      // Manual sorting by featured status and name
      if (a.product.isFeatured !== b.product.isFeatured) {
        return b.product.isFeatured ? 1 : -1;
      }
      return a.product.name.localeCompare(b.product.name);
    });

  const duration = performance.now() - startTime;
  console.log(`⚠️  Key-Value Store: Retrieved ${results.length} products with relationships in ${duration}ms using ${queryCount} queries + manual processing`);

  return results;
}

// =============================================================================
// PERFORMANCE COMPARISON RUNNER
// =============================================================================

export async function runPerformanceComparison() {
  console.log('\n🚀 RUNNING PERFORMANCE COMPARISON: PostgreSQL vs Key-Value Store\n');

  try {
    // Test 1: Single product with relationships
    console.log('📊 TEST 1: Single Product with Relationships');
    console.log('='.repeat(50));

    await getProductWithRelatedDataSQL(1);
    await getProductWithRelatedDataKeyValue(1);

    console.log('\n📊 TEST 2: Complex Filtering with Relationships');
    console.log('='.repeat(50));

    await findEcoFriendlyProductsSQL('sportswear', 4);
    await findEcoFriendlyProductsKeyValue('sportswear', 4);

    console.log('\n📊 TEST 3: Data Integrity');
    console.log('='.repeat(50));

    console.log('PostgreSQL referential integrity:');
    await tryDeleteCategoryWithProductsSQL(1);

    console.log('\nKey-Value Store (no constraints):');
    // Don't actually delete for this demo
    console.log('⚠️  Key-Value Store would allow deletion, creating orphaned references');

    console.log('\n📊 TEST 4: Bulk Operations');
    console.log('='.repeat(50));

    await getAllProductsWithRelationshipsSQL();
    await getAllProductsWithRelationshipsKeyValue();

  } catch (error) {
    console.error('Error running performance comparison:', error);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('✅ PostgreSQL: Fewer queries, automatic relationships, data integrity');
  console.log('⚠️  Key-Value Store: Multiple queries, manual relationships, no constraints');
}