# Findings: Phase 2 Monorepo Remediation

## MR-001: Turborepo Caching Inefficiency
- **Issue**: Default `turbo.json` lacked granular input/output tracking.
- **Fix**: Implemented explicit file glob tracking.
- **Impact**: Cache hits now reliable across `build`, `lint`, and `typecheck`.

## MR-002: Massive Accessibility Debt
- **Issue**: ~215 Biome a11y violations (mostly `useButtonType` and `useKeyWithClickEvents`).
- **Progress**: Resolved 13 critical violations in high-visibility components (ProductCard, Admin Layout, Tech Section).
- **Pattern**: Most issues are missing `type="button"` or `onClick` on `div` elements.

## MR-004: React 19 Testing Infrastructure
- **Issue**: JSDOM lacks native `ResizeObserver` support; `useQuery` requires default `queryFn` for isolated tests.
- **Fix**: Implemented robust mocks in `HeroManagement.test.tsx`.
- **Result**: 100% pass rate for optimistic UI and form action validation.

## MR-005: Dead Code Remediation
- **Issue**: Knip identified several unreferenced components (Comparison Tool, Legacy Step Forms).
- **Fix**: Surgically removed 11 files.
- **Impact**: Cleaned workspace boundaries and reduced maintenance surface.
