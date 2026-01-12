# RUN Apparel B2B Platform

A modern B2B e-commerce platform for athletic apparel manufacturing, built with **React 19 (Stable)**, **Express 5.1**, **Tailwind CSS v4 (Stable)**, and **React Router 7** (formerly Remix).

---

## Table of Contents

- [Overview](#overview)
- [System Context](#system-context)
- [Architecture Guide](#architecture-guide)
- [Tech Stack](#tech-stack)
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

## Tech Stack

> For exact version numbers, see [docs/overview.md](./docs/overview.md) (Single Source of Truth).

| Layer             | Technology               |
| ----------------- | ------------------------ |
| **Frontend**      | React 19, Vite 7         |
| **Styling**       | Tailwind CSS v4          |
| **Server**        | Express 5, Node 24       |
| **Database**      | PostgreSQL + Drizzle ORM |
| **State**         | TanStack Query           |
| **Routing**       | React Router 7           |
| **Components**    | shadcn/ui + Radix        |
| **Linting**       | Biome                    |
| **Testing**       | Vitest, Playwright       |
| **Observability** | Sentry, OpenTelemetry    |

---

## Quick Start

### Prerequisites

- Node.js 24 (LTS)
- PostgreSQL database
- npm

### Installation

````bash
# 1. Clone repository
git clone <repository-url>
cd RUN-Remix

# 2. Install dependencies
npm install

# 3. Environment Setup

Create `.env` file from example:
```bash
cp .env.example .env
````

> **Security Note:** In production, secrets are loaded automatically from Google Secret Manager. Ensure the Cloud Run service account has `Secret Accessor` role.

### 4. Push database schema

```bash
npm run db:push
```

### 5. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5001`. For Docker environments (via `docker-compose`), it also runs on `http://localhost:5001`.

### 6. Verify Integrity

```bash
npm run verify:tech-integrity
```

### Environment Variables

Create a root `.env` file following the structure in `.env.example`.

**Root (`.env`):**

```bash
# Server Configuration
PORT=5001 # 5001 for Local Dev, 5000 for Docker/Container
NODE_ENV=development

# ... (Rest of variables)
```

---

## Project Structure

The project is structured as a **Monorepo** using NPM Workspaces:

```text
RUN-Remix/
├── client/ (@run-remix/client) # Frontend application (React 19, Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── admin/
│   │   │   ├── homepage/
│   │   │   └── products/
│   │   ├── pages/
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

### Development Scripts

```bash
npm run dev              # Start dev server (port 5001)
npm run check            # Typecheck (tsc) + Biome lint
npm run check:apply      # Biome lint + auto-fix
npm run lint             # Biome lint only
npm run lint:html        # HTML validation
```

### Build Scripts

```bash
npm run build            # Full production build (Required before start)
npm run build:client     # Build client with SSR manifest
npm run build:ssr        # Build SSR entry
npm run build:server     # TypeScript compile + esbuild bundle
npm run start            # Start production server (Delegates to @run-remix/server)
```

### Database Scripts

```bash
npm run db:push          # Push schema to database
```

### Testing Scripts

```bash
npm run test             # Unit tests (vitest)
npm run test:integration # Integration tests (Server spawn)
npm run test:e2e         # Playwright E2E (regression)
npm run test:integration:full # Full integration tests with Docker DB
```

### Verification Scripts

```bash
npm run check:bundle     # Verify bundle limits
npm run verify:ssr       # Verify SSR invariants (Test Suite)
npm run verify:tech-integrity # Full integrity check (build + audit)
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
client/src/
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
- **Configuration**: `client/src/wdyr.ts` (excluded from production)

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

- **Development**: `http://localhost:5001/api`
- **Docker/Container**: `http://localhost:5001/api`
- **Production**: `https://api.runapparel.com/api`

### API Documentation (`/api/docs`)

The platform includes auto-generated OpenAPI 3.0 documentation.

1. Start the server: `npm run dev`
2. Visit: `http://localhost:5001/api/docs`

This provides an interactive Swagger UI to test all endpoints.

### Authentication Flow

All routes are secured via centralized `AuthService`.

- **Admin Routes**: Require `authService.requireAdmin` middleware.
- **Session**: Managed via PostgreSQL-backed sessions (`connect-pg-simple`).
- **Authorization**: Role-based access control (RBAC) with caching.

### Key Endpoints

| Endpoint            | Method   | Description        |
| ------------------- | -------- | ------------------ |
| `/api/products`     | GET      | List all products  |
| `/api/products/:id` | GET      | Get single product |
| `/api/categories`   | GET      | List categories    |
| `/api/media`        | GET/POST | Media library      |
| `/api/contact`      | POST     | Contact form       |
| `/api/health`       | GET      | Health check       |
| `/api/health/db`    | GET      | Database health    |

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
k6 run --env BASE_URL=http://localhost:5001 ops/load-testing/baseline.js
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

1. **Automatic Fix**: The `npm run dev` script now attempts to kill port 5001 automatically.
2. **Manual Cleanup**:

   ```bash
   # Kill all node processes
   pkill -f node

   # Or kill specific port
   npx kill-port 5001
   ```

3. **Zombie Processes**: If the server restarts infinitely, ensure your `tsx watch` ignore patterns are correct (should ignore `dist`, `.cache`).
