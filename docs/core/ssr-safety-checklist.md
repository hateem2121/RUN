# SSR Safety Checklist

**Before opening a PR that touches Core UI, Manifest, or Server Handler, verify these items:**

> **Technical Context**: For deep technical details on _why_ these rules exist, read [SSR Invariants & Guardrails](./ssr-invariants.md).

## 1. Development & Implementation

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

## 2. Verification

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

## 3. Dark Mode

- [ ] **Theme Cookie**: Ensure `theme=dark` cookie results in instant dark background on reload (no white flash).

## 4. Components

- [ ] **Admin Components**: Safe to ignore SSR rules if `ClientOnly` or lazy loaded.
- [ ] **Public Components**: MUST be SSR safe.

> See [SSR Invariants](./ssr-invariants.md) for technical details.
