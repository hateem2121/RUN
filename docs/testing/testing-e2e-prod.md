# Production E2E Testing Strategy

## Overview

Due to the complexity of the client-side environment (Vite HMR, route prefetching, and heavy animations), standard development-mode E2E tests can sometimes experience instability in headless CI environments. This manifests as browser freezes or `appendChild` errors originating from development-only scripts.

To ensure maximum reliability and to test the **actual artifact** that will be deployed, we have implemented a **Production-Build E2E Mode**.

## Why Prod-Mode Exists

1.  **Reliability**: Removes Vite HMR client and other development-only injections that can conflict with headless browsers.
2.  **Accuracy**: Tests the optimized, minified production bundles and the real Express production server.
3.  **Performance**: Identifies hydration issues and performance bottlenecks that only appear in production-like environments.

## How to Run Locally

### 1. Build the Artifacts

Ensure you have a fresh production build:

```bash
npm run build
```

### 2. Run the Production Tests

Execute the dedicated playwright project:

```bash
npm run test:e2e:prod
```

_This command orchestrates starting the production server on port `5002` and running the `prod-chromium` test project._

## Updating Snapshots

If you make intentional UI changes that affect the overlay contract (z-index layering), update snapshots using:

```bash
E2E_TARGET=prod npx playwright test --project=prod-chromium --update-snapshots
```

## Troubleshooting

If tests fail in production mode but pass in dev:

1.  **Hydration Mismatches**: Check the console for hydration warnings.
2.  **Asset Loading**: Ensure `dist/public` exists and is populated.
3.  **Trace Investigation**: Playwright captures traces on the first retry. Check the `test-results/` directory or run `npx playwright show-report`.
