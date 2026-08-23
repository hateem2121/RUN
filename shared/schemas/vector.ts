import { customType } from "drizzle-orm/pg-core";

/**
 * Custom Drizzle ORM column type mapping for PostgreSQL pgvector extension
 */
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions?: number };
}>({
  dataType(config) {
    const dimensions = config?.dimensions ?? 384;
    return `vector(${dimensions})`;
  },
  toDriver(value: number[]): string {
    if (!Array.isArray(value)) return "[]";
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((n) => Number.parseFloat(n.trim()))
      .filter((n) => !Number.isNaN(n));
  },
});
