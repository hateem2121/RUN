import { accessories, products } from "@run-remix/shared";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { logger } from "../lib/monitoring/logger.js";

async function runBenchmark() {
  logger.info("Starting Query Benchmarks...\n");

  const queries = [
    {
      name: "getProductsSummary",
      buildQuery: () => {
        return db
          .select()
          .from(products)
          .where(and(eq(products.isActive, true), isNull(products.deletedAt)))
          .orderBy(desc(products.createdAt))
          .limit(100);
      },
    },
    {
      name: "getAccessories",
      buildQuery: () => {
        return db
          .select()
          .from(accessories)
          .where(and(eq(accessories.isActive, true), isNull(accessories.deletedAt)))
          .orderBy(desc(accessories.createdAt))
          .limit(100);
      },
    },
  ];

  for (const q of queries) {
    logger.info(`--- ${q.name} ---`);
    try {
      const qBuilder = q.buildQuery();
      const rawSql = sql`EXPLAIN ANALYZE ${qBuilder}`;

      const start = Date.now();
      const res = await db.execute(rawSql);
      const duration = Date.now() - start;
      logger.info(`Execution wrapper took ${duration}ms`);

      // Print EXPLAIN output
      for (const row of res.rows) {
        logger.info((row as Record<string, string>)["QUERY PLAN"] || "");
      }
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
    }
    logger.info("\n");
  }

  logger.info("Benchmarking complete.");
  process.exit(0);
}

runBenchmark();
