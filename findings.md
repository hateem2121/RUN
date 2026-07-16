# Findings

## Date: July 2026
**Agent:** Antigravity

### 1. SSR Hydration Mismatch (CSP Nonce)
We discovered a hydration failure in `root.tsx` causing React to completely tear down and regenerate the DOM tree client-side:
- **Issue:** The server was rendering `<link ... nonce="">` while the client was rendering `<link ...>` (dropping the empty string attribute). This caused React 19 to fail hydration.
- **Root Cause:** In `server/lib/ssr/ssr-handler.ts`, `nonceContext` was defined as `createContext<string>("")` and defaulted empty nonces to `""`. React 19 drops `nonce` on the client if it isn't defined or is undefined, leading to the mismatch.
- **Fix:** We updated `ssr-handler.ts` to use `createContext<string | undefined>(undefined)` and modified the `getLoadContext` for both the Dev and Production handlers to pass `undefined` instead of `""` if the CSP nonce is unavailable. This flawlessly synchronizes server and client rendering attributes.

### 2. React Router 7 Empty Leaf Routes (Export Format)
We resolved a major issue where navigations to leaf routes (e.g., `/admin`, `/about`, `/manufacturing`) were rendering completely blank pages.
- **Issue:** Playwright E2E tests (`e2e/auth.setup.ts`) were failing with timeout errors on visible locators (like `Dashboard`) because the `nav` and `main` DOM elements didn't exist in the document body. The Vite console log showed: `Matched leaf route at location "/admin" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
- **Root Cause:** Over 28 route files in `client/app/routes/` were using `export function Component() { ... }`. While Vite HMR might occasionally coerce this or Remix v2 supported it via route configs, React Router v7's built-in file-based routing strictly expects `export default function Component() { ... }` for leaf route elements.
- **Fix:** We ran a Node script to refactor all 28 `.tsx` files in `client/app/routes/` to use `export default function Component`.

### 3. CI and Test Stability Restored
After the code refactor:
1. We stopped the dev server and ran `npm run build` to clear out stale React Router build artifacts.
2. We ran `npx playwright test e2e/auth.setup.ts` and `npx playwright test e2e/diagnostic-auth.spec.ts`. Both tests now pass reliably (24.7s and 20.3s runs) with correct Dashboard DOM rendering.
3. We ran `npm run verify:tech-integrity` as per Protocol 0, and all 8 checks passed (tsc, biome, knip, vitest, etc).

**Status:** The E2E Visual Regression and Testing Suite works smoothly again.

### 4. React 19 Form Actions & React Hook Form
During the QA audit remediation, we encountered build failures regarding type signatures in form actions.
- **Issue:** Passing `action={() => handleSubmit()()}` or modifying the `react-hook-form` `handleSubmit` signature directly caused severe TypeScript mismatches with React 19's `(formData: FormData) => void` expectation for the `action` prop.
- **Root Cause:** A misguided attempt to "remove closure wrappers" per generic React 19 guidelines conflicted with `react-hook-form`'s required closure usage.
- **Fix:** We reverted the `action` closures (e.g. `action={() => form.handleSubmit(onSubmit)()}`) back to their correct implementations, satisfying both React 19 and Biome linting rules.

### 5. Final Code Quality Assurance
- **Issue:** Biome format and lint errors were persisting after broad automated refactors.
- **Fix:** Ran `npx biome check --write --unsafe .` to correct unresolved formatting issues and remove unused imports/function parameters across the monorepo test files.
- **Result:** `npm run verify:tech-integrity` now passes 100% of all 8 critical checks, including zero lint, bundle size, dependency audit, and TypeScript compilation errors.
