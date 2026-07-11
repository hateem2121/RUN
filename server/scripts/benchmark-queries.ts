import { accessories, products } from "@run-remix/shared";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";

async function runBenchmark() {
  console.log("Starting Query Benchmarks...\n");

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
    console.log(`--- ${q.name} ---`);
    try {
      const qBuilder = q.buildQuery();
      const rawSql = sql`EXPLAIN ANALYZE ${qBuilder}`;

      const start = Date.now();
      const res = await db.execute(rawSql);
      const duration = Date.now() - start;
      console.log(`Execution wrapper took ${duration}ms`);

      // Print EXPLAIN output
      for (const row of res.rows) {
        console.log((row as Record<string, unknown>)["QUERY PLAN"]);
      }
    } catch (e) {
      console.error(`Failed: ${(e as Error).message}`);
    }
    console.log("\n");
  }

  console.log("Benchmarking complete.");
  process.exit(0);
}

runBenchmark();
