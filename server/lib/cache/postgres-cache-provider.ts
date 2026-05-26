import { cacheEntries } from "@run-remix/shared";
import { eq, lte, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { logger } from "../monitoring/logger.js";

export class PostgresCacheProvider {
  /**
   * Get value from Postgres cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const results = await db
        .select()
        .from(cacheEntries)
        .where(eq(cacheEntries.key, key))
        .limit(1);

      if (results.length === 0) return null;

      const entry = results[0];
      if (!entry) return null;

      // Check expiry
      if (entry.expiry < new Date()) {
        // Asynchronously delete expired entry
        this.del(key).catch(() => {});
        return null;
      }

      if (typeof entry.value === "string" && entry.value.startsWith("gz:")) {
        return entry.value;
      }
      return JSON.stringify(entry.value);
    } catch (err) {
      logger.error(`[PostgresCache] Get failed for ${key}:`, err);
      return null;
    }
  }

  /**
   * Set value in Postgres cache
   */
  async set(key: string, value: string, options: { ex: number }): Promise<void> {
    try {
      const expiry = new Date(Date.now() + options.ex * 1000);
      const jsonValue = value.startsWith("gz:") ? value : JSON.parse(value);

      await db
        .insert(cacheEntries)
        .values({
          key,
          value: jsonValue,
          expiry,
        })
        .onConflictDoUpdate({
          target: cacheEntries.key,
          set: {
            value: jsonValue,
            expiry,
          },
        });
    } catch (err) {
      logger.error(`[PostgresCache] Set failed for ${key}:`, err);
    }
  }

  /**
   * Delete value from Postgres cache
   */
  async del(...keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        await db.delete(cacheEntries).where(eq(cacheEntries.key, key));
      }
    } catch (err) {
      logger.error(`[PostgresCache] Delete failed:`, err);
    }
  }

  /**
   * Clear expired entries (Cleanup)
   */
  async cleanup(): Promise<void> {
    try {
      await db.delete(cacheEntries).where(lte(cacheEntries.expiry, new Date()));
      logger.info(`[PostgresCache] Cleaned up expired entries.`);
    } catch (err) {
      logger.error(`[PostgresCache] Cleanup failed:`, err);
    }
  }

  /**
   * Scan keys (Simplified for clearing patterns)
   */
  async scan(
    _cursor: string,
    options: { match: string; count: number },
  ): Promise<[string, string[]]> {
    try {
      // Convert Redis-style glob (*) to SQL LIKE (%)
      const sqlPattern = options.match.replace(/\*/g, "%");

      const results = await db
        .select({ key: cacheEntries.key })
        .from(cacheEntries)
        .where(sql`key LIKE ${sqlPattern}`)
        .limit(options.count);

      return ["0", results.map((r: { key: string }) => r.key)];
    } catch (err) {
      logger.error(`[PostgresCache] Scan failed:`, err);
      return ["0", []];
    }
  }

  /**
   * Flush all entries
   */
  async flushdb(): Promise<void> {
    try {
      await db.delete(cacheEntries);
    } catch (err) {
      logger.error(`[PostgresCache] Flushdb failed:`, err);
    }
  }
}

export const postgresCache = new PostgresCacheProvider();
