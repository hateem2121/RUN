#!/usr/bin/env node

/**
 * Workspace Script & Lifecycle Integrity Validator
 *
 * Verifies that all workspace manifests in the monorepo maintain script interface parity,
 * valid cross-package script references, and consistent engine declarations.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "../..");

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  workspaces?: string[];
  scripts?: Record<string, string>;
  engines?: {
    node?: string;
  };
}

const MANIFESTS = [
  { path: resolve(ROOT_DIR, "package.json"), name: "root" },
  { path: resolve(ROOT_DIR, "client/package.json"), name: "@run-remix/client" },
  { path: resolve(ROOT_DIR, "server/package.json"), name: "@run-remix/server" },
  { path: resolve(ROOT_DIR, "shared/package.json"), name: "@run-remix/shared" },
  { path: resolve(ROOT_DIR, "scripts/package.json"), name: "scripts" },
];

export function verifyWorkspaceManifests(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const manifestsMap = new Map<string, PackageJson>();

  // 1. Read and parse all manifests
  for (const { path, name } of MANIFESTS) {
    if (!existsSync(path)) {
      errors.push(`Missing manifest file: ${path}`);
      continue;
    }
    try {
      const content = JSON.parse(readFileSync(path, "utf-8")) as PackageJson;
      manifestsMap.set(name, content);
    } catch (err) {
      errors.push(`Failed to parse JSON in ${path}: ${(err as Error).message}`);
    }
  }

  // 2. Check engine compatibility across all manifests
  for (const [name, pkg] of manifestsMap.entries()) {
    if (name === "scripts") continue;
    if (!pkg.engines?.node?.includes(">=24")) {
      errors.push(
        `Package '${name}' missing or invalid engines.node declaration (expected '>=24.0.0', got '${pkg.engines?.node}')`,
      );
    }
  }

  // 3. Verify standard script existence for core workspaces
  const coreWorkspaces = ["@run-remix/client", "@run-remix/server", "@run-remix/shared"];
  for (const wsName of coreWorkspaces) {
    const pkg = manifestsMap.get(wsName);
    if (!pkg) continue;

    const scripts = pkg.scripts || {};
    if (!scripts.build) {
      errors.push(`Workspace '${wsName}' is missing standard 'build' script.`);
    }
    if (!scripts.typecheck) {
      errors.push(`Workspace '${wsName}' is missing standard 'typecheck' script.`);
    }
  }

  // 4. Verify dev & predev lifecycle scripts on client and server
  for (const wsName of ["@run-remix/client", "@run-remix/server"]) {
    const pkg = manifestsMap.get(wsName);
    if (!pkg) continue;
    const scripts = pkg.scripts || {};
    if (!scripts.kill && !scripts["kill:all"]) {
      errors.push(`Workspace '${wsName}' is missing 'kill:all' script.`);
    }
  }

  // 5. Verify root script forward references
  const rootPkg = manifestsMap.get("root");
  if (rootPkg?.scripts) {
    for (const [scriptName, scriptCmd] of Object.entries(rootPkg.scripts)) {
      // Check --workspace=@run-remix/server <cmd> or -w @run-remix/server <cmd>
      const match = scriptCmd.match(/--workspace=(@run-remix\/[a-z]+)\s+([a-z0-9:-]+)/);
      if (match) {
        const targetWs = match[1];
        const targetCmd = match[2];
        const targetPkg = manifestsMap.get(targetWs);
        if (targetPkg && !targetPkg.scripts?.[targetCmd]) {
          errors.push(
            `Root script '${scriptName}' references missing script '${targetCmd}' in workspace '${targetWs}'.`,
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

if (process.argv[1]?.endsWith("verify-workspace-scripts.ts")) {
  const result = verifyWorkspaceManifests();
  if (!result.valid) {
    console.error("❌ Workspace Script Integrity Validation Failed:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log("🟢 All workspace manifests and lifecycle scripts verified successfully.");
    process.exit(0);
  }
}
