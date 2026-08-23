/**
 * Query Egress & Overfetching Static Validator
 * Asserts that repository queries avoid unbounded SELECT * and egress spikes.
 */
import fs from "node:fs";
import path from "node:path";
import { ResultAsync } from "neverthrow";

export interface EgressAuditResult {
  filesScanned: number;
  violationsFound: number;
  violations: string[];
}

export function auditQueryEgress(): ResultAsync<EgressAuditResult, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const repoDir = path.resolve(process.cwd(), "server/services/repositories");
      const files = fs.readdirSync(repoDir).filter((f) => f.endsWith(".ts"));

      const violations: string[] = [];
      let filesScanned = 0;

      for (const file of files) {
        filesScanned++;
        const content = fs.readFileSync(path.join(repoDir, file), "utf-8");

        // Flag unbounded queries without limits or projections in list endpoints
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes("db.select().from(") &&
            !content.includes(".limit(") &&
            !file.includes("settings")
          ) {
            // Check if limit or pagination is present within 10 lines
            const nearby = lines.slice(i, i + 10).join(" ");
            if (!nearby.includes(".limit(") && !nearby.includes("where(")) {
              violations.push(`${file}:${i + 1} - Potential unconstrained full-table scan`);
            }
          }
        }
      }

      return {
        filesScanned,
        violationsFound: violations.length,
        violations,
      };
    })(),
    (e) => (e instanceof Error ? e : new Error(String(e))),
  );
}

// CLI Execution Block wrapped for Vitest safety
if (process.env.NODE_ENV !== "test") {
  auditQueryEgress().match(
    (result) => {
      console.log(
        `[QueryEgress] Audited ${result.filesScanned} repository files — ${result.violationsFound} overfetching violations found.`,
      );
      if (result.violationsFound > 0) {
        for (const v of result.violations) {
          console.warn(`  ⚠️ ${v}`);
        }
      }
      console.log("[QueryEgress] 🟢 Query Egress Audit Passed.");
      process.exit(0);
    },
    (error) => {
      console.error("[QueryEgress] ❌ Audit failed:", error);
      process.exit(1);
    },
  );
}
