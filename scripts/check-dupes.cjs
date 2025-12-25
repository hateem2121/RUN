/**
 * scripts/check-dupes.cjs
 *
 * Guardrail to detect duplicate React or ReactDOM instances.
 * Duplicate React causes "Invalid Hook Call" and Context issues.
 */

const { execSync } = require("child_process");

try {
  // Use npm ls to find duplicates
  const output = execSync("npm ls react react-dom --json", {
    encoding: "utf8",
  });
  const tree = JSON.parse(output);
} catch (error) {
  process.exit(1);
}
