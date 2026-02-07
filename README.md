---
owner: platform-team
last-reviewed: 2026-02-04
system-area: shared/platform
---

# RUN Apparel B2B Platform

A modern B2B e-commerce platform for athletic apparel manufacturing, built with **React 19 (Stable)**, **Express 5.1**, **Tailwind CSS v4 (Stable)**, and **React Router 7**.

---

## Table of Contents

- [Overview](#overview)
- [System Context](#system-context)
- [Architecture Guide](#architecture-guide)
- [Tech Stack](./docs/overview.md#2-stack--critical-versions)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Performance Metrics](#performance-metrics)
- [CSS Architecture](#css-architecture)
- [Development Guidelines](#development-guidelines)
- [SSR Architecture](#ssr-architecture)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

RUN Apparel is a comprehensive B2B platform enabling:

- **Product Catalog Management** - Full CMS for athletic apparel products
- **Category & Collections** - Hierarchical product organization
- **Media Library** - Centralized asset management with 3D model support
- **Sustainability Tracking** - Environmental metrics and certifications
- **Manufacturing Workflow** - Process management and quality tracking
- **Admin Dashboard** - Complete content management system

---

## System Context

👉 **[System Context](./docs/overview.md)** 👈

Comprehensive technical reference for tools, extensions, MCP servers, and system architecture.

---

## Architecture Guide

👉 **[Architecture Guide](./docs/core/architecture.md)** 👈

Use this guide to orient yourself before diving into specific files.

---


> **Canonical Reference**: For the complete version matrix, exact package versions, and provenance, see the [System Overview & Architecture](./docs/overview.md#2-stack--critical-versions).

**Core Stack**:

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, React Router 7
- **Backend**: Express 5, Node.js 24
- **Data**: PostgreSQL, Drizzle ORM, Redis
- **Infra**: Docker (Alpine), Cloud Run

---

## Quick Start

### Prerequisites

- Node.js 24 (LTS)
- PostgreSQL database
- npm

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd RUN-Remix

# 2. Bootstrap Project
# (Installs dependencies, sets up .env, and verifies environment)
./scripts/bootstrap.sh

# 3. Push database schema
npm run db:push
```

### 4. Start development server

```bash
npm run dev
```

### 5. Performance Tuning (Optional)

To enable advanced debugging tools (CPU intensive), use environment variables:

```bash
# Enable React Scan (Visualizes re-renders)
ENABLE_REACT_SCAN=true npm run dev

# Enable Vite Inspector (Localhost:5002/__inspect)
VITE_INSPECT=true npm run dev

# Enable Bundle Visualizer (Generates stats.html)
VITE_ANALYZE=true npm run dev
```

The app will be available at `http://localhost:5002`. For Docker environments (via `docker-compose`), it also runs on `http://localhost:5002`.

### 5. Verify Integrity

```bash
npm run verify:tech-integrity
```

### Environment Variables

See [System Overview > Environment Variables](./docs/overview.md#5-environment-variables) for the complete schema and required secrets.

**Quick Setup (`.env`):**
```bash
PORT=5002
NODE_ENV=development
DATABASE_URL=postgres://...
# See .env.example for full list
```

---

## Project Structure

The project is structured as a **Monorepo** (internally named `run-remix-monorepo` for legacy reasons) using NPM Workspaces:

```text
RUN-Apparel-Platform/
├── client/ (@run-remix/client) # Frontend application (React 19, Vite)
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── admin/
│   │   │   ├── homepage/
│   │   │   └── products/
│   │   ├── routes/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── index.css
│   └── index.html
│
├── server/ (@run-remix/server) # Backend application (Express 5)
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── db/
│   └── .env                    # Server-specific env vars
│
├── shared/ (@run-remix/shared) # Shared code (No deps)
│   ├── schema.ts               # Drizzle Schema + Zod
│   └── package.json            # "type": "module"
│
├── scripts/                    # Build & setup scripts
│   ├── setup/                 # Environment and CLI setup
│   └── verify-tech-integrity.ts
│
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── operations/            # Operational guides
│   ├── core/                  # Architecture & Tech Stack
│   ├── development/           # Development guides
│   └── testing/               # Testing guides
│
└── tests/                     # Test suites
    ├── e2e/                   # Playwright E2E tests
    └── integration/           # Integration tests
```

---

## npm Scripts

For a detailed breakdown of all operational commands, see [System Overview > Scripts](./docs/overview.md#4-scripts--operational-commands).

**Common Commands**:

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run verify:tech-integrity # Run full health check
```


---

## Performance Metrics

### Performance Benchmarks

_Post React 19 + Vite 7 + Tailwind v4 migration (Jan 2026)_

| Metric                     | Value  | Target       |
| -------------------------- | ------ | ------------ |
| **Lighthouse Performance** | 92/100 | ✅ Met       |
| **CLS**                    | < 0.1  | ✅ Good      |
| **Critical Path**          | ~448KB | ✅ Optimized |
| **Build Time**             | ~24s   | ✅ Fast      |
| **SSR TTFB**               | ~62ms  | ✅ Baseline  |

### Optimizations Applied

- Navigation lazy loading
- Code splitting by route
- Image optimization with WebP/AVIF
- 3D model lazy loading (~1MB saved)
- React Query caching

---

## CSS Architecture

**Score: 10/10** ⭐

### Metrics

| Metric             | Value             |
| ------------------ | ----------------- |
| @theme tokens      | 116               |
| @utility classes   | 56                |
| Raw gray-\* colors | 0 (100% semantic) |
| cva variants       | 49                |
| cn() adoption      | 383 usages        |

### File Organization

```text
client/app/
├── index.css              # Single source of truth (931 lines)
│   ├── @theme { }         # 116 design tokens
│   ├── @layer base { }    # Resets & variables
│   ├── @layer components  # Complex styles
│   └── @utility classes   # 56 custom utilities
│
└── lib/design-tokens.ts   # Type-safe token exports
```

### Key Patterns

```tsx
// ✅ Use semantic tokens
<p className="text-muted-foreground">Secondary text</p>
<div className="bg-muted">Muted background</div>

// ✅ Use cn() for composition
import { cn } from "@/lib/utils";
<div className={cn("base", isActive && "active", className)} />

// ✅ Use cva for variants
import { cva } from "class-variance-authority";
const buttonVariants = cva("base", { variants: {...} });

// ❌ Avoid raw colors
<p className="text-gray-500">Don't do this</p>
```

See `docs/development/styling.md` for details.

---

## Development Guidelines

### Coding Standards

#### Logging

```typescript
// ❌ DO NOT use (will fail linting)
console.log("message");

// ✅ USE instead
logger.info("message"); // Server
debug("message"); // Client
```

#### CSS Classes

```tsx
// ❌ Avoid arbitrary values when tokens exist
<div className="h-[500px] z-[999]">

// ✅ Use tokens
<div className="h-modal-sm z-modal">
```

#### Component Patterns

```tsx
// Always use cn() for className composition
import { cn } from "@/lib/utils";

export function Component({ className, ...props }) {
  return <div className={cn("base-classes", className)} {...props} />;
}
```

### Required Tooling

| Tool            | Required | Banned         | Notes                                |
| --------------- | -------- | -------------- | ------------------------------------ |
| **Linting**     | Biome    | ESLint         | Use `biomejs.biome` VSCode extension |
| **API Testing** | Bruno    | Thunder Client | FOSS policy                          |
| **Security**    | audit-ci | -              | `npm run check:audit`                |

### Performance Debugging

- **React Scan**: Dev tool for visualizing re-renders
- **WhyDidYouRender**: Auto-enabled in dev mode, check browser console
- **Configuration**: `client/app/wdyr.ts` (excluded from production)

---

## SSR Architecture

### HTML Template Markers

The `client/index.html` must contain:

```html
<head>
  <!--app-head-->
  <!-- Critical CSS, meta tags -->
</head>
<body>
  <div id="root">
    <!--app-html-->
    <!-- React SSR stream -->
  </div>
</body>
```

### Safe DOM Access

```typescript
// ❌ Never at module top level
const width = window.innerWidth;

// ✅ Inside useEffect
useEffect(() => {
  const width = window.innerWidth;
}, []);

// ✅ With guard
function getWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
}
```

### SSR Verification

```bash
npm run verify:ssr           # Full SSR verification (Unit Tests)
```

---

## API Reference

### Base URL

- **Development**: `http://localhost:5002/api/v1` (Legacy: `/api`)
- **Docker/Container**: `http://localhost:5002/api/v1`
- **Production**: `https://api.runapparel.com/api/v1`

### API Documentation (`/api/docs`)

The platform includes auto-generated OpenAPI 3.0 documentation.

1. Start the server: `npm run dev`
2. Visit: `http://localhost:5002/api/docs`

This provides an interactive Swagger UI to test all endpoints.

### Authentication Flow

All routes are secured via centralized `AuthService`.

- **Admin Routes**: Require `authService.requireAdmin` middleware.
- **Session**: Managed via PostgreSQL-backed sessions (`connect-pg-simple`).
- **Authorization**: Role-based access control (RBAC) with caching.

### Key Endpoints

| Endpoint               | Method   | Description        |
| ---------------------- | -------- | ------------------ |
| `/api/v1/products`     | GET      | List all products  |
| `/api/v1/products/:id` | GET      | Get single product |
| `/api/v1/categories`   | GET      | List categories    |
| `/api/v1/media`        | GET/POST | Media library      |
| `/api/v1/contact`      | POST     | Contact form       |
| `/api/v1/health`       | GET      | Health check       |
| `/api/v1/health/db`    | GET      | Database health    |

See `docs/api/endpoints.md` for full documentation.

### Rate Limiting

- **Production**: Uses Upstash Redis
- **Local/Fallback**: In-memory rate limiting
- **Behavior**: Fail-open (logs errors but allows traffic)
- **Configuration**: `server/middleware/rateLimiter.ts`

---

## Architecture & Security Features (New)

### Secret Management

- **Runtime Loading**: Secrets are loaded from Google Secret Manager at boot time.
- **Rotation**: Session IDs are automatically rotated every 15 minutes.

### Feature Management

- **Feature Flags**: Managed via `/admin/features`. Supports percentage rollouts and user whitelisting.
- **Audit Logs**: All admin mutations are structurally logged for compliance.

---

## Testing

### Test Commands

```bash
npm run test             # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E regression
```

### Test Files

- `tests/api.http` - API testing with REST Client
- `tests/e2e/` - Playwright E2E tests
- `tests/integration/` - Integration tests

### Accessibility Standards

All components follow WCAG 2.1 AA:

- Focus states with `focus-visible:ring-2 focus-visible:ring-ring`
- Proper ARIA labels
- Keyboard navigation
- Reduced motion support via `motion-safe:` / `motion-reduce:`

### Load Testing

See [Load Testing Baseline](./docs/operations/load-testing-baseline.md) for performance thresholds and SLOs.

```bash
# Install k6
brew install k6

# Run baseline test
k6 run --env BASE_URL=http://localhost:5002 ops/load-testing/baseline.js
```

---

## Deployment

### Production Build

```bash
npm run build            # Build all
npm run verify:build     # Verify output
npm run start            # Start production server
```

### Build Output

```text
dist/
├── public/              # Static assets
│   └── assets/          # Bundled CSS/JS
├── ssr/                  # SSR bundle
└── index.js             # Express server
```

### Health Checks

- `/api/health` - Basic health (returns 200)
- `/api/health/db` - Database connection check

---

## Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Follow coding standards above
3. Ensure all checks pass: `npm run ci:checks`
4. Submit PR with description

### Branch Strategy

| Branch      | Purpose      |
| ----------- | ------------ |
| `main`      | Production   |
| `develop`   | Development  |
| `feature/*` | New features |
| `fix/*`     | Bug fixes    |

### PR Checklist

- [ ] Biome checks pass (`npm run check`)
- [ ] Tests pass (`npm run test`)
- [ ] No raw gray-\* colors (use semantic tokens)
- [ ] SSR-safe (no `window`/`document` at top level)
- [ ] Accessibility verified

---

## Documentation Index

| Document                           | Description                |
| ---------------------------------- | -------------------------- |
| `README.md`                        | This file                  |
| `docs/development/contributing.md` | Contribution guidelines    |
| `CHANGELOG.md`                     | Version history            |
| `docs/development/styling.md`      | CSS architecture & Styling |
| `docs/api/endpoints.md`            | API documentation          |
| `docs/development/3d-pipeline.md`  | 3D Asset Pipeline & Visualization |
| `docs/testing/testing-e2e-prod.md` | E2E testing guide          |
| `docs/operations/`                 | Operational runbooks       |
| `docs/core/ssr-invariants.md`      | SSR safety rules           |

---

## Operational Runbooks

Incident response procedures for production issues:

| Runbook | Trigger |
| ------- | ------- |
| [`incident-response.md`](./docs/runbooks/incident-response.md) | SEV-1/2 Incidents |
| [`database-outage.md`](./docs/runbooks/database-outage.md) | DB Connection Failures |
| [`deployment-rollback.md`](./docs/runbooks/deployment-rollback.md) | Failed Deployments |
| [`circuit-breaker-trip.md`](./docs/runbooks/circuit-breaker-trip.md) | Service Degradation |
| [`rate-limit-surge.md`](./docs/runbooks/rate-limit-surge.md) | Traffic Spikes |
| [`sentry-alert-triage.md`](./docs/runbooks/sentry-alert-triage.md) | Error Alert Triage |

---

## License

Proprietary - All rights reserved.

---

_Last updated: January 2026_  
_CSS Architecture Score: 10/10_  
_Performance Score: 92/100_

## Troubleshooting

### Process Management / Port Conflicts

If you encounter "Address already in use" errors or find multiple node processes running:

1. **Automatic Fix**: The `npm run dev` script now attempts to kill port 5002 automatically.
2. **Manual Cleanup**:

   ```bash
   # Kill all node processes
   pkill -f node

   # Or kill specific port
   npx kill-port 5002
   ```

3. **Zombie Processes**: If the server restarts infinitely, ensure your `tsx watch` ignore patterns are correct (should ignore `dist`, `.cache`, `../client`).
4. **High System Load**:
   - The project uses `tsx watch` for the backend and `vite` for the frontend.
   - To reduce load, `ENABLE_PERFORMANCE_MONITORING` and `ENABLE_CACHE_WARMING` are disabled by default in `.env`.
   - The backend `dev` script in `server/package.json` explicitly ignores `../client` to prevent unnecessary restarts.
