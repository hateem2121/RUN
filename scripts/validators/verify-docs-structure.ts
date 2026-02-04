#!/usr/bin/env tsx
/**
 * Verify Documentation Structure Integrity
 * 
 * Checks for deprecated path references (e.g., client/src) in documentation.
 * Scans docs/ and Markdown files in client/app/.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '../../');
const DOCS_DIR = join(ROOT, 'docs');
const CLIENT_APP_DIR = join(ROOT, 'client/app');

const INVALID_PATTERNS = [
  { pattern: /client\/src/, message: 'Use client/app instead of client/src' },
];

function getAllFiles(dir: string, extension: string): string[] {
  let results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath, extension));
      } else {
        if (file.endsWith(extension)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    // Directory might not exist or be accessible
  }
  return results;
}

function checkFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let hasError = false;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    for (const { pattern, message } of INVALID_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`❌ ${relative(ROOT, filePath)}:${index + 1}: ${message}`);
        console.error(`   ${line.trim()}`);
        hasError = true;
      }
    }
  });
  return hasError;
}

function main() {
  console.log('🔍 Verifying documentation structure references...\n');
  
  const docs = getAllFiles(DOCS_DIR, '.md').filter(path => !path.includes('docs/archive'));
  const clientDocs = getAllFiles(CLIENT_APP_DIR, '.md');
  const allFiles = [...docs, ...clientDocs];
  
  console.log(`Checking ${allFiles.length} files...`);

  let failed = false;
  for (const doc of allFiles) {
    if (checkFile(doc)) {
      failed = true;
    }
  }
  
  if (failed) {
    console.error('\n⚠️  Documentation structure issues found.');
    process.exit(1);
  } else {
    console.log('\n✅ All documentation path references valid.');
    process.exit(0);
  }
}

main();
