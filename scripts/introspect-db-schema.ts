/**
 * Database Schema Introspection Script
 * Connects to NEON PostgreSQL and extracts table/column information
 * Outputs: db-schema.json
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  process.exit(1);
}

interface TableSchema {
  tableName: string;
  columns: string[];
}

async function introspectDatabaseSchema(): Promise<TableSchema[]> {
  const sql = neon(DATABASE_URL!);
  const results = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

  // Group columns by table
  const tablesMap = new Map<string, string[]>();

  for (const row of results) {
    const tableName = row.table_name as string;
    const columnInfo = `${row.column_name} (${row.data_type}${row.is_nullable === "NO" ? " NOT NULL" : ""})`;

    if (!tablesMap.has(tableName)) {
      tablesMap.set(tableName, []);
    }
    tablesMap.get(tableName)?.push(columnInfo);
  }

  // Convert to array format
  const schema: TableSchema[] = Array.from(tablesMap.entries()).map(([tableName, columns]) => ({
    tableName,
    columns,
  }));

  return schema;
}

async function main() {
  try {
    const schema = await introspectDatabaseSchema();

    // Output to JSON file
    const outputPath = join(process.cwd(), "db-schema.json");
    writeFileSync(outputPath, JSON.stringify(schema, null, 2), "utf-8");
    schema.forEach((_table) => {});

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

main();
