#!/usr/bin/env tsx
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_DIR = join(process.cwd(), "shared/schema");
const OUTPUT_FILE = join(process.cwd(), "docs/api/schema-reference.md");

function parseTableFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const tableMatches = content.matchAll(
    /export const (\w+) = pgTable\(\s*["'](\w+)["'],\s*\{([\s\S]+?)\},/g,
  );

  let output = "";

  for (const match of tableMatches) {
    const [_, _variableName, tableName, columnsContentStr] = match;
    output += `### Table: ${tableName}\n\n`;
    output += `| Column | Drizzle Type | Constraints |\n`;
    output += `| :--- | :--- | :--- |\n`;

    // Ensure columnsContent is a string before splitting
    const columnsContent = columnsContentStr || "";
    const columnLines = columnsContent.split("\n");
    columnLines.forEach((line) => {
      const colMatch = line.match(/^\s*(\w+):\s*(\w+)\((.*?)\)/);
      if (colMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [__, colName, type, _details] = colMatch;
        const isNotNull = line.includes(".notNull()") ? "NOT NULL" : "";
        const isPrimary = line.includes(".primaryKey()") ? "PRIMARY KEY" : "";
        const isUnique = line.includes(".unique()") ? "UNIQUE" : "";
        const constraints = [isNotNull, isPrimary, isUnique].filter(Boolean).join(", ") || "-";

        output += `| \`${colName}\` | \`${type}\` | ${constraints} |\n`;
      }
    });
    output += "\n";
  }

  return output;
}

function main() {
  let fullDoc = "# Database Schema Reference\n\n";
  fullDoc += `> **Generated on:** ${new Date().toISOString().split("T")[0]}\n`;
  fullDoc += `> **Source:** \`shared/schema/\`\n\n`;
  fullDoc += "---\n\n";

  const files = readdirSync(SCHEMA_DIR).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts" && f !== "common.ts",
  );

  for (const file of files) {
    const tableDoc = parseTableFile(join(SCHEMA_DIR, file));
    if (tableDoc) {
      fullDoc += `## Module: ${file}\n\n${tableDoc}`;
    }
  }

  writeFileSync(OUTPUT_FILE, fullDoc);
}

main();
