# Neon Single Main Branch & Production Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Neon database into a single canonical protected `main` branch, purge all test data, enforce declarative `neon.ts` branch policy with 24h TTL CI preview rules, and populate 100% verified B2B production data grounded in the RUN APPAREL Master Prompt.

**Architecture:** We use `@neon/sdk` and the Neon CLI to rename the default `production` branch to `main`, set protection on `main`, and purge all 22+ stale preview branches. We create `neon.ts` via `@neon/config/v1` to govern branch policies declaratively. We implement a dedicated Master Production Seeding Engine (`scripts/seed-production-master.ts`) that truncates transient/test tables, establishes `hateem@wear-run.com` as Super Admin, and populates all 5 apparel categories, products, certifications, and authentic B2B CMS fixtures. Finally, we establish automated verification (`scripts/verify-production-db.ts`).

**Tech Stack:** Neon Lakebase Postgres 17, `@neon/sdk`, `@neon/config`, Drizzle ORM, TypeScript 6, Node.js 24, Vitest, Pino.

**Spec:** [`docs/superpowers/specs/2026-08-23-neon-single-main-branch-and-production-data-design.md`](file:///Users/hateemjamshaid/Sites/RUN/docs/superpowers/specs/2026-08-23-neon-single-main-branch-and-production-data-design.md)

## Global Constraints

- Never hardcode database connection strings in versioned files; always read from validated environment variables.
- All Drizzle schema definitions and Zod viewmodels must reside in `@run-remix/shared`.
- All database operations in scripts must use graceful connection closing in `finally` blocks.
- Never use placeholder company emails (`info@runapparel.com`, `admin@example.com`); use official company facts (`team@wear-run.com`, `hateem@wear-run.com`, `wear-run.com`, `13 Km Daska Road, Sialkot, 51040, Pakistan`).
- Run `npm run verify:tech-integrity` after execution to verify monorepo integrity.

---

### Task 1: Declare Neon Infrastructure as Code (`neon.ts`)

**Files:**
- Create: `neon.ts`
- Test: `tests/neon-config.test.ts`

**Interfaces:**
- Consumes: `@neon/config/v1` `defineConfig`
- Produces: Root `neon.ts` default export configuration

- [ ] **Step 1: Write the failing test for `neon.ts`**

```typescript
// tests/neon-config.test.ts
import { describe, it, expect } from "vitest";
import neonConfig from "../neon.js";

describe("Neon Infrastructure Configuration (neon.ts)", () => {
  it("should export a valid defineConfig object with auth and dataApi enabled", () => {
    expect(neonConfig).toBeDefined();
    expect(neonConfig.auth).toBe(true);
    expect(neonConfig.dataApi).toBe(true);
  });

  it("should mark default branch and main as protected", () => {
    expect(typeof neonConfig.branch).toBe("function");
    const mainBranchMock = { isDefault: true, name: "main", exists: true };
    const config = neonConfig.branch(mainBranchMock);
    expect(config.protected).toBe(true);
  });

  it("should assign 24h TTL and scale-to-zero compute to new preview branches", () => {
    const previewBranchMock = { isDefault: false, name: "preview/pr-123", exists: false };
    const config = neonConfig.branch(previewBranchMock);
    expect(config.parent).toBe("main");
    expect(config.ttl).toBe("24h");
    expect(config.postgres?.computeSettings?.autoscalingLimitMinCu).toBe(0.25);
    expect(config.postgres?.computeSettings?.suspendTimeout).toBe("5m");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/neon-config.test.ts`  
Expected: FAIL ("Cannot find module '../neon.js'")

- [ ] **Step 3: Implement `neon.ts`**

```typescript
// neon.ts
import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  dataApi: true,
  branch: (branch: {
    name: string;
    exists?: boolean;
    isDefault?: boolean;
    parentId?: string;
  }) => {
    if (branch.isDefault || branch.name === "main") {
      return { protected: true };
    }
    if (!branch.exists && (branch.name.startsWith("preview/") || branch.name.startsWith("dev-"))) {
      return {
        parent: "main",
        ttl: "24h",
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: "5m",
          },
        },
      };
    }
    return {};
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/neon-config.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add neon.ts tests/neon-config.test.ts
git commit -m "feat(db): declare neon infrastructure-as-code configuration in neon.ts"
```

---

### Task 2: Build Neon Single Branch Consolidation & Cleanup Orchestrator

**Files:**
- Create: `scripts/neon-consolidate-main.ts`

**Interfaces:**
- Consumes: `@neondatabase/api-client` or `@neon/sdk`, `process.env.NEON_API_KEY`, `process.env.NEON_PROJECT_ID`
- Produces: Clean single-branch Neon environment (only `main` remains, protected)

- [ ] **Step 1: Implement `scripts/neon-consolidate-main.ts`**

```typescript
// scripts/neon-consolidate-main.ts
import "dotenv/config";
import { createApiClient } from "@neondatabase/api-client";

const NEON_API_KEY = process.env.NEON_API_KEY;
const PROJECT_ID = process.env.NEON_PROJECT_ID || "lively-silence-31173468";

if (!NEON_API_KEY) {
  console.error("❌ NEON_API_KEY is required in environment to execute branch consolidation.");
  process.exit(1);
}

const client = createApiClient({ apiKey: NEON_API_KEY });

async function consolidateBranches() {
  console.log(`\n🚀 [Neon Branch Orchestrator] Connecting to project: ${PROJECT_ID}...`);

  const { data: projectData } = await client.getProject(PROJECT_ID);
  console.log(`📌 Project Name: ${projectData.project.name} (Region: ${projectData.project.region_id})`);

  const { data: branchData } = await client.listProjectBranches(PROJECT_ID);
  const branches = branchData.branches;
  console.log(`📋 Found ${branches.length} total branches on remote.`);

  // 1. Identify primary/production branch
  const primaryBranch = branches.find((b) => b.default || b.primary || b.name === "production" || b.name === "main");
  if (!primaryBranch) {
    throw new Error("Could not locate default/primary branch on project.");
  }

  // 2. Rename to 'main' if named 'production'
  if (primaryBranch.name !== "main") {
    console.log(`🔄 Renaming default branch '${primaryBranch.name}' (${primaryBranch.id}) to 'main'...`);
    await client.updateProjectBranch(PROJECT_ID, primaryBranch.id, {
      branch: {
        name: "main",
        protected: true,
      },
    });
    console.log(`  ✓ Successfully renamed branch to 'main' and enabled protection.`);
  } else if (!primaryBranch.protected) {
    console.log(`🛡️ Enabling protection on 'main' branch (${primaryBranch.id})...`);
    await client.updateProjectBranch(PROJECT_ID, primaryBranch.id, {
      branch: {
        protected: true,
      },
    });
    console.log(`  ✓ 'main' branch is now protected.`);
  }

  // 3. Purge all other ephemeral / preview branches
  const branchesToDelete = branches.filter((b) => b.id !== primaryBranch.id);
  console.log(`\n🧹 Purging ${branchesToDelete.length} stale preview/test branches...`);

  let deletedCount = 0;
  for (const branch of branchesToDelete) {
    try {
      console.log(`  🗑️ Deleting branch '${branch.name}' (${branch.id})...`);
      await client.deleteProjectBranch(PROJECT_ID, branch.id);
      deletedCount++;
      console.log(`    ✓ Deleted.`);
    } catch (err: unknown) {
      console.warn(`    ⚠️ Failed to delete branch '${branch.name}':`, err instanceof Error ? err.message : String(err));
    }
  }

  // 4. Verify Final State
  const { data: finalBranchData } = await client.listProjectBranches(PROJECT_ID);
  console.log(`\n🎉 [Neon Branch Orchestrator] Consolidation complete!`);
  console.log(`📊 Active Branches Remaining: ${finalBranchData.branches.length}`);
  for (const b of finalBranchData.branches) {
    console.log(`  - ${b.name} (${b.id}) [Default: ${b.default}, Protected: ${b.protected}]`);
  }
}

consolidateBranches().catch((err) => {
  console.error("❌ Consolidation failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script to `package.json`**

Add `"neon:consolidate": "tsx scripts/neon-consolidate-main.ts"` to `package.json`.

- [ ] **Step 3: Run dry-run verification or execute consolidation**

Run: `npm run neon:consolidate`  
Expected: Renames `production` to `main`, protects `main`, and purges all ~22 stale branches.

- [ ] **Step 4: Commit changes**

```bash
git add scripts/neon-consolidate-main.ts package.json
git commit -m "feat(neon): add single main branch consolidation orchestrator"
```

---

### Task 3: Build Master Production B2B Seeding Engine

**Files:**
- Create: `scripts/seed-production-master.ts`
- Modify: `scripts/seed.ts` (redirect or unify with production master engine)

**Interfaces:**
- Consumes: `@run-remix/shared` tables, `server/db.ts`
- Produces: 100% production data grounded in `RUN APPAREL Master Prompt.md`, Super Admin `hateem@wear-run.com`, 5 core categories, verified B2B products, and official certifications.

- [ ] **Step 1: Implement `scripts/seed-production-master.ts`**

Include:
- Truncation of transient/mock tables: `inquiries`, `messages`, `newsletter_subscribers`, `contacts`, `campaign_contacts`, `campaigns`, `sequence_enrollments`, `sequence_steps`, `sequences`, `webhook_deliveries`, `webhook_subscriptions`, `whatsapp_sends`, `instagram_sends`, `linkedin_sends`, `audit_logs`, `sync_logs`, `storage_analysis_results`, `storage_change_logs`, `animation_errors`, `duplicate_skips`, `playing_with_neon`, `sessions`.
- Super Admin account provisioning (`hateem@wear-run.com`, M. Hateem Jamshaid Iqbal).
- 5 Core Categories (`Team Wear`, `Active Wear`, `Casual Wear`, `Outer Wear`, `Sports Accessories`).
- Real B2B products across all 5 categories with technical specs, lead times, MOQs, and fiber compositions.
- Verified certifications (SMETA ref. ZAA600143761, Sedex ZC5000065244, OEKO-TEX, GOTS, GRS, ISO 9001, BSCI, TDAP, SECP).
- Authentic CMS content (193,000+ sqm facility, 200+ machines, 80% solar power, 100,000+ units/mo, 1889 heritage timeline, 5-stage manufacturing process, AeroWeave™, Santoni machines).
- Authoritative contact details (`team@wear-run.com`, WhatsApp `+92-336-1777313`, `wear-run.com`, Sialkot HQ).

- [ ] **Step 2: Execute seeding on local / live main connection**

Run: `npx tsx scripts/seed-production-master.ts`  
Expected: Clean truncation of test tables, successful atomic seeding of all B2B fixtures.

- [ ] **Step 3: Commit changes**

```bash
git add scripts/seed-production-master.ts scripts/seed.ts
git commit -m "feat(seed): implement 100% master production B2B seeding engine"
```

---

### Task 4: Automated Verification & CI Guard (`scripts/verify-production-db.ts`)

**Files:**
- Create: `scripts/verify-production-db.ts`
- Modify: `package.json` (integrate into `npm run verify:tech-integrity`)

**Interfaces:**
- Consumes: `@run-remix/shared`, `server/db.ts`, `@neondatabase/api-client`
- Produces: Strict exit code 0 when database satisfies all single-branch and production data invariants.

- [ ] **Step 1: Implement `scripts/verify-production-db.ts`**

Asserts:
1. Neon project has exactly 1 active branch (`main`) which is `protected: true`.
2. All 5 core categories exist (`team-wear`, `active-wear`, `casual-wear`, `outer-wear`, `sports-accessories`).
3. Zero placeholder emails (`info@runapparel.com`, `admin@example.com`) in database.
4. Zero test inquiries or dummy messages.
5. Super admin `hateem@wear-run.com` exists.
6. All 12 verified certifications and 1889 heritage timeline entries exist.

- [ ] **Step 2: Run verification script**

Run: `npx tsx scripts/verify-production-db.ts`  
Expected: PASS (All checks succeed).

- [ ] **Step 3: Commit changes**

```bash
git add scripts/verify-production-db.ts package.json
git commit -m "feat(verify): add automated production database and single-branch verifier"
```

---

### Task 5: Hardening CI/CD Workflow Lifecycles

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/e2e.yml`

**Interfaces:**
- Consumes: GitHub Actions runner environment
- Produces: Error-free branch creation with strict 24h TTL and robust PR close cleanup.

- [ ] **Step 1: Fix date expiration in `.github/workflows/ci.yml`**

Replace macOS BSD date `date -u -v+24h +'%Y-%m-%dT%H:%M:%SZ'` with cross-platform compatible syntax:
`date -u -d '+24 hours' +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -v+24h +'%Y-%m-%dT%H:%M:%SZ'`

- [ ] **Step 2: Ensure branch deletion on PR close is resilient**

Ensure `delete_neon_branch` job handles all PR close events reliably.

- [ ] **Step 3: Verify CI workflow syntax and monorepo integrity**

Run: `npm run check` and `npm run verify:tech-integrity`  
Expected: 0 errors, 8/8 checks passed.

- [ ] **Step 4: Commit changes**

```bash
git add .github/workflows/ci.yml .github/workflows/e2e.yml
git commit -m "fix(ci): standardize cross-platform branch expiration dates and cleanup"
```
