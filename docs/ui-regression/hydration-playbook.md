# Hydration & SSR Reliability Playbook

## Core Principle: Deterministic Rendering

The server-rendered HTML must **exactly match** the initial client-side render.

## 1. Extension Detection & Mitigation

Browser extensions inject attributes (`data-extension-id`, `cz-shortcut`) before hydration.
**Strategy (Implemented):**

- `entry-client.tsx` runs `validateHydration()` before `hydrateRoot`.
- **Action:** Strips `cz-shortcut` and `grammarly` attributes to prevent React warnings.
- **Safety:** This is safe because these attributes are non-functional for the app itself.

## 2. Non-Deterministic Logic (Forbidden in Render Phase)

- `Date.now()` or `new Date()` → Use Server Props or `useEffect`.
- `Math.random()` → Use `useId()` or stable seed.
- `window.innerWidth` → Use `useEffect` + skeleton loader.

## 3. Server-Client State Sync

- **Wouter:** `staticLocationHook` (SSR) matches request URL.
- **QueryClient:** `dehydratedState` is passed from server to client `HydrationBoundary`.

## 4. Verification

- **CI:** Smoke test checks for critical mismatch logs.
- **Manual:** verify `view-source:` vs DevTools DOM.
