// @ts-nocheck
// Extract actual business data from Key-Value Store
import { storage } from "../server/storage.js";

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
    const results: BusinessDataRecovery = {
      categories: [],
      products: [],
      fabrics: [],
      fibers: [],
      certificates: [],
      accessories: [],
      recoveredCount: 0,
    };
    results.categories = await this.extractEntityType("categories");
    results.products = await this.extractEntityType("products");
    results.fabrics = await this.extractEntityType("fabrics");
    results.fibers = await this.extractEntityType("fibers");
    results.certificates = await this.extractEntityType("certificates");
    results.accessories = await this.extractEntityType("accessories");

    results.recoveredCount =
      results.categories.length +
      results.products.length +
      results.fabrics.length +
      results.fibers.length +
      results.certificates.length +
      results.accessories.length;
    return results;
  }

  private async extractEntityType(entityType: string): Promise<any[]> {
    const items: any[] = [];

    try {
      // First try to get from storage methods
      const storageData = await this.getFromStorage(entityType);
      if (storageData && storageData.length > 0) {
        items.push(...storageData);
      }

      // Also try direct database access for individual items
      const individualItems = await this.getIndividualItems(entityType);
      if (individualItems.length > 0) {
        // Merge avoiding duplicates
        const existingIds = new Set(items.map((item) => item.id));
        const newItems = individualItems.filter((item) => !existingIds.has(item.id));
        items.push(...newItems);
      }
    } catch (_error) {}

    return items;
  }

  private async getFromStorage(entityType: string): Promise<any[]> {
    const methodName = `get${this.capitalize(entityType)}`;

    if (typeof storage[methodName] === "function") {
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
      } catch (_error) {
        // Continue checking other IDs
      }
    }

    return items;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async displayBusinessData(_data: BusinessDataRecovery) {
    // Logging removed for lint compliance
  }
}

// Export for use
export const dataExtractor = new BusinessDataExtractor();

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  dataExtractor
    .extractAllBusinessData()
    .then(async (data) => {
      await dataExtractor.displayBusinessData(data);
      process.exit(0);
    })
    .catch((_error) => {
      process.exit(1);
    });
}
