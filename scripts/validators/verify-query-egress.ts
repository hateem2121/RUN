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

function getAllTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

export function auditQueryEgress(): ResultAsync<EgressAuditResult, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const repoDir = path.resolve(process.cwd(), "server/services/repositories");
      const files = getAllTsFiles(repoDir);

      const violations: string[] = [];
      let filesScanned = 0;

      for (const filePath of files) {
        filesScanned++;
        const relFile = path.relative(repoDir, filePath);
        const content = fs.readFileSync(filePath, "utf-8");

        // Flag unbounded queries without limits or projections in list endpoints
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            (line.includes("db.select().from(") ||
              line.includes("readDb.select().from(") ||
              line.includes("httpDb.select().from(")) &&
            !relFile.includes("settings")
          ) {
            // Check if limit or pagination is present within 10 lines
            const nearby = lines.slice(i, i + 10).join(" ");
            const hasLimitOrPagination =
              nearby.includes(".limit(") ||
              nearby.includes("limit") ||
              nearby.includes("pagination") ||
              nearby.includes(".offset(") ||
              nearby.includes("offset") ||
              nearby.includes("pageSize") ||
              nearby.includes("paginate");

            if (relFile.includes("page-content")) {
              if (!hasLimitOrPagination) {
                violations.push(`${relFile}:${i + 1} - Potential unconstrained full-table scan`);
              }
            } else {
              if (
                !hasLimitOrPagination &&
                !nearby.includes("where(") &&
                !content.includes(".limit(")
              ) {
                violations.push(`${relFile}:${i + 1} - Potential unconstrained full-table scan`);
              }
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
        console.error(
          `[QueryEgress] ❌ Query Egress Audit Failed with ${result.violationsFound} violations.`,
        );
        process.exit(1);
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
