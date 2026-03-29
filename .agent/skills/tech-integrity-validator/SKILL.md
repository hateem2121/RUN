---
name: tech-integrity-validator
description: |
  Automated codebase verification. Triggers:
  - "verify integrity", "run checks", "pre-completion"
  - "typescript check", "lint check"
---

# Tech Integrity Validator

## Goal
Ensure every code modification meets the project's strict architectural and quality standards before declaring a task finished.

## Instructions

### 1. Execution Sequence
Always execute the following scripts in the monorepo root:
1. `npm run check:apply` - Formats and lints with Biome.
2. `npm run typecheck` - Validates TypeScript across all workspaces.
3. `npm run verify:tech-integrity` - Performs final system audits.

### 2. Failure Handling
If any check fails, resolve the issue and documentation (SOPs) before re-running the suite. **Never bypass a critical check.**

## Constraints
- **MANDATORY**: `npm run verify:tech-integrity` must return Exit Code 0.
