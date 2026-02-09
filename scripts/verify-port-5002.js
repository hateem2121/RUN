#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const criticalFiles = [
  "client/vite.config.ts",
  "server/index.ts",
  "server/server.ts",
  ".env",
  ".env.example",
  "package.json",
];

const errors = [];

function checkFileForPort(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    // .env might not exist in CI or fresh clones, but we should check .env.example
    if (filePath === ".env") {
      return;
    }
    return;
  }

  const content = fs.readFileSync(fullPath, "utf-8");

  // Check for forbidden ports
  const forbiddenPorts = /port[:\s]*=?[:\s]*(3000|8080|4000|5000|5001|5003|5173)/gi;
  if (forbiddenPorts.test(content)) {
    // Exclude if it's just mentioning them in comments as "don't use" (heuristic)
    // For now, strict check
    errors.push(`❌ ${filePath} contains forbidden port (not 5002)`);
  }

  // Verify port 5002 is present (heuristic)
  if (!content.includes("5002")) {
    errors.push(`⚠️  ${filePath} does not reference port 5002 explicitly`);
  }
}

criticalFiles.forEach(checkFileForPort);

if (errors.length === 0) {
  process.exit(0);
} else {
  errors.forEach((_err) => {});
  process.exit(1);
}
