# SSR Invariants & Hydration Guardrails

> **Critical**: This application uses React 19 + Vite SSR. Rendering must be deterministic to prevent hydration mismatches and FOUC (Flash of Unstyled Content).

## 1. Deterministic Markup

**Rule**: The initial render output (HTML) must be identical on Server and Client.

- **Forbidden**: `Date.now()`, `Math.random()`, `new Date()`, or `window.innerWidth` in the initial state or render body.
- **Pattern**: Initialize state with `0`, `null`, or deterministic props. Use `useEffect` to sync dynamic/random values after hydration.

```tsx
// ❌ BAD
const [id] = useState(Math.random());
const [time] = useState(Date.now());

// ✅ GOOD
const id = useId(); // Stable ID
const [time, setTime] = useState(0);
useEffect(() => setTime(Date.now()), []);
```

## 2. CSS Delivery Strategy

**Rule**: No ad-hoc `<link>` or `<style>` injection in components.

- **Mechanism**: We use `server/lib/vite-manifest.ts` to strictly inject CSS based on the pure build manifest.
- **Layering**: All styles must adhere to `index.css` Rules of Engagement.
  - `@import "tailwindcss"` must be first.
  - Legacy styles in `@layer components`.

## 3. Client/Server Parity

**Rule**: The React Tree depth must match.

- **Router**: `entry-client.tsx` must wrap `<App>` in `<Router>` exactly as `ssr-handler.ts` does.
- **Conditionals**: Do not use `if (typeof window !== 'undefined')` to conditionally render _elements_ (layout shift). Use it only for _effects_ or event handlers.

## 4. Verification

Run `npm run verify:ssr` before merging PRs affecting core infrastructure. This runs the **Vitest SSR Invariants Suite** (`tests/unit/ssr/invariants.test.ts`), which ensures:

- `index.html` contains the required SSR markers (`<!--app-head-->`, `<!--app-html-->`).
- `vite.config.ts` properly externalizes backend dependencies.
- `entry.client.tsx` uses React 19 `startTransition`.
- Codebase is scanned for forbidden SSR patterns (e.g., non-deterministic `Math.random` in render body).

> **Contributor Guide**: Please review the [SSR Safety Checklist](#appendix-a-ssr-safety-checklist) below before submitting PRs.

---

## Appendix A: SSR Safety Checklist

**Before opening a PR that touches Core UI, Manifest, or Server Handler, verify these items:**

### 1. Development & Implementation

- [ ] **Deterministic Render**: Did you use `Date.now()`, `Math.random()`, or `window.innerWidth` during the initial render?
  - ❌ `const [id] = useState(Math.random())`
  - ✅ `const id = useId()`
  - ✅ `useEffect(() => setRandom(Math.random()), [])`
- [ ] **Conditionals**: Did you use `typeof window !== 'undefined'` to hide/show _elements_?
  - ❌ `return window ? <Component /> : null` (Hydration Mismatch)
  - ✅ `useEffect(() => setMounted(true), [])`
- [ ] **CSS**: Did you add a new `<link>` tag manually?
  - ❌ Don't do it. CSS is managed by `vite-manifest.ts`.
  - ✅ Use `index.css` via Tailwind classes or standard imports.

### 2. Verification

- [ ] **Run the Guardrails**:

```bash
  npm run verify:ssr
  ```
  _This builds production, starts a real server, runs E2E tests, and checks invariants._

- [ ] **Manual Sanity Check**:
  1. **Disable JavaScript** (DevTools > Command > Disable JavaScript).
  2. Reload Homepage.
  3. Does it look broken? (FOUC).
  4. Enable JavaScript. Reload.
  5. Check Console for "Hydration failed".

### 3. Dark Mode

- [ ] **Theme Cookie**: Ensure `theme=dark` cookie results in instant dark background on reload (no white flash).

### 4. Components

- [ ] **Admin Components**: Safe to ignore SSR rules if `ClientOnly` or lazy loaded.
- [ ] **Public Components**: MUST be SSR safe.
