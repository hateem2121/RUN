# ADR-0016: Admin Module-Driven Catch-All Pattern

**Date:** 2026-03-28
**Status:** Accepted
**Author:** M. Hateem Jamshaid
**Context:** Architecture Audit — April 2026 (Finding M5)

---

## Context

The April 2026 architecture audit flagged that the admin interface does not maintain 1:1 URL parity with public-facing routes. For example, public route `/products/:slug` does not have a corresponding admin route at `/admin/products/:slug`.

This ADR documents the intentional architectural decision to use a **module-driven catch-all pattern** instead.

---

## Decision

The admin panel uses a **single catch-all route** (`admin.$module.tsx`) that dynamically renders the correct admin module based on the `$module` path parameter, rather than creating 1:1 mirroring of every public route in the admin namespace.

### Implementation

```
client/app/routes/
  admin.$module.tsx      ← Catch-all: /admin/products, /admin/categories, etc.
  admin.tsx              ← Admin shell layout (sidebar, nav, auth guard)
```

Within `admin.$module.tsx`, the module parameter is resolved to the appropriate admin component:

```typescript
const MODULE_MAP = {
  products: ProductsAdmin,
  categories: CategoriesAdmin,
  fabrics: FabricsAdmin,
  // ...
};
```

---

## Rationale

### Why NOT 1:1 URL parity

1. **Admin workflows differ from public browsing** — Admin operations (bulk edit, audit logs, cache invalidation, media management) are structurally different from public product display. Forcing URL parity would create artificial constraints on UX.

2. **Single admin shell** — One route handles auth guard, sidebar, breadcrumbs, and layout. Duplicating this for 20+ entity types would create significant maintenance overhead.

3. **Flexible navigation** — The module map allows admin sections to be added/removed without changing the route structure.

4. **Consistent auth surface** — A single admin route prefix makes it trivial to protect all admin functionality with a single `requireAdmin` middleware.

---

## Consequences

### Positive
- Adding a new admin module requires only: (a) a new component, (b) one line in the module map
- Auth and layout logic live in one place — cannot be accidentally bypassed
- No route file proliferation for admin sections

### Negative
- Admin URLs are not deep-linkable to specific entity records (e.g., `/admin/products/123` is not natively supported — requires module-internal state)
- Browser back/forward within an admin module requires the module to manage its own history state
- Feature parity auditing requires reading the module map, not the filesystem

### Mitigation for deep linking
For record-level deep links within admin, modules use URL search params:
```
/admin/products?id=123&mode=edit
```
This is handled by the module's internal state management, not React Router.

---

## Admin Feature Parity Convention

When adding a new public-facing feature, the admin counterpart MUST be added to `admin.$module.tsx` in the same PR. The audit checklist in `SOP_CODE_CHANGE.md` includes this as a required gate.

**To audit current admin coverage:**
```bash
grep -n "MODULE_MAP" client/app/routes/admin.\$module.tsx
```

---

## Alternatives Considered

### Option A: 1:1 Route Parity
Create `admin.products.$id.tsx`, `admin.categories.$id.tsx`, etc.
- **Rejected:** 20+ new route files, duplicated auth/layout boilerplate, no clear benefit given different admin vs. public UX requirements.

### Option B: Separate Admin SPA
A completely separate admin application (e.g., separate Vite build).
- **Rejected:** Doubles build/deploy surface area, complicates shared component usage, unnecessary for the current scale.

---

## Review

This decision should be re-evaluated if:
- Admin complexity grows to require deeply nested routing (5+ levels)
- SEO or external linking of admin pages becomes a requirement
- Team size grows to where separate admin/public ownership is needed
