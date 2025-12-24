// Direct Migration Execution Routes
// Executes the actual data transfer from Key-Value to PostgreSQL

import type { Express } from "express";
import {
	categories,
	homepageHero,
	homepageSections,
	products,
} from "../../../shared/schema.js";
import { db } from "../../db.js";
import { logger } from "../../lib/smart-logger.js";
import { migrationUtilities } from "../../migration-utilities.js";

export function registerMigrationExecutionRoutes(app: Express): void {
	// Execute live data migration
	app.post("/api/migrate/execute-now", async (_req, res) => {
		logger.debug("[Migration Execute] 🚀 Starting LIVE data migration...");

		try {
			const startTime = Date.now();

			// Execute the complete migration
			const result = await migrationUtilities.migrateAllEntities();

			const duration = Date.now() - startTime;

			res.json({
				success: result.success,
				message: `Migration completed in ${duration}ms`,
				data: {
					totalMigrated: result.totalMigrated,
					duration: `${duration}ms`,
					entityResults: result.entityResults,
					summary: {
						successful: result.success,
						entitiesMigrated: Object.keys(result.entityResults).length,
						totalRecords: result.totalMigrated,
					},
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			logger.error("[Migration Execute] ❌ Migration execution failed:", error);
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			});
		}
	});

	// Check migration status after execution
	app.get("/api/migrate/verify-completion", async (_req, res) => {
		try {
			logger.debug("[Migration Verify] 🔍 Verifying migration completion...");

			// Check PostgreSQL counts
			const categoriesResult = await db.select().from(categories);
			const productsResult = await db.select().from(products);
			const homepageHeroResult = await db.select().from(homepageHero);
			const homepageSectionsResult = await db.select().from(homepageSections);

			const postgresqlCounts = {
				categories: categoriesResult.length,
				products: productsResult.length,
				homepageHero: homepageHeroResult.length,
				homepageSections: homepageSectionsResult.length,
			};

			const totalMigrated = Object.values(postgresqlCounts).reduce(
				(sum, count) => sum + count,
				0,
			);

			res.json({
				success: totalMigrated > 0,
				message: `Found ${totalMigrated} total entities in PostgreSQL`,
				data: {
					postgresqlCounts,
					totalMigrated,
					migrationStatus: totalMigrated > 0 ? "Completed" : "No Data Found",
					verification: {
						categoriesPresent: postgresqlCounts.categories > 0,
						productsPresent: postgresqlCounts.products > 0,
						homepageContentPresent:
							postgresqlCounts.homepageHero +
								postgresqlCounts.homepageSections >
							0,
					},
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			logger.error("[Migration Verify] ❌ Verification failed:", error);
			res.status(500).json({
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	});

	logger.debug("[Migration Execute] ✅ Migration execution routes registered");
}
