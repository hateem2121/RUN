# E2E Automation & Guardrails

This project uses **Playwright** for end-to-end testing and **Forensic Guardrails** to prevent regressions.

## 🌍 Environment

The test suite needs a running application server.

- **Default**: `http://localhost:5001`
- **Override**: Set `E2E_BASE_URL` and `PORT`.

```bash
# Example: Targeting a different port
E2E_BASE_URL=http://localhost:3000 PORT=3000 ./scripts/run-proof.sh
```

## 🏃 Running Tests

### Local Development (Auto-Start)

Running the script locally will automatically:

1. Kill port `5001` (or `$PORT`).
2. Start `npm run dev` on that port.
3. Wait for readiness.
4. Run tests.

```bash
./scripts/run-proof.sh
```

### CI / Manual Server (Skip Start)

If `CI=true` is set, the script assumes the server is **already running** and will just wait for it to be ready.

```bash
# Example: CI workflow simulation
npm run build
npm run start & # Start server in background
CI=true E2E_BASE_URL=http://localhost:3000 ./scripts/run-proof.sh
```

### Quick Start (Smoke)

Runs the critical path smoke test (Home, Contact, Overlays).

```bash
npx playwright test e2e/smoke.spec.ts
```

### Manual CI Simulation

Runs the exact check used in CI (including policy scripts).

```bash
# 1. Z-Index Policy Check
./scripts/prevent-z-index-bloat.sh

# 2. Run Proofs
./scripts/run-proof.sh
```

## 🛡️ Guardrails

### Z-Index Policy

Use design tokens (`z-modal`, `z-dock`) instead of arbitrary values (`z-[999]`).

- **Check**: `scripts/prevent-z-index-bloat.sh`
- **Allowlist**: `scripts/.z-index-allowlist` (Legacy only)

### SSR Hydration Check

Tests automatically verify `window.__REACT_QUERY_STATE__` is injected to prevent "Loading..." stalls.

## 📂 Artifacts

Test failures generate artifacts in `e2e/artifacts/`:

- **Screenshots**: `.png` snapshots of the failure state.
- **Traces**: Run `npx playwright show-trace e2e/artifacts/trace.zip` to debug.
- **Report**: `playwright-report/index.html`.
