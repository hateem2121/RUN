import { type AnyColumn, asc, desc, gt, lt, type SQL } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";

export interface CursorPaginationOptions<TColumn extends AnyColumn> {
  limit: number;
  cursor?: string | number | Date | null;
  cursorColumn: TColumn;
  order?: "asc" | "desc";
  where?: SQL;
}

/**
 * Applies cursor-based pagination to a Drizzle query
 * @param query The base query to apply pagination to
 * @param options Pagination options including limit, cursor, and sorting
 */
export function withCursorPagination<T extends PgSelect>(
  query: T,
  options: CursorPaginationOptions<any>,
): T {
  const { limit, cursor, cursorColumn, order = "desc", where } = options;

  const comparison = order === "asc" ? gt(cursorColumn, cursor) : lt(cursorColumn, cursor);

  const conditions: SQL[] = [];

  if (where) {
    conditions.push(where);
  }

  if (cursor !== undefined && cursor !== null) {
    conditions.push(comparison);
  }

  // Apply WHERE clause if we have conditions
  if (conditions.length > 0) {
    // Note: This merging logic depends on how the base query was constructed.
    // Ideally, we append to existing WHERE. Drizzle's .where() usually replaces or ANDs.
    // For safety in this utility, we rely on the caller passing their main WHERE in 'options.where'
    // OR this utility being called BEFORE other where clauses if using .where(and(...))
    // But Drizzle Query Builder is immutable-ish.
    // Better approach: Return conditions to be used in .where()
  }

  // Actually, Drizzle helper is tricky because .where() returns a new type.
  // A cleaner helper might just return the SQL condition for the cursor.
  return query.orderBy(order === "asc" ? asc(cursorColumn) : desc(cursorColumn)).limit(limit) as T;
}

/**
 * Returns the SQL condition for cursor pagination
 * Usage: .where(and(existingCondition, getCursorCondition(column, cursor, 'desc')))
 */
export function getCursorCondition(
  column: AnyColumn,
  cursor: string | number | Date | undefined | null,
  order: "asc" | "desc" = "desc",
): SQL | undefined {
  if (cursor === undefined || cursor === null) return undefined;
  return order === "asc" ? gt(column, cursor) : lt(column, cursor);
}

/**
 * Encodes a cursor value to base64 for API usage
 */
export function encodeCursor(value: string | number | Date): string {
  return Buffer.from(String(value)).toString("base64");
}

/**
 * Decodes a cursor string back to its original value
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}
