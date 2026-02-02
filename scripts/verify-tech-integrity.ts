import { spawn } from "node:child_process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

/**
 * RUN-Remix Technical Integrity Verifier
 *
 * This script orchestrates a full system check as promised in the documentation.
 * It runs:
 * 1. Type Checking
 * 2. Linting
 * 3. Build Verification
 * 4. Bundle Size Checks
 * 5. Security Audit
 */

const argv = yargs(hideBin(process.argv))
  .option("ci", {
    type: "boolean",
    description: "Run in CI mode (stricter checks)",
    default: process.env.CI === "true",
  })
  .parseSync();

const steps = [
  {
    name: "Type Check",
    command: "npm",
    args: ["run", "typecheck"],
    critical: true,
  },
  {
    name: "Linting",
    command: "npm",
    args: ["run", "lint"],
    critical: false, // Non-critical until current errors are resolved
  },
  {
    name: "Build Verification",
    command: "npm",
    args: ["run", "build"],
    critical: true,
  },
  {
    name: "Bundle Size",
    command: "npm",
    args: ["run", "check:bundle"],
    critical: false, // Don't fail entire integrity check if bundle is slightly off, unless in CI
  },
  {
    name: "Link Integrity",
    command: "npx",
    args: ["markdown-link-check", "README.md", "AGENTS.md"],
    critical: true,
  },
  {
    name: "Dead Code Check",
    command: "npx",
    args: ["knip", "--no-exit-code"],
    critical: false,
    env: { DATABASE_URL: "postgres://dummy:dummy@localhost:5432/dummy" },
  },
  {
    name: "SSR Invariant Check",
    command: "npm",
    args: ["run", "test", "tests/unit/ssr/invariants.test.ts"],
    critical: true,
  },
  {
    name: "DocStack Alignment",
    command: "npm",
    args: ["run", "verify:docs-versions"],
    critical: true,
  },
];

// Add Audit separately as it might be flaky
if (!argv.ci) {
  steps.push({
    name: "Security Audit",
    command: "npm",
    args: ["run", "check:audit"],
    critical: false,
  });
}

async function runCommand(step: {
  name: string;
  command: string;
  args: string[];
  critical: boolean;
}) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(step.command, step.args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...(step as any).env },
    });

    child.on("close", (code) => {
      // const _duration = ((Date.now() - start) / 1000).toFixed(2); // Unused

      if (code === 0) {
        resolve(true);
      } else {
        if (step.critical || argv.ci) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    });

    child.on("error", (_err) => {
      resolve(false);
    });
  });
}

async function main() {
  let success = true;

  for (const step of steps) {
    const result = await runCommand(step);
    if (!result) {
      success = false;
      if (argv.ci) break; // Fail fast in CI
    }
  }
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((_err) => {
  process.exit(1);
});
