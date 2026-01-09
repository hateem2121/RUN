/**
 * SEED HELPER UTILITIES
 * Common functions for data seeding operations
 */

// import { db } from '../../server/db.js';
import { logger } from "../../server/lib/monitoring/logger.js";

export interface SeedResult {
  tableName: string;
  recordsInserted: number;
  duration: number;
  success: boolean;
  error?: string;
}

export interface SeedProgress {
  phase: string;
  currentTable: string;
  tablesCompleted: number;
  totalTables: number;
  recordsInserted: number;
}

/**
 * Execute a seeding function with transaction support and error handling
 */
export async function seedWithTransaction<T>(
  tableName: string,
  seedFn: () => Promise<T[]>,
  options: {
    dryRun?: boolean;
    onProgress?: (progress: SeedProgress) => void;
  } = {},
): Promise<SeedResult> {
  const startTime = performance.now();

  try {
    logger.info(`[Seed] Starting ${tableName}...`);

    if (options.dryRun) {
      logger.info(`[Seed] DRY RUN MODE - No data will be inserted`);
      return {
        tableName,
        recordsInserted: 0,
        duration: performance.now() - startTime,
        success: true,
      };
    }

    // Execute seed function
    const results = await seedFn();
    const duration = performance.now() - startTime;

    logger.info(`[Seed] ✅ ${tableName}: ${results.length} records (${duration.toFixed(0)}ms)`);

    return {
      tableName,
      recordsInserted: results.length,
      duration,
      success: true,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`[Seed] ❌ ${tableName} failed:`, error);

    return {
      tableName,
      recordsInserted: 0,
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate realistic lorem ipsum text
 */
export function generateDescription(minWords: number = 10, maxWords: number = 30): string {
  const words = [
    "innovative",
    "sustainable",
    "premium",
    "advanced",
    "professional",
    "cutting-edge",
    "eco-friendly",
    "durable",
    "lightweight",
    "breathable",
    "moisture-wicking",
    "performance",
    "comfort",
    "quality",
    "technology",
    "design",
    "manufacturing",
    "production",
    "materials",
    "fabrics",
    "craftsmanship",
    "excellence",
    "standards",
    "certification",
    "environmental",
    "responsibility",
    "innovation",
    "research",
    "development",
    "facilities",
    "equipment",
    "processes",
    "capabilities",
  ];

  const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const selectedWords: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const word = words[Math.floor(Math.random() * words.length)];
    if (word) selectedWords.push(word);
  }

  return `${selectedWords.join(" ")}.`;
}

/**
 * Generate a random date within a range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate a random integer within a range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Randomly select an item from an array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)] as T;
}

/**
 * Randomly select multiple items from an array
 */
export function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generate a random boolean with optional probability
 */
export function randomBoolean(trueProbability: number = 0.5): boolean {
  return Math.random() < trueProbability;
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Progress tracker for seeding operations
 */
export class SeedProgressTracker {
  private startTime: number;
  private results: SeedResult[] = [];
  private totalTables: number;
  private phaseName: string;

  constructor(totalTables: number, phaseName: string) {
    this.totalTables = totalTables;
    this.phaseName = phaseName;
    this.startTime = performance.now();
  }

  addResult(result: SeedResult) {
    this.results.push(result);
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    return {
      completed: this.results.length,
      total: this.totalTables,
      percentage: (this.results.length / this.totalTables) * 100,
    };
  }

  getSummary() {
    const duration = performance.now() - this.startTime;
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const totalRecords = this.results.reduce((sum, r) => sum + r.recordsInserted, 0);

    return {
      phase: this.phaseName,
      duration: formatDuration(duration),
      tablesProcessed: this.results.length,
      successful,
      failed,
      totalRecords,
      results: this.results,
    };
  }

  printSummary() {
    const summary = this.getSummary();

    if (summary.failed > 0) {
      summary.results.filter((r) => !r.success).forEach((_r) => {});
    }
  }
}

/**
 * Sample data generators
 */
export const SampleData = {
  colors: [
    "Navy Blue",
    "Black",
    "White",
    "Royal Blue",
    "Red",
    "Forest Green",
    "Gray",
    "Charcoal",
    "Light Blue",
    "Purple",
    "Orange",
    "Yellow",
    "Maroon",
    "Burgundy",
    "Teal",
    "Sky Blue",
    "Olive",
    "Khaki",
  ],

  sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],

  productCategories: [
    "Athletic Wear",
    "Casual Sportswear",
    "Team Sports",
    "Outdoor & Adventure",
    "Corporate & Workwear",
    "Accessories",
  ],

  firstNames: [
    "John",
    "Sarah",
    "Michael",
    "Emily",
    "David",
    "Jessica",
    "James",
    "Jennifer",
    "Robert",
    "Lisa",
    "William",
    "Karen",
  ],

  lastNames: [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
  ],

  companyNames: [
    "Tech Innovations Inc",
    "Global Solutions Ltd",
    "Future Dynamics Corp",
    "Premier Sports Co",
    "Elite Performance Group",
    "Summit Athletics",
    "Apex Apparel",
    "Momentum Brands",
    "Catalyst Sports",
    "Pinnacle Wear",
  ],

  randomEmail(): string {
    const name = `${randomItem(this.firstNames).toLowerCase()}.${randomItem(this.lastNames).toLowerCase()}`;
    const domains = ["example.com", "test.com", "demo.com", "sample.org"];
    return `${name}@${randomItem(domains)}`;
  },

  randomPhoneNumber(): string {
    return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
  },

  randomCompanyName(): string {
    return randomItem(this.companyNames);
  },
};
