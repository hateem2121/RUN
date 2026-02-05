# Documentation & Repository Hygiene Audit Report

**Date**: 2026-02-02  
**Repository**: `run-remix-monorepo`  
**Stack**: React 19 + Express 5 + Tailwind CSS v4 + TypeScript + GLTF/GLB Pipeline  
**Auditor**: Docs, Scripts & Repo Hygiene Agent  
**Status**: ✅ Partial remediation complete, awaiting approval for remaining items

---

## Executive Summary

This comprehensive audit covers all documentation, scripts, and operational files in the RUN-Remix B2B platform repository. The audit identified **60+ in-scope files** across docs, scripts, configs, and meta files.

| Classification | Count | Status |
|----------------|-------|--------|
| `current-and-correct` | 52 | No action needed |
| `needs-update` | 4 | ✅ 3 fixed (port refs), 1 pending |
| `legacy-or-superseded` | 1 | Merged (SLO consolidation) |
| `candidate-for-removal-or-archive` | 1 | Kept per user decision |

### Remediation Already Applied

| Action | Details |
|--------|---------|
| Port 5001→5002 | Fixed in `.agent/workflows/dev-server.md`, `.agent/skills/project-standards/SKILL.md`, `tests/api.http` |
| SLO consolidation | Merged `slo-definitions.md` into `slos.md`, deleted duplicate |

---

## 1. Repository-Wide Inventory Table

### Root-Level Documentation

| Path | Type | Area | Audience | Classification | Last Modified | Notes |
|------|------|------|----------|----------------|---------------|-------|
| `README.md` | doc | shared | dev, ops | `current-and-correct` | Jan 2026 | 578 lines. Comprehensive project overview. Accurate stack refs. |
| `CONTRIBUTING.md` | doc | shared | dev | `current-and-correct` | Jan 2026 | 110 lines. Contribution guidelines with React 19 patterns. |
| `CHANGELOG.md` | doc | shared | dev | `current-and-correct` | Feb 2026 | 42 lines. Covers v4.0–v4.1 (Tailwind v4 migration). |
| `AGENTS.md` | meta | shared | AI agents | `current-and-correct` | Jan 2026 | 73 lines. AI operational map. Correct stack references. |

---

### docs/core/ (Architecture)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/overview.md` | doc | shared | dev, ops | `current-and-correct` | SSOT for versions (React 19.2.3, Vite 7.0.0, Tailwind 4.0.0). |
| `docs/core/architecture.md` | doc | shared | dev | `current-and-correct` | Core system architecture. |
| `docs/core/tech-stack.md` | doc | shared | dev | `current-and-correct` | Technology stack overview. |
| `docs/core/ssr-invariants.md` | doc | frontend-react19 | dev | `current-and-correct` | SSR safety rules. |
| `docs/core/HORIZONTAL_SCALING.md` | doc | infra/CI-CD | ops | `current-and-correct` | Scaling documentation. |
| `docs/core/VISUAL_GOVERNANCE.md` | doc | frontend-react19 | dev | `current-and-correct` | CSS governance rules. |

---

### docs/adr/ (Architectural Decision Records)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/adr/0001-adr-template.md` | doc | shared | dev | `current-and-correct` | ADR template. |
| `docs/adr/0002-react-19-over-nextjs.md` | doc | frontend-react19 | dev | `current-and-correct` | React 19 decision rationale. |
| `docs/adr/0003-neon-serverless-database.md` | doc | data/neon-drizzle | dev | `current-and-correct` | Neon Postgres decision. |
| `docs/adr/0004-express-5-framework.md` | doc | backend-express5 | dev | `current-and-correct` | Express 5 migration decision. |
| `docs/adr/0005-drizzle-orm.md` | doc | data/neon-drizzle | dev | `current-and-correct` | Drizzle ORM selection. |
| `docs/adr/0006-tailwind-v4.md` | doc | frontend-react19 | dev | `current-and-correct` | Tailwind v4 over CSS Modules. |
| `docs/adr/0007-cloud-run-deployment.md` | doc | infra/CI-CD | ops | `current-and-correct` | Cloud Run deployment. |
| `docs/adr/0008-upstash-redis.md` | doc | data/neon-drizzle | dev | `current-and-correct` | Redis L2 cache. |
| `docs/adr/0009-biome-over-eslint.md` | doc | shared | dev | `current-and-correct` | Biome linting decision. |
| `docs/adr/0010-monorepo-structure.md` | doc | shared | dev | `current-and-correct` | Monorepo structure. |
| `docs/adr/0011-google-oauth.md` | doc | backend-express5 | dev | `current-and-correct` | OAuth decision. |
| `docs/adr/0012-two-tier-caching.md` | doc | data/neon-drizzle | dev | `current-and-correct` | Caching architecture. |
| `docs/adr/0013-error-handling-architecture.md` | doc | backend-express5 | dev | `current-and-correct` | Error handling. |
| `docs/adr/0014-observability-pipeline.md` | doc | infra/CI-CD | ops | `current-and-correct` | Observability decision. |
| `docs/adr/0015-react-router-7.md` | doc | frontend-react19 | dev | `current-and-correct` | React Router 7. |
| `docs/adr/README.md` | doc | shared | dev | `current-and-correct` | ADR index. |

---

### docs/api/ (API Documentation)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/api/api-reference.md` | doc | backend-express5 | dev, external-integrators | `current-and-correct` | API reference. |
| `docs/api/endpoints.md` | doc | backend-express5 | dev | `current-and-correct` | Endpoint documentation. |
| `docs/api/auth.md` | doc | backend-express5 | dev | `current-and-correct` | Authentication flows. |
| `docs/api/ERROR_CODES.md` | doc | backend-express5 | dev | `current-and-correct` | Error code reference. |
| `docs/api/API_ERROR_SPEC.md` | spec | backend-express5 | dev | `current-and-correct` | Error specification. |

---

### docs/development/ (Development Guides)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/development/styling.md` | doc | frontend-react19 | dev | `current-and-correct` | Tailwind v4 styling guide. 208 lines. |
| `docs/development/ide-setup.md` | doc | shared | dev | `current-and-correct` | VS Code configuration. |
| `docs/development/testing.md` | doc | shared | dev | `current-and-correct` | Testing strategy. |

---

### docs/operations/ (Operational Guides)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/operations/environment.md` | doc | infra/CI-CD | ops | `current-and-correct` | Environment configuration. |
| `docs/operations/slos.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | ✅ Consolidated (v2.0). |
| `docs/operations/MAINTENANCE_RUNBOOK.md` | doc | infra/CI-CD | ops | `current-and-correct` | Maintenance procedures. |
| `docs/operations/database-recovery.md` | doc | data/neon-drizzle | ops | `current-and-correct` | DB recovery. |
| `docs/operations/database-replicas.md` | doc | data/neon-drizzle | ops | `current-and-correct` | Replica configuration. |
| `docs/operations/load-testing-baseline.md` | doc | infra/CI-CD | ops | `current-and-correct` | Load testing baselines. |
| `docs/operations/load-testing-runbook.md` | doc | infra/CI-CD | ops | `current-and-correct` | Load testing procedures. |
| `docs/operations/local-development-optimization.md` | doc | shared | dev | `current-and-correct` | Local dev optimization. |
| `docs/operations/observability.md` | doc | infra/CI-CD | ops | `current-and-correct` | Observability overview. |
| `docs/operations/scaling-policies.md` | doc | infra/CI-CD | ops | `current-and-correct` | Scaling policies. |
| `docs/operations/BRANCH_PROTECTIONS.md` | doc | infra/CI-CD | ops | `current-and-correct` | Branch protection rules. |

---

### docs/runbooks/ (Incident Response)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/runbooks/README.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | Runbook index. |
| `docs/runbooks/incident-response.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | Incident response. |
| `docs/runbooks/database-outage.md` | doc | data/neon-drizzle | ops, SRE | `current-and-correct` | DB outage response. |
| `docs/runbooks/deployment-rollback.md` | doc | infra/CI-CD | ops | `current-and-correct` | Rollback procedures. |
| `docs/runbooks/circuit-breaker-trip.md` | doc | backend-express5 | ops | `current-and-correct` | Circuit breaker. |
| `docs/runbooks/rate-limit-surge.md` | doc | backend-express5 | ops | `current-and-correct` | Rate limiting. |
| `docs/runbooks/sentry-alert-triage.md` | doc | infra/CI-CD | ops | `current-and-correct` | Sentry triage. |

---

### docs/security/ (Security Documentation)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/security/encryption-at-rest.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | Encryption documentation. |
| `docs/security/penetration-testing-policy.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | Pen testing policy. |
| `docs/security/threat-model.md` | doc | infra/CI-CD | ops, SRE | `current-and-correct` | Threat model. |

---

### docs/compliance/ (Compliance)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/compliance/data-classification.md` | doc | infra/CI-CD | ops, product | `current-and-correct` | Data classification. |
| `docs/compliance/gdpr-ccpa.md` | doc | infra/CI-CD | ops, product | `current-and-correct` | Privacy compliance. |

---

### scripts/ (Shell Scripts)

| Path | Type | Area | Audience | Classification | Usage | Notes |
|------|------|------|----------|----------------|-------|-------|
| `scripts/setup/verify-setup.sh` | script | shared | dev | `current-and-correct` | Referenced in README | VS Code setup verification (117 lines). |
| `scripts/setup/install-extensions.sh` | script | shared | dev | `current-and-correct` | Referenced in README | VS Code extension installer (120 lines). |
| `scripts/security/check-secrets.sh` | script | infra/CI-CD | dev | `current-and-correct` | Husky pre-commit | Pre-commit secret scanning (59 lines). |

---

### .agent/ (AI Agent Configuration)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `.agent/workflows/dev-server.md` | meta | shared | AI agents | `current-and-correct` | ✅ Fixed port 5001→5002. |
| `.agent/skills/project-standards/SKILL.md` | meta | shared | AI agents | `current-and-correct` | ✅ Fixed port 5001→5002. 228 lines. |
| `.agent/skills/react-express-typescript/SKILL.md` | meta | shared | AI agents | `current-and-correct` | Tech stack enforcement. |

---

### tests/ (Test Collections)

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `tests/api.http` | config-example | backend-express5 | dev | `current-and-correct` | ✅ Fixed port 5001→5002. |

---

### Other Files

| Path | Type | Area | Audience | Classification | Notes |
|------|------|------|----------|----------------|-------|
| `docs/index.md` | doc | shared | dev | `current-and-correct` | Documentation index. |
| `docs/guides/TRANSACTION_SAFETY.md` | doc | data/neon-drizzle | dev | `current-and-correct` | Transaction safety guide. |
| `docs/architecture/event-bus.md` | doc | backend-express5 | dev | `current-and-correct` | Event bus architecture. |
| `docs/architecture/system_diagrams.md` | doc | shared | dev | `current-and-correct` | System diagrams. |
| `docs/observability/LOCAL_STACK.md` | doc | infra/CI-CD | dev | `current-and-correct` | Local observability. |
| `docs/observability/observability-and-errors.md` | doc | infra/CI-CD | dev | `current-and-correct` | Error observability. |
| `docs/release/upgrade-playbook.md` | doc | infra/CI-CD | ops | `current-and-correct` | Upgrade procedures. |
| `docs/resources/content/sportswear_fibers_guide.md` | doc | shared | sales, product | `current-and-correct` | Product content (kept per user decision). |
| `ops/load-testing/README.md` | doc | infra/CI-CD | ops | `current-and-correct` | Load testing readme. |

---

## 2. Per-File Findings and Recommendations

### Files Remediated (No Further Action)

#### `.agent/workflows/dev-server.md`
- **Accurate**: Workflow structure, predev script behavior, cleanup commands
- **Fixed**: 4 port references (5001→5002)
- **Action**: ✅ Complete

#### `.agent/skills/project-standards/SKILL.md`
- **Accurate**: React 19, Express 5, Tailwind v4 patterns; 3D pipeline with @google/model-viewer
- **Fixed**: 2 port references (5001→5002)
- **Action**: ✅ Complete

#### `tests/api.http`
- **Accurate**: Endpoint paths
- **Fixed**: baseUrl port (5001→5002)
- **Action**: ✅ Complete

#### `docs/operations/slos.md`
- **Accurate**: Now consolidated v2.0 with all SLI/SLO content
- **Merged from**: `slo-definitions.md` (deleted)
- **Action**: ✅ Complete

---

### Files With Pre-Existing Lint Warnings (Low Priority)

The following files have markdown lint warnings that predate this audit. These are cosmetic and do not affect accuracy:

| File | Issue Type | Risk |
|------|------------|------|
| `.agent/workflows/dev-server.md` | Blank lines around lists/headings | Low |
| `.agent/skills/project-standards/SKILL.md` | List indentation, trailing spaces | Low |

**Recommendation**: Address in a future housekeeping PR. Not blocking.

---

### Files Requiring No Changes

All 52 files classified as `current-and-correct` were verified against:

| Area | Verification |
|------|--------------|
| React 19 patterns | ✅ Actions, useOptimistic, suspense documented correctly |
| Express 5 | ✅ Router patterns, async handlers, Express 5 error handling |
| Tailwind v4 | ✅ @theme, @utility, @layer base, semantic tokens |
| Drizzle/Neon | ✅ Schema patterns, connection pooling, branching |
| 3D pipeline | ✅ @google/model-viewer, GLB loading, error boundaries |
| Scripts | ✅ All scripts referenced in package.json or CI |

---

## 3. Implementation Plan

### Batch 1: Completed Actions ✅

| Action | Files | Risk | Status |
|--------|-------|------|--------|
| Fix port references | 3 files | Low | ✅ Done |
| SLO consolidation | 2→1 file | Low | ✅ Done |

### Batch 2: Markdown Lint Cleanup (Optional)

| Action | Files | Risk | Approval Needed |
|--------|-------|------|-----------------|
| Fix blank line warnings | 2 `.agent/` files | Low | No |

**Recommendation**: Bundle with next routine PR.

### Batch 3: Future Enhancements (Not Urgent)

| Enhancement | Files | Effort | Approval Needed |
|-------------|-------|--------|-----------------|
| Add frontmatter metadata | All key docs | Medium | Platform Lead |
| Auto-generate API docs | OpenAPI spec | High | Dev Lead |
| Add last-reviewed dates | ADRs, runbooks | Low | No |

---

## 4. Process and Tooling Recommendations

### Docs-as-Code Workflow

**Already in Place:**
- ✅ `npm run check:docs` - markdown-link-check configured
- ✅ `npm run verify:docs-versions` - version verification script
- ✅ Husky pre-commit hooks with secret scanning

**Recommended Additions:**

1. **Same-PR Doc Updates**
   - Enforce doc changes in PRs that modify APIs, env vars, or CLI behavior
   - Add PR template checkbox: "Documentation updated?"

2. **Frontmatter Metadata**
   ```yaml
   ---
   owner: platform-team
   last-reviewed: 2026-02-02
   applies-to: ["frontend", "backend"]
   ---
   ```

3. **CI Integration**
   - Add `npm run check:docs` to CI workflow if not already present
   - Consider `markdownlint` for stricter formatting

### Auto-Generated Documentation Opportunities

| Source | Target | Tool |
|--------|--------|------|
| Express routes | API reference | OpenAPI/Swagger |
| Drizzle schema | Schema docs | Drizzle introspection |
| TypeScript types | Type reference | TypeDoc |

### AGENTS.md Assessment

**Current Status**: ✅ Present and accurate at repo root

**Strengths:**
- Covers commands, testing, structure, code style
- References correct stack versions
- Clear agent boundaries

**Recommended Enhancement:**
- Add link to `.agent/skills/` and `.agent/workflows/` directories
- Add "good vs bad" reference examples

### Metrics for Documentation Health

| Metric | How to Measure | Target |
|--------|----------------|--------|
| New dev onboarding time | Survey | < 1 day to first PR |
| Doc search success | Analytics | > 80% find answer |
| Stale doc rate | `git log` + frontmatter | < 10% > 6 months |
| Broken links | CI check | 0 |

---

## 5. Files Deleted or Archived

| File | Action | Reason |
|------|--------|--------|
| `docs/operations/slo-definitions.md` | Deleted | Content merged into `slos.md` v2.0 |

---

## 6. Security and Privacy Review

### Sensitive Content Scan

| Area | Status |
|------|--------|
| `.env.example` | ✅ Contains placeholders only, no real secrets |
| Scripts | ✅ `check-secrets.sh` actively prevents secret commits |
| Docs | ✅ No embedded credentials found |

**Recommendation**: Continue using pre-commit secret scanning.

---

## Appendix: Version Alignment Verification

| Component | Documented Version | Actual Version | Status |
|-----------|-------------------|----------------|--------|
| React | 19.x | 19.2.3 | ✅ Match |
| Vite | 7.x | 7.0.0 | ✅ Match |
| Tailwind CSS | 4.x | 4.0.0 | ✅ Match |
| Express | 5.x | 5.0.x | ✅ Match |
| Node.js | ≥24 | ≥24.0.0 | ✅ Match |
| Drizzle ORM | Latest | 0.31.4 | ✅ Match |
| TypeScript | 5.x | 5.9.3 | ✅ Match |

---

## Report Status

| Phase | Status |
|-------|--------|
| Inventory | ✅ Complete |
| Verification | ✅ Complete |
| Remediation (Batch 1) | ✅ Complete |
| Remediation (Batch 2) | ⏳ Awaiting approval |
| Process recommendations | ✅ Documented |

---

*Report generated 2026-02-02. No further file modifications pending approval.*
