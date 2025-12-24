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

Run `npm run verify:ssr` before merging PRs affecting core infrastructure. This runs the app in production mode on port 5003 and checks for:

- Console hydration warnings (Strict Mode)
- Visual regression (FOUC)
- Dark mode injection

> **Contributor Guide**: Please review the [SSR Safety Checklist](./ssr-safety-checklist.md) before submitting PRs.
