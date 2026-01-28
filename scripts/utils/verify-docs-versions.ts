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

const ROOT = join(import.meta.dirname, "../..");

interface VersionCheck {
  name: string;
  documented: string;
  actual: string;
  match: boolean;
}

function readJson(path: string): Record<string, unknown> {
  const fullPath = join(ROOT, path);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(fullPath, "utf-8"));
}

function extractVersion(version: string): string {
  // Remove ^, ~, >= prefixes for comparison
  return version.replace(/^[\^~>=]+/, "");
}

function main(): void {
  console.log("🔍 Verifying documentation version consistency...\n");

  const context = readJson("FULL_SYSTEM_CONTEXT.json") as {
    runtime: { node: string };
    stack: {
      frontend: { framework: string; build: string; style: string };
      backend: { framework: string; runtime: string };
      orm: { version: string };
    };
  };

  const rootPkg = readJson("package.json") as {
    engines: { node: string };
    devDependencies: Record<string, string>;
  };
  const clientPkg = readJson("client/package.json") as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const serverPkg = readJson("server/package.json") as {
    dependencies: Record<string, string>;
  };

  const checks: VersionCheck[] = [];

  // Node.js version
  const nodeActual = extractVersion(rootPkg.engines.node);
  const nodeDoc = context.runtime.node;
  checks.push({
    name: "Node.js",
    documented: nodeDoc,
    actual: nodeActual,
    match: nodeActual.includes(nodeDoc) || nodeDoc.includes(nodeActual),
  });

  // React version
  const reactVersion = clientPkg.dependencies.react;
  if (!reactVersion) throw new Error("React not found in client/package.json");
  const reactActual = extractVersion(reactVersion);
  const reactDoc = context.stack.frontend.framework.replace("React ", "");
  checks.push({
    name: "React",
    documented: reactDoc,
    actual: reactActual,
    match: reactActual === reactDoc,
  });

  // Vite version
  const viteVersion = clientPkg.devDependencies.vite;
  if (!viteVersion) throw new Error("Vite not found in client/package.json");
  const viteActual = extractVersion(viteVersion);
  const viteDoc = context.stack.frontend.build.replace("Vite ", "");
  checks.push({
    name: "Vite",
    documented: viteDoc,
    actual: viteActual,
    match: viteActual === viteDoc,
  });

  // Tailwind version
  const tailwindVersion = clientPkg.dependencies.tailwindcss;
  if (!tailwindVersion) throw new Error("Tailwind not found in client/package.json");
  const tailwindActual = extractVersion(tailwindVersion);
  const tailwindDoc = context.stack.frontend.style.replace("Tailwind CSS ", "");
  checks.push({
    name: "Tailwind CSS",
    documented: tailwindDoc,
    actual: tailwindActual,
    match: tailwindActual === tailwindDoc,
  });

  // Express version
  const expressVersion = serverPkg.dependencies.express;
  if (!expressVersion) throw new Error("Express not found in server/package.json");
  const expressActual = extractVersion(expressVersion);
  const expressDoc = context.stack.backend.framework.replace("Express ", "");
  checks.push({
    name: "Express",
    documented: expressDoc,
    actual: expressActual,
    match: expressActual === expressDoc,
  });

  // Drizzle ORM version
  const drizzleVersion = serverPkg.dependencies["drizzle-orm"];
  if (!drizzleVersion) throw new Error("Drizzle ORM not found in server/package.json");
  const drizzleActual = extractVersion(drizzleVersion);
  const drizzleDoc = context.stack.orm.version;
  checks.push({
    name: "Drizzle ORM",
    documented: drizzleDoc,
    actual: drizzleActual,
    match: drizzleActual === drizzleDoc,
  });

  // Print results
  console.log("Version Consistency Report:");
  console.log("═".repeat(60));

  let hasErrors = false;
  for (const check of checks) {
    const status = check.match ? "✅" : "❌";
    if (!check.match) hasErrors = true;

    console.log(
      `${status} ${check.name.padEnd(15)} Doc: ${check.documented.padEnd(10)} Actual: ${check.actual}`,
    );
  }

  console.log("═".repeat(60));

  if (hasErrors) {
    console.log("\n⚠️  Version drift detected! Update FULL_SYSTEM_CONTEXT.json");
    process.exit(1);
  } else {
    console.log("\n✅ All documented versions match actual package versions.");
    process.exit(0);
  }
}

main();
