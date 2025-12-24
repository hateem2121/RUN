# Resilience & Observability Audit Report

**Date:** December 22, 2025
**Overall Status:** 🟡 **PASS WITH WARNINGS**

## 1. UI Resilience (Error Boundaries)

| Component          | Status         | Findings                                                                                                             |
| :----------------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Top-Level**      | ⚠️ **MISSING** | `App.tsx` does NOT wrap the main `<Router>` in a React Error Boundary. Crushes in the router could blank the screen. |
| **Localized**      | 🟢 **PARTIAL** | `ResourceErrorBoundary` exists for specific routes.                                                                  |
| **Components**     | 🟢 **OK**      | `NewsletterSignup` handles logic errors internally.                                                                  |
| **React 19 Hooks** | ⚪ **UNUSED**  | `onCaughtError` and `onUncaughtError` are not yet implemented.                                                       |

## 2. Observability (OpenTelemetry & Sentry)

| System            | Status        | Findings                                                                           |
| :---------------- | :------------ | :--------------------------------------------------------------------------------- |
| **OpenTelemetry** | 🟢 **ACTIVE** | `server/lib/otel.ts` is correctly configured (`node-sdk`, `pino-instrumentation`). |
| **Sentry**        | 🟢 **ACTIVE** | Middleware is present in `server/index.ts` and `production-error-handler.ts`.      |
| **Verification**  | 🟢 **PASS**   | Correlation IDs are being generated and propagated via `AsyncLocalStorage`.        |

## 3. Automated Verification (Smoke Test)

| Test              | Status       | Findings                                                                                                      |
| :---------------- | :----------- | :------------------------------------------------------------------------------------------------------------ |
| **Connect Check** | 🔴 **FIXED** | Initial run failed due to port mismatch (5000 vs 5001). **Patched** `scripts/smoke-test.ts` to use Port 5001. |

## 4. React 19 Pattern Adoption

| Pattern          | Status             | Recommendation                                                  |
| :--------------- | :----------------- | :-------------------------------------------------------------- |
| `useOptimistic`  | 🟢 **ADOPTED**     | Found in `NewsletterSignup` and `ProductDetail`.                |
| `useActionState` | ⚪ **OPPORTUNITY** | `NewsletterSignup` currently uses `useState` + `useTransition`. |

---

## Recommended Code Changes

### A. Add Top-Level Error Boundary

**File:** `client/src/App.tsx`
**Action:** Wrap the return of `App` with a generic Error Boundary.

```tsx
import { ErrorBoundary } from "react-error-boundary";

function RootFallback({ error }) {
  return (
    <div className="p-4">
      <h1>Application Error</h1>
      <pre>{error.message}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={RootFallback}>
      {/* ... existing providers ... */}
    </ErrorBoundary>
  );
}
```

### B. Adopt `useActionState`

**File:** `client/src/components/homepage-v2/NewsletterSignup.tsx`
**Action:** Refactor `useState` form handling.

```tsx
// BEFORE
const [formState, setFormState] = useState({...});
const [isPending, startTransition] = useTransition();

// AFTER (React 19)
import { useActionState } from "react";
const [state, formAction, isPending] = useActionState(subscribeToNewsletter, { status: "idle" });

<form action={formAction}>...</form>
```
