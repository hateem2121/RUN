# 🤖 Copyable Remediation Prompt: RUN-Remix Hydration Fixes

**Objective:** Implement critical hydration fixes for the RUN-Remix React 19 application.
**Context:** Three issues identified (HYD-01, HYD-02, HYD-03) ranging from critical crashes to warnings.

---

## 🛠️ Step-by-Step Implementation Instructions

### 1. Fix HYD-01: Double JSON Parsing (Critical)

**File:** `client/src/pages/sustainability.tsx`
**Issue:** `TypeError: res.json is not a function`. The `queryFn` calls `.json()` on a result that is already a plain object (parsed by `apiRequest`).

#### Action:

Modify the `queryFn` in the `useQuery` hook for `["/api/sustainability/batch"]`.

```typescript
// BEFORE (Line ~32)
queryFn: async () => {
  const res = await apiRequest("/api/sustainability/batch");
  return res.json(); // <--- ERROR: Double parse
},

// AFTER
queryFn: async () => {
  return await apiRequest("/api/sustainability/batch"); // <--- FIX: Return directly
},
```

### 2. Fix HYD-02: Safe Layout Effect (Medium)

**File:** `client/src/components/layout/SmoothScrollLayout.tsx`
**Issue:** `useLayoutEffect` runs on the server, causing console warnings.

#### Action:

Replace `useLayoutEffect` with `useEffect`. The Lenis initialization does not strictly require synchronous layout blocking for this use case.

```typescript
// BEFORE
import { useLayoutEffect, useMemo, useRef, useState } from "react";
// ...
useLayoutEffect(() => {
  // ... Lenis init
}, []);

// AFTER
import { useEffect, useMemo, useRef, useState } from "react"; // <--- Change import
// ...
useEffect(() => {
  // <--- Change hook
  // ... Lenis init
}, []);
```

### 3. Fix HYD-03: Robust Hydration Checks (Low)

**File:** `client/src/App.tsx`
**Issue:** Extensive `typeof window` checks can constitute an anti-pattern if they lead to render mismatch.
**Fix:** Use a `mounted` state to ensure consistent rendering between server and first client render, then enable client-only logic.

#### Action:

Implement a `useMounted` check in `App.tsx` or ensure strictly client-side logic is guarded by `useEffect`.

_Note: For `App.tsx`, specifically around the logging and checks:_

```typescript
// Example Pattern to Apply:
function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ...
  // Use `mounted` instead of `typeof window !== 'undefined'` for render output logic
}
```

_Specific Change for `client/src/App.tsx`:_
Review the `App` component. If logic branches on `typeof window`, wrap it or ensure the initial render matches SSR.

---

## ✅ Verification Checklist

**Automated:**

1.  Run `npm run dev`
2.  Navigate to `http://localhost:5001/sustainability`
    - **Pass:** Page loads content (hero, metrics).
    - **Fail:** Error boundary "res.json is not a function" appears.

**Manual Console Check:**

1.  Navigate to `http://localhost:5001/`
2.  Open Console.
3.  Refresh.
    - **Pass:** No "Warning: useLayoutEffect does nothing on the server" messages.

---

## 💻 Quick Commands

```bash
# Start Server
npm run dev

# Run Quality Checks
npm run lint
```
