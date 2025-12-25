/**
 * DATABASE WITH TIMEOUT PROTECTION
 * Wraps Drizzle ORM methods with timeout protection using safeQuery
 */

import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "../db.js";
import { safeQuery } from "./query-wrapper.js";
import { logger } from "./smart-logger.js";

const DEFAULT_QUERY_TIMEOUT = 10000; // 10 seconds

/**
 * Database wrapper with automatic timeout protection
 * All queries will automatically timeout after 10s to prevent hanging
 */
export const dbWithTimeout = {
  /**
   * SELECT query with timeout protection
   * Returns the query builder - wrap final .from() or .execute() calls with safeQuery
   */
  select: (...args: Parameters<typeof db.select>) => {
    return db.select(...args);
  },

  /**
   * INSERT query with timeout protection
   */
  insert: <T extends PgTable>(table: T) => {
    const insertBuilder = db.insert(table);
    return {
      values: (...args: Parameters<typeof insertBuilder.values>) => {
        const valuesBuilder = insertBuilder.values(...args);
        return {
          returning: () =>
            safeQuery(
              () => valuesBuilder.returning() as ReturnType<typeof valuesBuilder.returning>,
              DEFAULT_QUERY_TIMEOUT,
            ),
          execute: () =>
            safeQuery(
              () => valuesBuilder as ReturnType<typeof insertBuilder.values>,
              DEFAULT_QUERY_TIMEOUT,
            ),
        };
      },
    };
  },

  /**
   * UPDATE query with timeout protection
   */
  update: <T extends PgTable>(table: T) => {
    const updateBuilder = db.update(table);
    return {
      set: (...args: Parameters<typeof updateBuilder.set>) => {
        const setBuilder = updateBuilder.set(...args);
        return {
          where: (...whereArgs: Parameters<typeof setBuilder.where>) => {
            const whereBuilder = setBuilder.where(...whereArgs);
            return {
              returning: () =>
                safeQuery(
                  () => whereBuilder.returning() as ReturnType<typeof whereBuilder.returning>,
                  DEFAULT_QUERY_TIMEOUT,
                ),
              execute: () =>
                safeQuery(
                  () => whereBuilder as ReturnType<typeof setBuilder.where>,
                  DEFAULT_QUERY_TIMEOUT,
                ),
            };
          },
        };
      },
    };
  },

  /**
   * DELETE query with timeout protection
   */
  delete: <T extends PgTable>(table: T) => {
    const deleteBuilder = db.delete(table);
    return {
      where: (...args: Parameters<typeof deleteBuilder.where>) => {
        const whereBuilder = deleteBuilder.where(...args);
        return {
          returning: () =>
            safeQuery(
              () => whereBuilder.returning() as ReturnType<typeof whereBuilder.returning>,
              DEFAULT_QUERY_TIMEOUT,
            ),
          execute: () =>
            safeQuery(
              () => whereBuilder as ReturnType<typeof deleteBuilder.where>,
              DEFAULT_QUERY_TIMEOUT,
            ),
        };
      },
    };
  },

  /**
   * Raw SQL execution with timeout protection
   */
  execute: <T = unknown>(query: Parameters<typeof db.execute>[0]) => {
    return safeQuery<{ rows: T[] }>(
      () => db.execute(query) as Promise<{ rows: T[] }>,
      DEFAULT_QUERY_TIMEOUT,
    );
  },
};

logger.info("[DB Timeout] Database timeout protection enabled (10s timeout)");

export default dbWithTimeout;
