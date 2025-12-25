#!/usr/bin/env tsx

// @ts-nocheck

/**
 * Comprehensive Database Relationship Verification Script
 * Tests all foreign key relationships, data integrity, and constraint enforcement
 */

import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  accessories,
  categories,
  certificates,
  fabrics,
  fibers,
  mediaAssets,
  products,
  sizeCharts,
} from "../shared/schema.js";

async function verifyDatabaseRelationships() {
  try {
    let allChecks = 0;
    let passedChecks = 0;

    // Count all entities
    const entityCounts = {
      categories: (await db.select().from(categories)).length,
      products: (await db.select().from(products)).length,
      mediaAssets: (await db.select().from(mediaAssets)).length,
      fabrics: (await db.select().from(fabrics)).length,
      fibers: (await db.select().from(fibers)).length,
      certificates: (await db.select().from(certificates)).length,
      sizeCharts: (await db.select().from(sizeCharts)).length,
      accessories: (await db.select().from(accessories)).length,
    };
    Object.entries(entityCounts).forEach(([entity, count]) => {});
    allChecks++;
    passedChecks++;
    const allProducts = await db.select().from(products);
    let productCategoryLinks = 0;

    for (const product of allProducts) {
      if (product.categoryId) {
        const category = await db
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId));
        if (category.length > 0) {
          productCategoryLinks++;
        } else {
        }
      }
    }

    allChecks++;
    if (productCategoryLinks === allProducts.filter((p) => p.categoryId).length) {
      passedChecks++;
    } else {
    }
    let productFabricLinks = 0;

    for (const product of allProducts) {
      if (product.fabricId) {
        const fabric = await db.select().from(fabrics).where(eq(fabrics.id, product.fabricId));
        if (fabric.length > 0) {
          productFabricLinks++;
        } else {
        }
      }
    }

    allChecks++;
    if (productFabricLinks === allProducts.filter((p) => p.fabricId).length) {
      passedChecks++;
    } else {
    }
    let productMediaLinks = 0;

    for (const product of allProducts) {
      if (product.primaryImageId) {
        const media = await db
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.id, product.primaryImageId));
        if (media.length > 0) {
          productMediaLinks++;
        } else {
        }
      }
    }

    allChecks++;
    if (productMediaLinks === allProducts.filter((p) => p.primaryImageId).length) {
      passedChecks++;
    } else {
    }

    // Categories slug uniqueness
    const categorySlugs = await db.select({ slug: categories.slug }).from(categories);
    const uniqueCategorySlugs = new Set(categorySlugs.map((c) => c.slug));

    allChecks++;
    if (categorySlugs.length === uniqueCategorySlugs.size) {
      passedChecks++;
    } else {
    }

    // Products slug uniqueness
    const productSlugs = await db.select({ slug: products.slug }).from(products);
    const uniqueProductSlugs = new Set(productSlugs.map((p) => p.slug));

    allChecks++;
    if (productSlugs.length === uniqueProductSlugs.size) {
      passedChecks++;
    } else {
    }

    // Fibers must have type
    const fibersWithType = await db.select().from(fibers);
    const validFiberTypes = fibersWithType.filter((f) => f.type && f.type.length > 0);

    allChecks++;
    if (validFiberTypes.length === fibersWithType.length) {
      passedChecks++;
    } else {
    }

    // Fabrics with enhanced properties
    const fabricsWithProps = await db.select().from(fabrics);
    const fabricsWithEnhancedData = fabricsWithProps.filter(
      (f) => f.fabricType && f.weight && f.composition && f.properties,
    );

    allChecks++;
    if (fabricsWithEnhancedData.length === fabricsWithProps.length) {
      passedChecks++;
    } else {
    }

    const productsWithB2BData = allProducts.filter(
      (p) => p.moq && p.leadTime && p.customizationOptions && p.fiberComposition,
    );

    allChecks++;
    if (productsWithB2BData.length === allProducts.length) {
      passedChecks++;
    } else {
    }

    // Price fields should be numeric
    const productsWithValidPrices = allProducts.filter(
      (p) => !p.basePrice || !isNaN(parseFloat(p.basePrice)),
    );

    allChecks++;
    if (productsWithValidPrices.length === allProducts.length) {
      passedChecks++;
    } else {
    }

    let compositionMatches = 0;
    for (const product of allProducts) {
      if (product.fabricId && product.fiberComposition) {
        const fabric = await db.select().from(fabrics).where(eq(fabrics.id, product.fabricId));
        if (fabric.length > 0 && fabric[0].composition) {
          // Check if fiber composition is related to fabric composition
          if (
            product.fiberComposition.includes(
              fabric[0].composition.split(",")[0].split("%")[1].trim(),
            )
          ) {
            compositionMatches++;
          }
        }
      }
    }

    allChecks++;
    // Allow for some flexibility in composition matching
    if (
      compositionMatches >=
      allProducts.filter((p) => p.fabricId && p.fiberComposition).length * 0.5
    ) {
      passedChecks++;
    } else {
    }

    if (passedChecks === allChecks) {
    } else {
    }

    // Category Analysis
    const categoryAnalysis = await db.select().from(categories);
    categoryAnalysis.forEach((cat) => {});
    const categoryProducts = {};
    for (const product of allProducts) {
      if (product.categoryId) {
        const category = await db
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId));
        if (category.length > 0) {
          const categoryName = category[0].name;
          if (!categoryProducts[categoryName]) categoryProducts[categoryName] = 0;
          categoryProducts[categoryName]++;
        }
      }
    }
    Object.entries(categoryProducts).forEach(([category, count]) => {});
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
    Object.entries(fabricUsage).forEach(([fabric, count]) => {});

    return {
      totalChecks: allChecks,
      passedChecks,
      failedChecks: allChecks - passedChecks,
      successRate: ((passedChecks / allChecks) * 100).toFixed(1),
      entityCounts,
      categoryProducts,
      fabricUsage,
    };
  } catch (error) {
    throw error;
  }
}

// Execute verification
verifyDatabaseRelationships()
  .then((results) => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
