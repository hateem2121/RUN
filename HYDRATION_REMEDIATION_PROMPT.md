# 📘 Hydration Remediation Guide: Deep Dive

This document provides a comprehensive analysis of the identified hydration issues, their root causes, and robust remediation strategies. It is intended for developers who want to understand the _why_ behind the fixes.

---

## 🛑 HYD-01: Sustainability Page Crash (Critical)

### The Issue

The application crashes when navigating to or loading `/sustainability` with the error `TypeError: res.json is not a function`.

### Root Cause Analysis

- **Location:** `client/src/pages/sustainability.tsx`
- **Mechanism:** The `apiRequest` utility function in `client/src/lib/api.ts` is designed to be a "smart wrapper". It detects JSON responses and automatically parses them using `res.json()`.
- **The Defect:** The consuming component (`Sustainability.tsx`) assumes it receives a raw `Response` object and attempts to call `.json()` again. Since `apiRequest` returns a plain JavaScript object (the parsed JSON), the method `.json()` does not exist.

### Remediation Strategy

**Wait, why not change `apiRequest`?**
Changing `apiRequest` would likely break every other component in the application that correctly expects a parsed object. The correct fix is to update the _consumer_ (`Sustainability.tsx`) to match the established contract.

### Code Fix

```typescript
// client/src/pages/sustainability.tsx

// ❌ Incorrect
queryFn: async () => {
  const res = await apiRequest("/api/sustainability/batch");
  return res.json();
};

// ✅ Correct
queryFn: async () => {
  return await apiRequest("/api/sustainability/batch");
};
```

---

## ⚠️ HYD-02: Smooth Scroll SSR Warning (Medium)

### The Issue

Console warning: `Warning: useLayoutEffect does nothing on the server`.

### Root Cause Analysis

- **Location:** `client/src/components/layout/SmoothScrollLayout.tsx`
- **Mechanism:** `useLayoutEffect` is synchronous and runs after DOM mutations but before paint. On the server (Node.js/Express), there is no DOM, so React skips this hook and warns you about potential mismatches.
- **Why it matters:** While often just "noise", it can indicate that the first paint on the client (which has run `useLayoutEffect`) might differ from the server HTML (which didn't), causing a layout shift or hydration mismatch.

### Remediation Strategy

For initializing libraries like Lenis (smooth scroll), `useEffect` is generally sufficient and SSR-safe. `useEffect` runs asynchronously after the paint, which avoids blocking the main thread and the server warning.

**Alternative: `useIsomorphicLayoutEffect`**
If you _must_ prevent a flash of unstyled content (FOUC), use this pattern:

```typescript
import { useLayoutEffect, useEffect } from "react";
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

_For this specific case, standard `useEffect` is recommended._

---

## ℹ️ HYD-03: Hydration Stability Checks (Low)

### The Issue

Extensive usage of `if (typeof window !== "undefined")` inside render bodies.

### Root Cause Analysis

- **Pattern:** Using environment checks to conditional rendering.
- **Risk:**
  - Server: `typeof window` is `false`. Renders Component A.
  - Client (Initial Hydration): `typeof window` is `true`. Renders Component B.
  - **Result:** Hydration Mismatch Error. React expects the initial client render to strictly match the server HTML.

### Remediation Strategy

Ensure that the _initial_ render on the client matches the server. Use a "mounted" state to unlock client-only features.

### Safe Pattern

```typescript
function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return null or a skeleton that matches server output
    return <LoadingSkeleton />;
  }

  // Now safe to render references to window/document
  return <ClientOnlyComponent />;
}
```

---

## 🧪 Testing Strategy

### 1. Verification of HYD-01

- **Action:** Load `/sustainability`.
- **Expectation:** Page renders Hero, Metrics, and Certificates.
- **Edge Case:** Check network tab to ensure `/api/sustainability/batch` returns valid JSON.

### 2. Verification of HYD-02

- **Action:** Check Console logs.
- **Expectation:** Warning should be gone.
- **Edge Case:** Ensure smooth scrolling still works (scroll down page).

### 3. Regression Testing

- **Action:** Navigate to Home and Products.
- **Goal:** Ensure `apiRequest` usage elsewhere wasn't accidentally broken (if you touched `api.ts`).

---

## 🚀 Deployment & Rollback

### Pre-Deployment

1.  Run `npm run build` to verify TypeScript compilation.
2.  Run `npm run lint` to check for hook violations.

### Rollback Plan

If `Sustainability.tsx` fails after fix (unlikely), revert the file to previous commit.
If `SmoothScrollLayout` causes visual jitter, revert to `useLayoutEffect` and accept the server warning temporarily.

---

**Prepared by:** Antigravity Agent
**Date:** December 22, 2025
