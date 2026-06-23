# Antigravity Forensic Audit Report: Admin Dynamic Module Core

## Audit Context
- **Target Area:** Dynamic `admin.$module.tsx` routing pattern, associated API routes (`server/routes/admin-[module].ts`), and services.
- **Constraints Checked:** UI Component named exports, Form and Dialog standards, Toast notifications, Data fetching patterns, Express 5 async handlers, neverthrow in services, Zod schemas from shared package.

---

### P0 — Critical (Architecture & Data Integrity)

- **File:** `client/app/components/admin/product-management-unified/admin/schema/product-validation.schema.ts:1`
- **Violation:** Locally defined Zod schema (Zod imported directly). All schemas must be imported from `@run-remix/shared`.
- **Remediation:** Move schema definition to `@run-remix/shared/schemas/` and export it, then import it here.

- **File:** `client/app/components/admin/sustainability/metrics-tab.tsx:13`
- **Violation:** Locally defined Zod schema in UI component instead of importing from shared package.
- **Remediation:** Extract schema to `@run-remix/shared` and import it.

- **File:** `server/routes/admin/content.routes.ts:2`
- **Violation:** Locally defined Zod schema in API route controller.
- **Remediation:** Move schema validation logic and types to `@run-remix/shared`.

- **File:** `server/routes/admin/products.routes.ts:7`
- **Violation:** Locally defined Zod schema in API route controller.
- **Remediation:** Move schema validation logic and types to `@run-remix/shared`.

- **File:** `server/routes/admin/system.routes.ts:2`
- **Violation:** Locally defined Zod schema in API route controller.
- **Remediation:** Move schema validation logic and types to `@run-remix/shared`.

---

### P1 — Major (UI/UX & Accessibility)

- **File:** `client/app/components/admin/manufacturing/HeroManagement.tsx:36`
- **Violation:** Missing `react-hook-form` + Zod for forms. Using `useState` directly to manage form state.
- **Remediation:** Refactor to use `react-hook-form` with a Zod resolver for `ManufacturingHero` schema from `@run-remix/shared`.

- **File:** `client/app/components/admin/manufacturing/CapabilityManagement.tsx:229`
- **Violation:** Missing `react-hook-form` + Zod for forms. Using `useState` directly (`capabilityForm`).
- **Remediation:** Refactor form handling to use `react-hook-form` + Zod validation.

- **File:** `client/app/components/admin/blog/blog-management.tsx:75`
- **Violation:** Missing `@tanstack/react-query` implementation. List data fetching uses native `fetch` inside `useCallback`/`useEffect`.
- **Remediation:** Refactor the fetch logic inside `useQuery` from `@tanstack/react-query`.

- **File:** `client/app/components/admin/about/about-locations-tab.tsx:117`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace `confirm()` check with a declarative `@radix-ui/react-alert-dialog` component.

- **File:** `client/app/components/admin/about/about-sections-tab.tsx:315`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

- **File:** `client/app/components/admin/about/about-statistics-tab.tsx:275`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

- **File:** `client/app/components/admin/about/about-timeline-tab.tsx:215`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

- **File:** `client/app/components/admin/blog/blog-management.tsx:167`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

- **File:** `client/app/components/admin/homepage/HomepageProcessCardsTab.tsx:66`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

- **File:** `client/app/components/admin/homepage/HomepageSlogansTab.tsx:55`
- **Violation:** Using native `confirm()` instead of `@radix-ui/react-alert-dialog` for delete confirmation.
- **Remediation:** Replace native `confirm()` with `@radix-ui/react-alert-dialog`.

---

### P2 — Minor (Performance & Standards)

*(No deviations found in this category: Unoptimized Drizzle queries and missing `ErrorBoundary` wrappers in route files were not detected. All route files exporting a loader successfully pair it with an `ErrorBoundary`.)*

---

### P3 — Cosmetic (Brand Consistency)

*(No deviations found in this category: Tailwind arbitrary values were checked and `sonner` is utilized consistently for all toast notifications. No generic custom notification deviations found.)*
