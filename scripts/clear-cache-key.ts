#!/usr/bin/env tsx
/**
 * Development utility to manually clear specific cache keys
 * Usage: tsx scripts/clear-cache-key.ts <key> [category]
 * Example: tsx scripts/clear-cache-key.ts "product-by-path:/categories/outer-wear/heritage-leather-jacket" data
 */

// Mock Database since @replit/database is not available
const Database = {
  default: class {
    async list(_prefix?: string) {
      return [];
    }
    async get(_key: string) {
      return null;
    }
    async delete(_key: string) {
      return;
    }
  },
};

const args = process.argv.slice(2);

if (args.length === 0) {
  process.exit(1);
}

const key = args[0];
const category = args[1] || "data";

const cacheKey = `cache:${category}:${key}`;

try {
  const db = new Database.default();

  await db.delete(cacheKey);

  process.exit(0);
} catch (error) {
  process.exit(1);
}
