# RUN Apparel B2B Platform

A modern B2B e-commerce platform for athletic apparel manufacturing, built with **React 19 (Stable)**, **Express 5.1**, **Tailwind CSS v4 (Stable)**, and TypeScript.

---

## Table of Contents

- [Overview](#overview)
- [CodeMap (System Map)](#codemap-system-map)
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

## CodeMap (System Map)

For a high-level visual guide to how the system works, including architecture diagrams, data flows, and directory maps, please see:

👉 **[CODEMAP.md](./CODEMAP.md)** 👈

Use this map to orient yourself before diving into specific files.

---

## Tech Stack

| Layer             | Technology               | Version       |
| ----------------- | ------------------------ | ------------- |
| **Frontend**      | React                    | 19.0 (Stable) |
| **Build Tool**    | Vite                     | 6.0.0         |
| **Styling**       | Tailwind CSS             | 4.0 (Stable)  |
| **Server**        | Express                  | 5.1 (Stable)  |
| **Database**      | PostgreSQL + Drizzle ORM | Latest        |
| **State**         | TanStack Query           | 5.x           |
| **Routing**       | React Router             | 7.x           |
| **Components**    | shadcn/ui + Radix        | Latest        |
| **Linting**       | Biome                    | 2.3+          |
| **Runtime**       | Node.js                  | 20+           |
| **E2E Testing**   | Playwright               | Latest        |
| **Observability** | Sentry                   | Latest        |
| **Caching**       | LRU + Upstash Redis (L2) | Latest        |
| **Documentation** | OpenAPI / Swagger        | 3.0           |
| **Testing**       | Vitest + Supertest       | Latest        |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm (pnpm also supported)

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

The app will be available at `http://localhost:5001` (Dev) or `http://localhost:5000` (Docker).

3. **Verify Integrity:**
   ```bash
   npm run verify:tech-integrity
   ```

### Environment Variables

Create a `server/.env` file (for the backend) and a `.env` file (for the frontend, if needed).

**Server (`server/.env`):**

```bash
# Server Configuration
PORT=5001 # 5001 for Local Dev, 5000 for Docker/Container
NODE_ENV=development

# ... (Rest of variables)
```

---

## Project Structure

The project is structured as a **Monorepo** using NPM Workspaces:

````
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
├── scripts/                    # Build & verification scripts
├── docs/                       # Documentation
└── tests/                      # Test suites
```
├── scripts/                   # Build & verification scripts
│   ├── verify-ssr-template.ts
│   └── check-ssr-invariants.js
│
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── runbooks/              # Operational guides
│   └── testing/               # Testing guides
│
└── tests/                     # Test suites
    ├── e2e/                   # Playwright E2E tests
    └── integration/           # Integration tests
````

---

## npm Scripts

### Development

```bash
npm run dev              # Start dev server (port 5001)
npm run check            # Biome lint check
npm run check:apply      # Biome lint + auto-fix
npm run lint             # Biome lint only
npm run lint:html        # HTML validation
```

### Build

```bash
npm run build            # Full production build
npm run build:client     # Build client with SSR manifest
npm run build:ssr        # Build SSR entry
npm run build:server     # TypeScript compile + esbuild bundle
npm run start            # Start production server
```

### Database

```bash
npm run db:push          # Push schema to database
```

### Testing

```bash
npm run test             # Unit tests (vitest)
npm run test:integration # Integration tests
npm run test:e2e         # Playwright E2E (regression)
```

### Verification

```bash
npm run verify:build     # Verify build output and typecheck
npm run verify:tech-integrity # Full integrity check (build + audit)
```

---

## Performance Metrics

### Performance Benchmarks

_Post React 19 + Vite 6 + Tailwind v4 migration (Dec 2025)_

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

See `docs/CSS_ARCHITECTURE.md` and `client/src/design-system.md` for details.

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
| **Security**    | Trivy    | -              | `trivy filesystem .`                 |

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

### Verification

```bash
npm run verify:ssr           # Full SSR verification
npm run check:invariants     # Check SSR invariants only
npx tsx scripts/verify-ssr-template.ts  # Template verification
```

---

## API Reference

### Base URL

- **Development**: `http://localhost:5001/api`
- **Docker/Container**: `http://localhost:5000/api`
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

1. Read `CONTRIBUTING.md`
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

| Document                      | Description              |
| ----------------------------- | ------------------------ |
| `README.md`                   | This file                |
| `CONTRIBUTING.md`             | Contribution guidelines  |
| `CHANGELOG.md`                | Version history          |
| `docs/CSS_ARCHITECTURE.md`    | CSS architecture (10/10) |
| `client/src/design-system.md` | Design token reference   |
| `docs/STYLING_GUIDE.md`       | Styling best practices   |
| `docs/api/endpoints.md`       | API documentation        |
| `docs/testing/e2e.md`         | E2E testing guide        |
| `docs/testing/A11Y.md`        | Accessibility guide      |
| `docs/runbooks/`              | Operational runbooks     |
| `docs/ssr-invariants.md`      | SSR safety rules         |

---

## License

Proprietary - All rights reserved.

---

_Last updated: December 2025_  
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
