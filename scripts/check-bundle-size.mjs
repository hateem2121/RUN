#!/usr/bin/env node
/**
 * Bundle size checker — replaces bundlesize (which used the deprecated iltorb native addon).
 * Uses Node.js built-in fs.globSync + zlib.gzipSync. Zero dependencies.
 */
import { globSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const limits = [
  { pattern: "./client/build/client/assets/client-*.js", maxSize: 350 * 1024 },
  { pattern: "./client/build/client/assets/root-*.css", maxSize: 300 * 1024 },
];

let failed = false;

for (const { pattern, maxSize } of limits) {
  const files = globSync(pattern);
  if (files.length === 0) {
    console.warn(`[bundle-size] WARN: No files matched "${pattern}" — skipping (run build first)`);
    continue;
  }
  for (const file of files) {
    const raw = readFileSync(file);
    const compressed = gzipSync(raw);
    const kb = (compressed.length / 1024).toFixed(1);
    const maxKb = (maxSize / 1024).toFixed(0);
    const ok = compressed.length <= maxSize;
    const icon = ok ? "✓" : "✗";
    console.log(`${icon} ${file}: ${kb} kB gzip (limit: ${maxKb} kB)`);
    if (!ok) failed = true;
  }
}

if (failed) {
  console.error("\n[bundle-size] FAIL: One or more bundles exceed their size limits.");
  process.exit(1);
} else {
  console.log("\n[bundle-size] All bundles within size limits.");
}
