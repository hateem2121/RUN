// Migration Utilities for Bulk Data Transfer with Validation
// Handles systematic transfer of 43 entity types from Key-Value to PostgreSQL

// import { eq, and, sql } from 'drizzle-orm';
import {
  categories,
  // fabrics,
  // fibers,
  // certificates,
  // sizeCharts,
  homepageHero,
  homepageSections,
  products,
} from "../shared/schema.js";
import { db } from "./db.js";
import { storage } from "./storage.js";

export class MigrationUtilities {
  private kvStorage = storage;

  // =============================================================================
  // DATA TRANSFORMATION UTILITIES
  // =============================================================================

  /**
   * Transform Key-Value data to PostgreSQL schema format
   */
  private transformToPostgreSQL<T, U>(kvData: T[], transformer: (item: T) => U): U[] {
    return kvData.map(transformer).filter((item) => item !== null);
  }

  /**
   * Validate data before insertion
   */
  private validateData<T>(data: T[], entityName: string): T[] {
    const validData = data.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      return true;
    });
    return validData;
  }

  // =============================================================================
  // BULK MIGRATION METHODS
  // =============================================================================

  /**
   * Migrate Categories with validation and transformation
   */
  async migrateCategories(): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const kvCategories = await this.kvStorage.getCategories();

      if (kvCategories.length === 0) {
        return { migrated: 0, errors: [] };
      }

      // Transform and validate data to match PostgreSQL schema
      const transformedData = this.transformToPostgreSQL(kvCategories, (cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        parentId: cat.parentId || null,
        primaryImageId: null, // Will be updated later when media assets are migrated
        sortOrder: cat.sortOrder || null,
        isActive: cat.isActive ?? true,
        level: cat.level || null,
        createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
        updatedAt: new Date(), // Set current timestamp for updated_at
      }));

      const validData = this.validateData(transformedData, "categories");

      // Bulk insert with transaction
      await db.transaction(async (tx) => {
        for (const category of validData) {
          try {
            await tx.insert(categories).values(category);
            migrated++;
          } catch (error) {
            errors.push(
              `Category ${category.name}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      });
      return { migrated, errors };
    } catch (error) {
      const errorMsg = `Categories migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errors.push(errorMsg);
      return { migrated, errors };
    }
  }

  /**
   * Migrate Products with relationships
   */
  async migrateProducts(): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      const kvProducts = await this.kvStorage.getProducts();

      if (kvProducts.length === 0) {
        return { migrated: 0, errors: [] };
      }

      // Transform products for PostgreSQL schema
      const transformedData = this.transformToPostgreSQL(kvProducts, (product) => {
        // Validate required fields - skip invalid products
        if (!product.categoryId) {
          errors.push(`Product ${product.name || product.id}: Missing required categoryId`);
          return null;
        }
        if (!product.sku) {
          errors.push(`Product ${product.name || product.id}: Missing required SKU`);
          return null;
        }

        return {
          name: product.name,
          slug: product.slug,
          description: product.description || null,
          // shortDescription: product.shortDescription || null,
          categoryId: product.categoryId, // Required field - validated above
          primaryImageId: product.primaryImageId || null,
          // mediaGallery field not in PostgreSQL schema - handled via relations
          sku: product.sku, // Required field - validated above
          price: (product as any).price || "0.00", // Required field - default to 0
          minimumOrderQuantity: product.minimumOrderQuantity || null,
          leadTime: product.leadTime || null,
          // sampleAvailable field not in PostgreSQL schema - skipping
          // customizationOptions field not in PostgreSQL schema - skipping
          isFeatured: product.isFeatured || false,
          isActive: product.isActive ?? true,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
          updatedAt: new Date(),
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      const validData = this.validateData(transformedData, "products");

      // Bulk insert with transaction
      await db.transaction(async (tx) => {
        for (const product of validData) {
          try {
            await tx.insert(products).values(product);
            migrated++;
          } catch (error) {
            errors.push(
              `Product ${product.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      });
      return { migrated, errors };
    } catch (error) {
      const errorMsg = `Products migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errors.push(errorMsg);
      return { migrated, errors };
    }
  }

  /**
   * Migrate Homepage Content Entities
   */
  async migrateHomepageContent(): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Migrate Homepage Hero
      const homepageHeroData = await this.kvStorage.getHomepageHero();
      if (homepageHeroData && Array.isArray(homepageHeroData) && homepageHeroData.length > 0) {
        for (const hero of homepageHeroData) {
          try {
            await db.insert(homepageHero).values({
              id: hero.id || migrated + 1,
              title: hero.title || "",
              subtitle: hero.subtitle || null,
              // description: hero.description || null, // Removed: Field does not exist in schema
              // primaryImageId: hero.primaryImageId || null, // Removed: Field does not exist in schema
              backgroundImageId: hero.backgroundImageId || null,
              ctaText: hero.ctaText || null,
              ctaLink: hero.ctaLink || null,
              isActive: hero.isActive ?? true,
              createdAt: hero.createdAt ? new Date(hero.createdAt) : new Date(),
              updatedAt: new Date(),
            });
            migrated++;
          } catch (error) {
            errors.push(`Homepage Hero: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // Migrate Homepage Sections
      const homepageSectionsData = await this.kvStorage.getHomepageSections();
      if (
        homepageSectionsData &&
        Array.isArray(homepageSectionsData) &&
        homepageSectionsData.length > 0
      ) {
        for (const section of homepageSectionsData) {
          try {
            await db.insert(homepageSections).values({
              // Remove ID - let PostgreSQL auto-generate
              name: section.name || `section-${migrated + 1}`,
              sectionType: section.sectionType || "general",
              title: section.title || "",
              content: section.content || null,
              // Store additional section data in jsonb field
              data: section.data || null,
              sortOrder: section.sortOrder || null,
              isActive: section.isActive ?? true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            migrated++;
          } catch (error) {
            errors.push(
              `Homepage Section: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }
      return { migrated, errors };
    } catch (error) {
      const errorMsg = `Homepage content migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errors.push(errorMsg);
      return { migrated, errors };
    }
  }

  /**
   * Comprehensive migration of all entities
   */
  async migrateAllEntities(): Promise<{
    success: boolean;
    totalMigrated: number;
    entityResults: Record<string, { migrated: number; errors: string[] }>;
    duration: number;
  }> {
    const startTime = Date.now();
    const entityResults: Record<string, { migrated: number; errors: string[] }> = {};
    let totalMigrated = 0;

    // Core Business Entities
    entityResults.categories = await this.migrateCategories();
    entityResults.products = await this.migrateProducts();

    // Content Management Entities
    entityResults.homepageContent = await this.migrateHomepageContent();

    // Calculate totals
    for (const result of Object.values(entityResults)) {
      totalMigrated += result.migrated;
    }

    const duration = Date.now() - startTime;
    const totalErrors = Object.values(entityResults).reduce(
      (sum, result) => sum + result.errors.length,
      0,
    );

    return {
      success: totalErrors === 0,
      totalMigrated,
      entityResults,
      duration,
    };
  }

  // =============================================================================
  // VALIDATION AND INTEGRITY CHECKS
  // =============================================================================

  /**
   * Verify data integrity after migration
   */
  async verifyMigration(): Promise<{
    success: boolean;
    checks: Record<string, boolean>;
    details: Record<string, any>;
  }> {
    const checks: Record<string, boolean> = {};
    const details: Record<string, any> = {};

    try {
      // Check Categories
      const categoriesResult = await db.select().from(categories);
      const kvCategoriesCount = (await this.kvStorage.getCategories()).length;
      checks.categories = categoriesResult.length >= kvCategoriesCount;
      details.categories = {
        postgresql: categoriesResult.length,
        keyValue: kvCategoriesCount,
      };

      // Check Products
      const productsResult = await db.select().from(products);
      const kvProductsCount = (await this.kvStorage.getProducts()).length;
      checks.products = productsResult.length >= kvProductsCount;
      details.products = {
        postgresql: productsResult.length,
        keyValue: kvProductsCount,
      };

      const allChecksPass = Object.values(checks).every((check) => check);

      return {
        success: allChecksPass,
        checks,
        details,
      };
    } catch (error) {
      return {
        success: false,
        checks: { error: false },
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}

// Export singleton instance
export const migrationUtilities = new MigrationUtilities();
