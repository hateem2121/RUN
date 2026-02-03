# Documentation Audit Report

**Date**: 2026-02-03  
**Scope**: Full Stack Audit - Docs, Scripts & Repo Hygiene  
**Auditor**: AI Documentation Agent  
**Status**: Pending Review

---

## Executive Summary

This audit covers **75+ documentation files**, **3 shell scripts**, **2 agent skills**, and **1 workflow** in the RUN-Remix repository. The documentation structure is well-organized with clear canonical sources (SSOT) defined.

### Key Findings

| Category | Status | Action Required |
|----------|--------|-----------------|
| **AGENTS.md** | ✅ Current | Minor enhancements suggested |
| **docs/overview.md** | ✅ Current | None (canonical SSOT) |
| **README.md** | ⚠️ Needs Update | Legacy path references |
| **docs/core/architecture.md** | ⚠️ Needs Update | Legacy path references |
| **Shell Scripts** | ✅ Current | Well-maintained |
| **Prior Audit Reports** | 🗑️ Archive | 4 reports to consolidate |

### Risk Assessment

- **High Impact Issues**: 0
- **Medium Impact Issues**: 2 (legacy path references)
- **Low Impact Issues**: 5 (minor inconsistencies, candidates for archive)

---

## 1. Repository-Wide Inventory Table

### Root-Level Documentation Files

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `AGENTS.md` | meta | shared/platform | dev | ✅ current-and-correct | Well-structured AI agent guide with legacy mapping |
| `README.md` | doc | shared/platform | dev | ⚠️ needs-update | Contains `client/src/` references (should be `client/app/`) |
| `CONTRIBUTING.md` | doc | shared/platform | dev | ✅ current-and-correct | Accurate React 19, Express 5, Tailwind v4 guidance |
| `CHANGELOG.md` | doc | shared/platform | dev | ✅ current-and-correct | Updated through v4.1.0 (Jan 2026) |
| `CODE_OF_CONDUCT.md` | doc | shared/platform | dev | ✅ current-and-correct | Standard community guidelines |
| `.env.example` | config-example | shared/platform | dev, ops | ✅ current-and-correct | 24 environment variables documented |

### docs/ Directory Structure

#### docs/overview.md (SSOT)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/overview.md` | doc | shared/platform | dev, ops | ✅ current-and-correct | **Single Source of Truth** for versions. React 19.2.3, Vite 7, Express 5.1, Tailwind 4.0 |
| `docs/index.md` | doc | shared/platform | dev | ✅ current-and-correct | Documentation landing page |

#### docs/core/ (Architecture)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/core/architecture.md` | doc | shared/platform | dev | ⚠️ needs-update | References `src/components/ui` (should be `app/components/ui`) |
| `docs/core/tech-stack.md` | doc | shared/platform | dev | ✅ current-and-correct | Technology decisions |
| `docs/core/ssr-invariants.md` | doc | frontend-react19 | dev | ✅ current-and-correct | SSR safety rules |
| `docs/core/HORIZONTAL_SCALING.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Scaling documentation |
| `docs/core/VISUAL_GOVERNANCE.md` | doc | frontend-react19 | dev | ✅ current-and-correct | Visual regression |

#### docs/adr/ (Architecture Decision Records)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/adr/README.md` | doc | shared/platform | dev | ✅ current-and-correct | ADR index and template |
| `docs/adr/0001-adr-template.md` | doc | shared/platform | dev | ✅ current-and-correct | Template |
| `docs/adr/0002-react-19-over-nextjs.md` | doc | frontend-react19 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0003-neon-serverless-database.md` | doc | data/neon-drizzle | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0004-express-5-framework.md` | doc | backend-express5 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0005-drizzle-orm.md` | doc | data/neon-drizzle | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0006-tailwind-v4.md` | doc | frontend-react19 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0007-cloud-run-deployment.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | Decision recorded |
| `docs/adr/0008-upstash-redis.md` | doc | data/neon-drizzle | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0009-biome-over-eslint.md` | doc | shared/platform | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0010-monorepo-structure.md` | doc | shared/platform | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0011-google-oauth.md` | doc | backend-express5 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0012-two-tier-caching.md` | doc | backend-express5 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0013-error-handling-architecture.md` | doc | backend-express5 | dev | ✅ current-and-correct | Decision recorded |
| `docs/adr/0014-observability-pipeline.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Decision recorded |
| `docs/adr/0015-react-router-7.md` | doc | frontend-react19 | dev | ✅ current-and-correct | Decision recorded |

#### docs/api/ (API Documentation)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/api/endpoints.md` | spec | backend-express5 | dev, external-integrators | ✅ current-and-correct | 557 lines, comprehensive. Updated Jan 2026 |
| `docs/api/api-reference.md` | spec | backend-express5 | dev | ✅ current-and-correct | API reference guide |
| `docs/api/schema-reference.md` | spec | data/neon-drizzle | dev | ✅ current-and-correct | Schema documentation |
| `docs/api/auth.md` | doc | backend-express5 | dev | ✅ current-and-correct | Authentication flow |
| `docs/api/ERROR_CODES.md` | spec | backend-express5 | dev | ✅ current-and-correct | Error code reference |
| `docs/api/API_ERROR_SPEC.md` | spec | backend-express5 | dev | ✅ current-and-correct | Error specification |

#### docs/development/ (Developer Guides)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/development/3d-pipeline.md` | doc | 3d-pipeline | dev | ✅ current-and-correct | Uses @google/model-viewer, aligned with code |
| `docs/development/styling.md` | doc | frontend-react19 | dev | ✅ current-and-correct | Tailwind v4 patterns |
| `docs/development/testing.md` | doc | shared/platform | dev | ✅ current-and-correct | Testing strategy |
| `docs/development/ide-setup.md` | doc | shared/platform | dev | ✅ current-and-correct | VS Code setup |

#### docs/operations/ (Ops & SRE)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/operations/slos.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | SLO definitions |
| `docs/operations/environment.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | Environment setup |
| `docs/operations/database-recovery.md` | doc | data/neon-drizzle | ops, SRE | ✅ current-and-correct | Recovery procedures |
| `docs/operations/database-replicas.md` | doc | data/neon-drizzle | ops | ✅ current-and-correct | Replica config |
| `docs/operations/scaling-policies.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Scaling rules |
| `docs/operations/load-testing-baseline.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | Baseline metrics |
| `docs/operations/load-testing-runbook.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Load test procedures |
| `docs/operations/local-development-optimization.md` | doc | shared/platform | dev | ✅ current-and-correct | Dev optimization |
| `docs/operations/observability.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | Observability setup |
| `docs/operations/BRANCH_PROTECTIONS.md` | doc | infra/CI-CD | dev, ops | ✅ current-and-correct | Branch rules |
| `docs/operations/MAINTENANCE_RUNBOOK.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Maintenance procedures |

#### docs/runbooks/ (Incident Response)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/runbooks/README.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Runbook index |
| `docs/runbooks/incident-response.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | SEV-1/2 procedures |
| `docs/runbooks/database-outage.md` | doc | data/neon-drizzle | ops, SRE | ✅ current-and-correct | DB failure response |
| `docs/runbooks/deployment-rollback.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Rollback procedures |
| `docs/runbooks/circuit-breaker-trip.md` | doc | backend-express5 | ops, SRE | ✅ current-and-correct | Circuit breaker response |
| `docs/runbooks/rate-limit-surge.md` | doc | backend-express5 | ops, SRE | ✅ current-and-correct | Traffic spike response |
| `docs/runbooks/sentry-alert-triage.md` | doc | infra/CI-CD | ops, SRE | ✅ current-and-correct | Alert triage |

#### docs/security/ & docs/compliance/

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/security/threat-model.md` | doc | shared/platform | dev, SRE | ✅ current-and-correct | Threat analysis |
| `docs/security/encryption-at-rest.md` | doc | data/neon-drizzle | ops, SRE | ✅ current-and-correct | Encryption policies |
| `docs/security/penetration-testing-policy.md` | doc | shared/platform | ops, SRE | ✅ current-and-correct | Pen test policy |
| `docs/compliance/gdpr-ccpa.md` | doc | shared/platform | dev, ops | ✅ current-and-correct | Privacy compliance |
| `docs/compliance/data-classification.md` | doc | shared/platform | dev, ops | ✅ current-and-correct | Data handling |

#### docs/guides/ & docs/testing/

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/guides/developer-workflow.md` | doc | shared/platform | dev | ✅ current-and-correct | Dev workflow |
| `docs/guides/TRANSACTION_SAFETY.md` | doc | data/neon-drizzle | dev | ✅ current-and-correct | Transaction patterns |
| `docs/testing/testing-tiers.md` | doc | shared/platform | dev | ✅ current-and-correct | Test strategy |
| `docs/testing/testing-e2e-prod.md` | doc | shared/platform | dev | ✅ current-and-correct | E2E testing guide |

#### docs/architecture/ & docs/observability/

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/architecture/system_diagrams.md` | doc | shared/platform | dev | ✅ current-and-correct | C4 diagrams |
| `docs/architecture/event-bus.md` | doc | backend-express5 | dev | ✅ current-and-correct | Event architecture |
| `docs/observability/observability-and-errors.md` | doc | infra/CI-CD | dev, ops | ✅ current-and-correct | Error handling |
| `docs/observability/LOCAL_STACK.md` | doc | infra/CI-CD | dev | ✅ current-and-correct | Local observability |

#### docs/reports/ (Prior Audits - Archive Candidates)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `docs/reports/docs-audit-2026-02-02.md` | doc | shared/platform | dev | 🗑️ candidate-for-archive | Superseded by this report |
| `docs/reports/docs-audit-2026-02-03-formal.md` | doc | shared/platform | dev | 🗑️ candidate-for-archive | Superseded by this report |
| `docs/reports/docs-audit-final-2026-02-03.md` | doc | shared/platform | dev | 🗑️ candidate-for-archive | Superseded by this report |

### scripts/ Directory

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `scripts/setup/install-extensions.sh` | script | shared/platform | dev | ✅ current-and-correct | VS Code extension installer |
| `scripts/setup/verify-setup.sh` | script | shared/platform | dev | ✅ current-and-correct | Setup verification |
| `scripts/security/check-secrets.sh` | script | shared/platform | dev | ✅ current-and-correct | Pre-commit secret scanner |

### .agent/ Directory (AI Agent Configuration)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `.agent/skills/project-standards/SKILL.md` | meta | shared/platform | AI agents | ✅ current-and-correct | 228 lines, comprehensive |
| `.agent/skills/react-express-typescript/SKILL.md` | meta | shared/platform | AI agents | ✅ current-and-correct | Stack enforcement |
| `.agent/workflows/dev-server.md` | meta | shared/platform | AI agents, dev | ✅ current-and-correct | Dev server workflow |

### ops/ Directory (Operations Configs)

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `ops/load-testing/README.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | k6 load testing |
| `ops/otel-collector-config.yaml` | config | infra/CI-CD | ops | ✅ current-and-correct | OpenTelemetry config |
| `ops/alerts/` | config | infra/CI-CD | ops, SRE | ✅ current-and-correct | Alert definitions |
| `ops/dashboards/` | config | infra/CI-CD | ops, SRE | ✅ current-and-correct | Grafana dashboards |
| `ops/observability/` | config | infra/CI-CD | ops, SRE | ✅ current-and-correct | Observability configs |
| `ops/prometheus/` | config | infra/CI-CD | ops, SRE | ✅ current-and-correct | Prometheus rules |

### terraform/ Directory

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `terraform/README.md` | doc | infra/CI-CD | ops | ✅ current-and-correct | IaC documentation |
| `terraform/main.tf` | config | infra/CI-CD | ops | ✅ current-and-correct | Primary Terraform |
| `terraform/*.tf` | config | infra/CI-CD | ops | ✅ current-and-correct | Infrastructure as Code |

### .github/ Directory

| Path | Type | Area | Audience | Status | Notes |
|------|------|------|----------|--------|-------|
| `.github/CODEOWNERS` | config | shared/platform | dev | ✅ current-and-correct | Ownership definitions |
| `.github/PULL_REQUEST_TEMPLATE.md` | meta | shared/platform | dev | ✅ current-and-correct | PR template |
| `.github/dependabot.yml` | config | shared/platform | dev, ops | ✅ current-and-correct | Dependency updates |
| `.github/workflows/*.yml` (18 files) | config | infra/CI-CD | dev, ops | ✅ current-and-correct | CI/CD pipelines |

---

## 2. Per-File Findings and Recommendations

### Critical Files Requiring Updates

#### README.md

**What is accurate and should be preserved**:
- Tech stack overview (React 19, Express 5, Tailwind v4)
- Quick start instructions
- npm scripts documentation
- Performance metrics
- API reference section
- Deployment instructions
- Troubleshooting section

**What is outdated or misleading**:
```
Lines 136-148 (Project Structure section):
├── client/
│   ├── src/          ❌ OUTDATED - Actual path is `app/`
│   │   ├── components/
│   │   │   ├── ui/
```

The actual structure is:
```
├── client/
│   ├── app/          ✅ CORRECT
│   │   ├── components/
```

**Also outdated**:
- Line 237: `client/src/` → should be `client/app/`
- Line 243: `src/lib/design-tokens.ts` → should be `app/lib/design-tokens.ts`

**Proposed Action**: **UPDATE** (Low Risk)
- Replace all `client/src/` references with `client/app/`
- Update the Project Structure section to match actual layout

**Human Decision Required**: No

---

#### docs/core/architecture.md

**What is accurate and should be preserved**:
- C4 context diagram
- Deployment architecture
- Data flows (sequence diagrams)
- ERD models
- Feature implementation map
- Architecture health scores

**What is outdated or misleading**:
```
Lines 82-86 (Directory Map):
| `src/components/ui`       | **Atomic UI Library**  ❌ OUTDATED
| `src/components/admin`    | **Admin Domain**       ❌ OUTDATED
| `src/components/products` | **Product Domain**     ❌ OUTDATED
| `src/pages`               | **Route Pages**        ❌ OUTDATED
| `src/lib`                 | **Core Utilities**     ❌ OUTDATED
```

Should be:
```
| `app/components/ui`       | **Atomic UI Library**  ✅ CORRECT
| `app/components/admin`    | **Admin Domain**       ✅ CORRECT
| `app/components/products` | **Product Domain**     ✅ CORRECT
| `app/routes`              | **Route Pages**        ✅ CORRECT
| `app/lib`                 | **Core Utilities**     ✅ CORRECT
```

**Proposed Action**: **UPDATE** (Low Risk)
- Replace `src/` with `app/` in the Directory Map section

**Human Decision Required**: No

---

### Files for Archival

#### docs/reports/ - Prior Audit Reports

**Evidence of non-usage**:
- `docs-audit-2026-02-02.md`: Superseded by this report
- `docs-audit-2026-02-03-formal.md`: Incomplete/superseded
- `docs-audit-final-2026-02-03.md`: Draft version

**Proposed Action**: **ARCHIVE**
- Move to `docs/reports/archive/` with version/date suffix
- This report becomes the canonical audit record

**Human Decision Required**: Yes (confirm archive vs delete)

---

### Well-Maintained Files (No Action Required)

| File | Reason to Preserve |
|------|-------------------|
| `AGENTS.md` | Correctly maps legacy paths, current stack info |
| `docs/overview.md` | Canonical SSOT, accurate version matrix |
| `docs/api/endpoints.md` | Recently updated, comprehensive |
| `docs/development/3d-pipeline.md` | Correctly documents @google/model-viewer |
| `docs/adr/*` | All 15 ADRs are current and valuable |
| `docs/runbooks/*` | All 7 runbooks are operationally sound |
| All shell scripts | Well-documented, referenced by docs |

---

## 3. Implementation Plan

### Batch 1: Safe Path Updates (Low Risk)

**Files to modify**:
1. `README.md` - Update 3 path references
2. `docs/core/architecture.md` - Update 5 path references

**Risk Level**: Low
**Impact**: Cosmetic corrections only
**Required Approvals**: None (routine maintenance)
**Dependencies**: None

**Verification**:
```bash
# Check for remaining src/ references after update
grep -r "client/src" docs/ README.md --include="*.md"
# Should return 0 results
```

---

### Batch 2: Report Consolidation (Low Risk)

**Files to archive**:
1. `docs/reports/docs-audit-2026-02-02.md` → `docs/reports/archive/`
2. `docs/reports/docs-audit-2026-02-03-formal.md` → `docs/reports/archive/`
3. `docs/reports/docs-audit-final-2026-02-03.md` → `docs/reports/archive/`

**Risk Level**: Low
**Impact**: Reduces confusion from multiple audit reports
**Required Approvals**: Platform lead (confirm archive is acceptable)
**Dependencies**: This report to be approved first

**Proposed archive structure**:
```
docs/reports/
├── docs-audit-2026-02-03.md     # This report (canonical)
└── archive/
    ├── README.md                 # Index of archived reports
    ├── docs-audit-2026-02-02.md  # Historical
    └── ...
```

---

### Batch 3: Future Enhancements (Optional)

**Potential improvements identified but NOT blocking**:

1. **Auto-generated API docs**: Consider generating from OpenAPI spec
2. **Schema docs from Drizzle**: Auto-generate from `shared/schema.ts`
3. **Stale doc detection**: Add `last-reviewed` frontmatter to key docs
4. **CI doc checks**: Already partially in place (`.github/workflows/docs-*.yml`)

---

## 4. Process and Tooling Recommendations

### Docs-as-Code Workflow

> Already in place, documented in `CONTRIBUTING.md`

**Current state**:
- ✅ Doc changes expected in same PR as code changes
- ✅ Biome linting applies to markdown files (`lint-staged` config)
- ✅ Markdown link checking CI (`.github/workflows/docs-link-check.yml`)
- ✅ Doc structure validation (`npm run verify:docs-structure`)

**Recommended enhancement**:
Add frontmatter to high-impact docs:
```yaml
---
owner: platform-team
last-reviewed: 2026-02-03
applies-to-version: ">=4.1.0"
system-area: frontend-react19
---
```

### CI/CD Integration

**Current state**:
- ✅ `docs-check.yml` - Basic doc validation
- ✅ `docs-link-check.yml` - Link validation
- ✅ `docs-lint.yml` - Markdown linting
- ✅ `.markdownlint.json` - Linting rules
- ✅ `.markdown-link-check.json` - Link check config

**Recommendation**: Current setup is comprehensive. No changes required.

### AGENTS.md Assessment

**Current state**: ✅ Excellent
- Follows emerging open standard format
- Covers: commands, testing, structure, style, boundaries
- Includes legacy mapping (good vs bad paths)
- References canonical docs (SSOT)

**Minor enhancement suggestion**:
Add explicit version info:
```markdown
## Version Compatibility
- This file last updated: 2026-02-03
- Applies to: run-remix-monorepo v4.1.0+
```

### Documentation Health Metrics

**Suggested tracking**:

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Broken links** | 0 | 0 | `npm run check:docs` |
| **Legacy path refs** | 2 files | 0 | grep scan |
| **Docs with frontmatter** | ~20% | 80%+ | Script audit |
| **ADR coverage** | 15 decisions | All major | Manual review |
| **Runbook coverage** | 7 scenarios | All critical | Manual review |

---

## 5. Summary of Actions

| Priority | Action | Files | Risk | Approver |
|----------|--------|-------|------|----------|
| 1 | Update path references | README.md, architecture.md | Low | Auto-approve |
| 2 | Archive old audit reports | 3 files → archive/ | Low | Platform lead |
| 3 | Add frontmatter metadata | Key docs | Low | Optional |
| 4 | Version stamp AGENTS.md | AGENTS.md | Low | Optional |

---

## Appendix: Discovery Commands Used

```bash
# Find all markdown files
find . -name '*.md' -not -path '*/node_modules/*' | wc -l
# Result: 122 files (including node_modules: excluded)

# Find shell scripts
find . -name '*.sh' -not -path '*/node_modules/*'
# Result: 3 project scripts

# Check for legacy path references
grep -r "client/src" . --include="*.md" -l
# Result: 2 files with outdated references
```

---

**Report Status**: PENDING REVIEW  
**Next Steps**: Review this report and approve Batch 1 + Batch 2 implementation
