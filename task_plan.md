# Task Plan — Monorepo Remediation — Phase 2

## Session: 2026-05-02

### Objective
Resolve remaining accessibility debt (202 errors), perform surgical dead code cleanup, and validate the React 19 Admin Hero management component.

### Protocol 0 — Session Bookends
- [/] START: Read and update `task_plan.md`
- [ ] END: Update `findings.md` and run `npm run verify:tech-integrity`

### Remediation Status

#### Phase 1: Infrastructure & Stability
- [x] Optimize Turborepo caching (`turbo.json` inputs/outputs).
- [x] Resolve A11Y Batch A (Button types).
- [x] Resolve A11Y Batch B (Keyboard handlers for high-impact components).

#### Phase 2: A11Y Batch C (Remaining Debt)
- [x] Resolve `useButtonType` in Sidebar, Theater, and Bulk Operations.
- [x] Resolve `noStaticElementInteractions` in Marquee and HoverCard3D.
- [x] Resolve `noSvgWithoutTitle` in Stacking Cards.
- [/] Resolve remaining ~150 minor violations.

#### Phase 3: Surgical Dead Code Cleanup
- [x] Re-run `knip` audit.
- [x] Removed 11 redundant files (Comparison tool, ProcessStepForm, etc).
- [ ] Verify remaining dead code candidates.

#### Phase 4: React 19 Validation
- [x] Functional unit testing for `HeroManagement.test.tsx`.
- [x] Verify form state management via `useActionState` and `useOptimistic`.

#### Phase 5: Monorepo & Shared Audit (Complete)
- [x] Workspace structure and hoising audit.
- [x] Shared package boundary and integrity check.
- [x] TypeScript v6 and Biome 2.3.10 configuration review.
- [x] Forbidden dependency audit (framer-motion, @react-three/fiber).
- [x] Port 5002 compliance and Env schema validation.

### Status: [x] AUDIT COMPLETE (Critical findings recorded in findings.md)
