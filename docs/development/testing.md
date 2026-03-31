# Testing Infrastructure & Methodology

This document outlines the testing standards for the RUN Remix CMS, covering Unit, Integration, and E2E testing.

## 🧪 1. Unit Testing (Vitest)

Unit tests focus on individual services and utility functions.

- **Stack**: Vitest
- **Location**: `server/services/*.test.ts`, `client/app/hooks/*.test.ts`
- **Mandate**: 80%+ code coverage for the service layer.

### Running Unit Tests

```bash
npm run test
```

---

## 🔗 2. Integration Testing (Stateful)

Integration tests verify API endpoints and business flows using a high-fidelity stateful mock.

- **Stack**: Vitest + Supertest
- **Mock Store**: `server/tests/memory-storage.ts` (`MemoryStorage`)
- **Location**: `server/tests/integration/*.integration.test.ts`

### The MemoryStorage Mock

Unlike stateless mocks, `MemoryStorage` implements the full `IStorage` interface and persists data in-memory during the test run. This allows for complex verification of state changes across multiple API calls.

### RBAC Verification

All mutation endpoints must be tested for Role-Based Access Control:

- Use `createMockSessionUser({ isAdmin: true })` for success cases.
- Use `createMockSessionUser({ isAdmin: false })` to verify `403 Forbidden`.

### Running Integration Tests

```bash
# Run preferred v2 suites
npm run test tests/v2
```

---

## 🌍 3. E2E Automation & Guardrails

E2E tests verify the full system behavior from the user's perspective.

- **Stack**: Playwright
- **Location**: `e2e/`
- **Environment**: `http://localhost:5002`

### Running E2E Tests

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

---

## 🛡️ Guardrails

### Z-Index Policy

Use design tokens (`z-modal`, `z-dock`) instead of arbitrary values.

- **Enforcement**: Biome linting.

### SSR Hydration Check

Tests verify `window.__REACT_QUERY_STATE__` injection to prevent loading stalls.

## 📂 Artifacts

Test failures generate artifacts in `e2e/artifacts/`:

- **Screenshots**: `.png` snapshots.
- **Traces**: Run `npx playwright show-trace e2e/artifacts/trace.zip`.
- **Report**: `playwright-report/index.html`.
