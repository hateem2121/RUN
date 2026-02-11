# Documentation Remediation Plan (2026+)

This plan addresses the gaps identified in the February 2026 Documentation Audit.

## 1. Fix Critical API Inconsistency

The missing `/api/navigation-items` endpoint must be implemented and documented.

- **Action 1.1**: Implement the `navigation-items` router in the server.
- **Action 1.2**: Update `docs/api/endpoints.md` with the schema for `/api/navigation-items`.
- **Action 1.3**: Update `docs/ROUTE_MAPPING.md` to include navigation data flow.

## 2. Document React 19 Standards

Ensure all UI components and future development follow the "No `forwardRef`" policy.

- **Action 2.1**: Update `docs/core/tech-stack.md` to explicitly demonstrate the `ref` prop pattern for React 19.
- **Action 2.2**: Audit remaining legacy UI components (if any) for `forwardRef` usage and schedule refactors.

## 3. Archive Obsolete Documentation

Move historical and redundant docs to `docs/archive/legacy/`.

- **Action 3.1**: Move `docs/docs-audit-report.md` → `docs/archive/legacy/docs-audit-report-2025.md`.
- **Action 3.2**: Move `docs/api/api-reference.md` → `docs/archive/legacy/api-reference-obsolete.md`.

## 4. Maintenance Schedule

To prevent future documentation drift:

- **Bi-weekly Sync**: Automate a scan for implemented routes vs. documented endpoints.
- **Port Watch**: Continue enforcing `npm run verify-port` in the CI/CD pipeline.
