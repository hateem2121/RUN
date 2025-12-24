/**
 * DATABASE SCHEMA CONSISTENCY VALIDATOR
 *
 * Validates PostgreSQL database schema against Drizzle ORM schema definitions.
 *
 * VALIDATION SCOPE:
 * - ✅ Tables: Detects missing/extra tables
 * - ✅ Columns: Detects missing/extra columns, type mismatches, nullability issues
 * - ℹ️  Indexes: Lists existing indexes (informational only - does not compare with Drizzle schema)
 * - ℹ️  Foreign Keys: Lists existing FKs (informational only - does not compare with Drizzle schema)
 *
 * NOTE: Full index and FK validation requires extracting Drizzle's internal metadata,
 * which is complex. This validator focuses on tables and columns, with index/FK listings
 * provided for informational purposes.
 *
 * USAGE:
 * import { checkSchemaConsistency } from './lib/db-schema-validator.js';
 * const result = await checkSchemaConsistency();
 * console.log(result.summary);
 */

import { sql } from "drizzle-orm";
import * as schema from "../../shared/schema.js";
import { db } from "../db.js";
import { logger } from "./smart-logger.js";

interface SchemaValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	summary: {
		totalTables: number; // Count from Drizzle schema (expected)
		totalColumns: number; // Count from database (actual)
		totalIndexes: number; // Count from database (informational only)
		totalForeignKeys: number; // Count from database (informational only)
		missingTables: number; // Tables in Drizzle but not in database
		missingColumns: number; // Columns in Drizzle but not in database
		typeMismatches: number; // Columns with different types between Drizzle and database
		// Note: missingIndexes and missingForeignKeys not implemented (requires Drizzle metadata extraction)
	};
}

interface ColumnInfo extends Record<string, unknown> {
	column_name: string;
	data_type: string;
	is_nullable: string;
	column_default: string | null;
}

interface IndexInfo extends Record<string, unknown> {
	indexname: string;
	tablename: string;
	indexdef: string;
}

interface ForeignKeyInfo extends Record<string, unknown> {
	constraint_name: string;
	table_name: string;
	column_name: string;
	foreign_table_name: string;
	foreign_column_name: string;
}

/**
 * Check database schema consistency against Drizzle schema definitions
 *
 * @returns Promise<SchemaValidationResult> - Detailed validation report
 */
export async function checkSchemaConsistency(): Promise<SchemaValidationResult> {
	logger.info("[Schema Validator] Starting schema consistency check...");

	const errors: string[] = [];
	const warnings: string[] = [];
	const summary = {
		totalTables: 0,
		totalColumns: 0,
		totalIndexes: 0,
		totalForeignKeys: 0,
		missingTables: 0,
		missingColumns: 0,
		typeMismatches: 0,
	};

	try {
		// Get all table names from Drizzle schema
		const drizzleTableNames = Object.keys(schema)
			.filter((key) => {
				const table = (schema as any)[key];
				return (
					table &&
					typeof table === "object" &&
					table[Symbol.for("drizzle:Name")]
				);
			})
			.map((key) => (schema as any)[key][Symbol.for("drizzle:Name")] as string);

		logger.info(
			`[Schema Validator] Found ${drizzleTableNames.length} tables in Drizzle schema`,
		);
		summary.totalTables = drizzleTableNames.length;

		// Query PostgreSQL information_schema for actual database tables
		const dbTablesResult = await db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

		const dbTableNames = dbTablesResult.rows.map((row) => row.table_name);
		logger.info(
			`[Schema Validator] Found ${dbTableNames.length} tables in database`,
		);

		// Check for missing tables
		for (const tableName of drizzleTableNames) {
			if (!dbTableNames.includes(tableName)) {
				errors.push(
					`Missing table: "${tableName}" exists in Drizzle schema but not in database`,
				);
				summary.missingTables++;
			} else {
				// Validate columns for each table
				await validateTableColumns(tableName, errors, warnings, summary);

				// Validate indexes for each table
				await validateTableIndexes(tableName, errors, warnings, summary);
			}
		}

		// Check for extra tables in database
		for (const tableName of dbTableNames) {
			if (
				!drizzleTableNames.includes(tableName) &&
				!tableName.startsWith("drizzle_")
			) {
				warnings.push(
					`Extra table: "${tableName}" exists in database but not in Drizzle schema`,
				);
			}
		}

		// List foreign keys (informational only)
		await listForeignKeys(summary);

		// Log summary
		const isValid = errors.length === 0;
		logger.info("[Schema Validator] Validation complete:", {
			valid: isValid,
			errors: errors.length,
			warnings: warnings.length,
			summary,
		});

		if (errors.length > 0) {
			logger.error("[Schema Validator] Found schema errors:");
			errors.forEach((error) => logger.error(`  - ${error}`));
		}

		if (warnings.length > 0) {
			logger.warn("[Schema Validator] Found schema warnings:");
			warnings.forEach((warning) => logger.warn(`  - ${warning}`));
		}

		return {
			valid: isValid,
			errors,
			warnings,
			summary,
		};
	} catch (error) {
		logger.error(
			"[Schema Validator] Failed to check schema consistency:",
			error,
		);
		throw error;
	}
}

/**
 * Validate columns for a specific table
 */
async function validateTableColumns(
	tableName: string,
	errors: string[],
	warnings: string[],
	summary: any,
): Promise<void> {
	try {
		// Query database columns
		const columnsResult = await db.execute<ColumnInfo>(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);

		const dbColumns = columnsResult.rows;
		summary.totalColumns += dbColumns.length;

		// Get Drizzle table definition
		const drizzleTable = Object.values(schema).find(
			(table: any) => table && table[Symbol.for("drizzle:Name")] === tableName,
		) as any;

		if (!drizzleTable) return;

		// Get column definitions from Drizzle
		const drizzleColumns = Object.keys(drizzleTable).filter((key) => {
			const col = drizzleTable[key];
			return col && typeof col === "object" && col.name;
		});

		// Check for missing columns
		for (const colKey of drizzleColumns) {
			const colDef = drizzleTable[colKey];
			const colName = colDef.name;
			const dbColumn = dbColumns.find((c) => c.column_name === colName);

			if (!dbColumn) {
				errors.push(
					`Missing column: "${tableName}"."${colName}" exists in Drizzle schema but not in database`,
				);
				summary.missingColumns++;
			} else {
				// Validate data type
				const drizzleType = getDrizzleColumnType(colDef);
				const dbType = dbColumn.data_type.toLowerCase();

				if (!typesMatch(drizzleType, dbType)) {
					warnings.push(
						`Type mismatch: "${tableName}"."${colName}" - Drizzle: ${drizzleType}, Database: ${dbType}`,
					);
					summary.typeMismatches++;
				}

				// Validate nullable constraint
				const isNullable = dbColumn.is_nullable === "YES";
				const hasNotNull =
					colDef.notNull !== undefined ? colDef.notNull : false;

				if (hasNotNull && isNullable) {
					warnings.push(
						`Nullability mismatch: "${tableName}"."${colName}" - Drizzle expects NOT NULL but database allows NULL`,
					);
				}
			}
		}

		// Check for extra columns in database
		for (const dbCol of dbColumns) {
			const exists = drizzleColumns.some(
				(key) => drizzleTable[key].name === dbCol.column_name,
			);
			if (!exists) {
				warnings.push(
					`Extra column: "${tableName}"."${dbCol.column_name}" exists in database but not in Drizzle schema`,
				);
			}
		}
	} catch (error) {
		logger.error(
			`[Schema Validator] Error validating columns for table "${tableName}":`,
			error,
		);
	}
}

/**
 * Validate indexes for a specific table
 */
async function validateTableIndexes(
	tableName: string,
	_errors: string[],
	warnings: string[],
	summary: any,
): Promise<void> {
	try {
		// Query database indexes
		const indexesResult = await db.execute<IndexInfo>(sql`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = ${tableName}
      AND indexname NOT LIKE '%_pkey'
    `);

		const dbIndexes = indexesResult.rows;
		summary.totalIndexes += dbIndexes.length;

		logger.debug(
			`[Schema Validator] Found ${dbIndexes.length} indexes for table "${tableName}" (informational only)`,
		);

		// Note: Full index validation requires extracting Drizzle's internal tableConfig metadata
		// This is informational only - we list what exists but don't compare with Drizzle schema
		if (dbIndexes.length === 0) {
			warnings.push(
				`No custom indexes found for table "${tableName}" - verify if indexes are needed for query performance`,
			);
		}

		// Log index details for debugging
		dbIndexes.forEach((idx) => {
			logger.debug(`  - ${idx.indexname}: ${idx.indexdef}`);
		});
	} catch (error) {
		logger.error(
			`[Schema Validator] Error validating indexes for table "${tableName}":`,
			error,
		);
	}
}

/**
 * List foreign key constraints (informational only)
 * Note: Does not compare with Drizzle schema - requires complex metadata extraction
 */
async function listForeignKeys(summary: any): Promise<void> {
	try {
		// Query foreign key constraints
		const fkResult = await db.execute<ForeignKeyInfo>(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    `);

		const foreignKeys = fkResult.rows;
		summary.totalForeignKeys = foreignKeys.length;
		logger.info(
			`[Schema Validator] Found ${foreignKeys.length} foreign key constraints (informational only)`,
		);

		// Log foreign keys for reference
		foreignKeys.forEach((fk) => {
			logger.debug(
				`  - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`,
			);
		});
	} catch (error) {
		logger.error("[Schema Validator] Error listing foreign keys:", error);
	}
}

/**
 * Get Drizzle column type as a string
 */
function getDrizzleColumnType(colDef: any): string {
	// Extract type from Drizzle column definition
	if (colDef.getSQLType) {
		return colDef.getSQLType().toLowerCase();
	}

	// Fallback: try to infer from constructor name
	if (colDef.constructor && colDef.constructor.name) {
		const typeName = colDef.constructor.name.toLowerCase();
		if (typeName.includes("serial")) return "serial";
		if (typeName.includes("varchar")) return "varchar";
		if (typeName.includes("text")) return "text";
		if (typeName.includes("integer")) return "integer";
		if (typeName.includes("boolean")) return "boolean";
		if (typeName.includes("timestamp")) return "timestamp";
		if (typeName.includes("jsonb")) return "jsonb";
		if (typeName.includes("decimal")) return "numeric";
	}

	return "unknown";
}

/**
 * Check if Drizzle type matches PostgreSQL type
 */
function typesMatch(drizzleType: string, dbType: string): boolean {
	const typeMap: Record<string, string[]> = {
		serial: ["integer", "int4"],
		varchar: ["character varying", "varchar"],
		text: ["text"],
		integer: ["integer", "int4"],
		boolean: ["boolean", "bool"],
		timestamp: [
			"timestamp without time zone",
			"timestamp with time zone",
			"timestamptz",
		],
		jsonb: ["jsonb"],
		numeric: ["numeric", "decimal"],
	};

	const normalizedDrizzle = drizzleType.toLowerCase();
	const normalizedDb = dbType.toLowerCase();

	// Direct match
	if (normalizedDrizzle === normalizedDb) return true;

	// Check type map
	if (typeMap[normalizedDrizzle]) {
		return typeMap[normalizedDrizzle].some((t) => normalizedDb.includes(t));
	}

	// Check reverse map (db type to drizzle type)
	for (const [drizzle, dbTypes] of Object.entries(typeMap)) {
		if (
			dbTypes.some((t) => normalizedDb.includes(t)) &&
			normalizedDrizzle.includes(drizzle)
		) {
			return true;
		}
	}

	return false;
}

/**
 * Export types for external use
 */
export type { SchemaValidationResult };
