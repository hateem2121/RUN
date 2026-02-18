#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming script is in /scripts, root is one up
const rootDir = path.resolve(__dirname, "..");

const criticalFiles = [
  "client/vite.config.ts",
  "server/index.ts",
  "server/server.ts",
  ".env.example",
  "package.json",
];

const errors = [];
const warnings = [];

// Ports that should generally not be used
const FORBIDDEN_PORTS = [3000, 8080, 4000, 5000, 5001, 5003, 5173];
const REQUIRED_PORT = "5002";

function checkFile(filePath) {
  const fullPath = path.resolve(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    // .env is optional, but .env.example is required
    if (filePath === ".env") return;
    errors.push(`❌ Missing critical file: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf-8");

  // 1. Check for Forbidden Ports
  // Heuristic: specific config patterns usually look like "port: 3000" or "PORT=3000"
  // We want to skip comments, but basic regex is limited.
  // We'll flag it if we see "port: <forbidden>" or "PORT=<forbidden>"
  const forbiddenPattern = new RegExp(
    `\\b(port|PORT)\\s*[:=]\\s*(${FORBIDDEN_PORTS.join("|")})\\b`,
    "i",
  );

  if (forbiddenPattern.test(content)) {
    // Simple verification to see if the match is likely a comment
    const match = content.match(forbiddenPattern);
    const index = match.index;
    // Get the line containing the match
    const lineStart = content.lastIndexOf("\n", index) + 1;
    const lineEnd = content.indexOf("\n", index);
    const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : undefined);

    // If line starts with // or #, it's likely a comment (ignoring whitespace)
    if (!line.trim().startsWith("//") && !line.trim().startsWith("#")) {
      errors.push(`❌ ${filePath} seems to configure a forbidden port: "${match[0].trim()}"`);
    }
  }

  // 2. Verify Port 5002 Awareness
  const hasPort5002 = content.includes(REQUIRED_PORT);

  if (filePath.endsWith("vite.config.ts")) {
    // In vite config, we might not have "port: 5002" active, but we MUST have the comment
    // identifying that Express controls it.
    const expressControlComment = /controlled by Express master process/i;
    if (!hasPort5002 && !expressControlComment.test(content)) {
      errors.push(
        `❌ ${filePath} must reference port 5002 OR state that "Express master process" controls the port`,
      );
    }
  } else {
    // Default check
    if (!hasPort5002) {
      warnings.push(
        `⚠️  ${filePath} does not explicitly reference port 5002. Verify this is intentional.`,
      );
    }
  }
}

console.log("🔍 Verifying Port 5002 Compliance...");
criticalFiles.forEach(checkFile);

if (warnings.length > 0) {
  console.log("\nWarnings:");
  warnings.forEach((w) => {
    console.log(w);
  });
}

if (errors.length > 0) {
  console.error("\n❌ Compliance Check Failed:");
  errors.forEach((err) => {
    console.error(err);
  });
  console.error("\nPlease ensure all services run on Port 5002.");
  process.exit(1);
} else {
  console.log("\n✅ Port 5002 Compliance Verified.");
  process.exit(0);
}
