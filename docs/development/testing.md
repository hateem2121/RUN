# E2E Automation & Guardrails

This project uses **Playwright** for end-to-end testing and **Forensic Guardrails** to prevent regressions.

## 🌍 Environment

The test suite needs a running application server.

- **Default**: `http://localhost:5001`
- **Override**: Set `E2E_BASE_URL` and `PORT`.

```bash
# Example: Targeting a different port
E2E_BASE_URL=http://localhost:3000 PORT=3000 npm run test:e2e
```

## 🏃 Running Tests

### Local Development

Start the dev server in one terminal, then run tests:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e
```

### Quick Start (Smoke)

Runs the critical path smoke test (Home, Contact, Overlays).

```bash
npx playwright test e2e/smoke.spec.ts
```

### Full Test Suite

```bash
npm run test:e2e
```

### CI Mode

In CI, tests run against a production build:

```bash
npm run build
npm run start &
npm run test:e2e
```

## 🛡️ Guardrails

### Z-Index Policy

Use design tokens (`z-modal`, `z-dock`) instead of arbitrary values (`z-[999]`).

- **Enforcement**: Biome linting (`npm run lint`)
- **Tokens**: Defined in `client/src/index.css` (`@theme` block)

### SSR Hydration Check

Tests automatically verify `window.__REACT_QUERY_STATE__` is injected to prevent "Loading..." stalls.

## 📂 Artifacts

Test failures generate artifacts in `e2e/artifacts/`:

- **Screenshots**: `.png` snapshots of the failure state.
- **Traces**: Run `npx playwright show-trace e2e/artifacts/trace.zip` to debug.
- **Report**: `playwright-report/index.html`.
