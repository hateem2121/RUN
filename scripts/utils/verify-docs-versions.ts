#!/usr/bin/env tsx
/**
 * Verify Documentation Version Consistency
 *
 * This script compares versions in FULL_SYSTEM_CONTEXT.json against
 * the actual package.json files to detect documentation drift.
 *
 * Usage: npx tsx scripts/utils/verify-docs-versions.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { err, ok, Result } from "neverthrow";
import { logger } from "../../server/lib/monitoring/logger.js";

const ROOT = join(import.meta.dirname, "../..");

interface VersionCheck {
  name: string;
  documented: string;
  actual: string;
  match: boolean;
}

export function readJson(path: string): Result<Record<string, unknown>, Error> {
  const fullPath = join(ROOT, path);
  if (!existsSync(fullPath)) {
    return err(new Error(`File not found: ${path}`));
  }
  try {
    return ok(JSON.parse(readFileSync(fullPath, "utf-8")));
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

export function extractVersion(version: string): string {
  // Remove ^, ~, >= prefixes for comparison
  return version.replace(/^[\^~>=]+/, "");
}

function main(): void {
  const contextResult = readJson("docs/FULL_SYSTEM_CONTEXT.json");
  const rootPkgResult = readJson("package.json");
  const clientPkgResult = readJson("client/package.json");
  const serverPkgResult = readJson("server/package.json");

  const combinedResult = Result.combine([
    contextResult,
    rootPkgResult,
    clientPkgResult,
    serverPkgResult,
  ]);

  combinedResult.match(
    ([contextRaw, rootPkgRaw, clientPkgRaw, serverPkgRaw]) => {
      // biome-ignore lint/suspicious/noExplicitAny: bypassing strict typings for dynamic config
      const context = contextRaw as any;
      // biome-ignore lint/suspicious/noExplicitAny: bypassing strict typings for dynamic config
      const rootPkg = rootPkgRaw as any;
      // biome-ignore lint/suspicious/noExplicitAny: bypassing strict typings for dynamic config
      const clientPkg = clientPkgRaw as any;
      // biome-ignore lint/suspicious/noExplicitAny: bypassing strict typings for dynamic config
      const serverPkg = serverPkgRaw as any;

      const checks: VersionCheck[] = [];

      // Node.js version
      const nodeActual = extractVersion(rootPkg.engines?.node || "");
      const nodeDoc = context.runtime?.node || "";
      checks.push({
        name: "Node.js",
        documented: nodeDoc,
        actual: nodeActual,
        match: nodeActual.includes(nodeDoc) || nodeDoc.includes(nodeActual),
      });

      // React version
      const reactVersion = clientPkg.dependencies?.react;
      if (!reactVersion) {
        logger.error("❌ React not found in client/package.json");
        process.exit(1);
      }
      const reactActual = extractVersion(reactVersion);
      const reactDoc = (context.stack?.frontend?.framework || "").replace("React ", "");
      checks.push({
        name: "React",
        documented: reactDoc,
        actual: reactActual,
        match: reactActual === reactDoc,
      });

      // Vite version
      const viteVersion = clientPkg.devDependencies?.vite;
      if (!viteVersion) {
        logger.error("❌ Vite not found in client/package.json");
        process.exit(1);
      }
      const viteActual = extractVersion(viteVersion);
      const viteDoc = (context.stack?.frontend?.build || "").replace("Vite ", "");
      checks.push({
        name: "Vite",
        documented: viteDoc,
        actual: viteActual,
        match: viteActual === viteDoc,
      });

      // Tailwind version
      const tailwindVersion = clientPkg.dependencies?.tailwindcss;
      if (!tailwindVersion) {
        logger.error("❌ Tailwind not found in client/package.json");
        process.exit(1);
      }
      const tailwindActual = extractVersion(tailwindVersion);
      const tailwindDoc = (context.stack?.frontend?.style || "").replace("Tailwind CSS ", "");
      checks.push({
        name: "Tailwind CSS",
        documented: tailwindDoc,
        actual: tailwindActual,
        match: tailwindActual === tailwindDoc,
      });

      // Express version
      const expressVersion = serverPkg.dependencies?.express;
      if (!expressVersion) {
        logger.error("❌ Express not found in server/package.json");
        process.exit(1);
      }
      const expressActual = extractVersion(expressVersion);
      const expressDoc = (context.stack?.backend?.framework || "").replace("Express ", "");
      checks.push({
        name: "Express",
        documented: expressDoc,
        actual: expressActual,
        match: expressActual === expressDoc,
      });

      // Drizzle ORM version
      const drizzleVersion = serverPkg.dependencies?.["drizzle-orm"];
      if (!drizzleVersion) {
        logger.error("❌ Drizzle ORM not found in server/package.json");
        process.exit(1);
      }
      const drizzleActual = extractVersion(drizzleVersion);
      const drizzleDoc = context.stack?.orm?.version || "";
      checks.push({
        name: "Drizzle ORM",
        documented: drizzleDoc,
        actual: drizzleActual,
        match: drizzleActual === drizzleDoc,
      });

      let hasErrors = false;
      for (const check of checks) {
        if (!check.match) {
          logger.error(
            `❌ Version mismatch for ${check.name}: expected ${check.documented}, found ${check.actual}`,
          );
          hasErrors = true;
        } else {
          logger.info(`✅ ${check.name} version matches (${check.actual})`);
        }
      }

      if (hasErrors) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    },
    (error) => {
      logger.error("❌ Failed to read required configuration files", error);
      process.exit(1);
    },
  );
}

if (process.env.NODE_ENV !== "test") {
  main();
}
