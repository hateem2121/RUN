# RUN Apparel B2B Platform

A modern B2B e-commerce platform for athletic apparel manufacturing, built with React 19, Express 5, Tailwind v4, and TypeScript.

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

| Layer             | Technology               | Version |
| ----------------- | ------------------------ | ------- |
| **Frontend**      | React                    | 19.0    |
| **Build Tool**    | Vite                     | 7.x     |
| **Styling**       | Tailwind CSS             | 4.0     |
| **Server**        | Express                  | 5.x     |
| **Database**      | PostgreSQL + Drizzle ORM | Latest  |
| **State**         | TanStack Query           | 5.x     |
| **Routing**       | Wouter                   | Latest  |
| **Components**    | shadcn/ui + Radix        | Latest  |
| **Linting**       | Biome                    | 2.3+    |
| **Runtime**       | Node.js                  | 22+     |
| **E2E Testing**   | Playwright               | Latest  |
| **Observability** | Sentry                   | Latest  |

---

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL database
- npm (pnpm also supported)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd RUN-Remix

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5001`

### Environment Variables

Create a `.env` file with the following:

```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
SESSION_SECRET=your-secret-key-here

# Sentry Observability (Optional)
SENTRY_DSN=https://...@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=sntry_token_...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Rate Limiting - Redis (Optional, falls back to in-memory)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# GCP Storage (Required for media uploads)
GCS_BUCKET_NAME=your-bucket
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

---

## Project Structure

```
RUN-Remix/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui components (94 files)
│   │   │   ├── admin/         # Admin panel components
│   │   │   ├── homepage/      # Landing page sections
│   │   │   └── products/      # Product display components
│   │   ├── pages/             # Route pages (46 files)
│   │   ├── lib/               # Utilities & hooks
│   │   │   ├── utils.ts       # cn() utility
│   │   │   └── design-tokens.ts # Type-safe token exports
│   │   ├── hooks/             # Custom React hooks
│   │   └── index.css          # Global styles (931 lines)
│   └── index.html             # SSR template
│
├── server/                    # Backend application
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic
│   └── db/                    # Database config
│
├── shared/                    # Shared types & schemas
│   └── schema.ts              # Drizzle schema + Zod types
│
├── scripts/                   # Build & verification scripts
│   ├── verify-ssr-template.ts
│   ├── verify-build.cjs
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
```

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
npm run build:server     # TypeScript compile server
npm run build:express    # esbuild bundle for production
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
npm run test:a11y        # Accessibility tests
npm run test:e2e:prod    # E2E against production
npm run test:lighthouse  # Lighthouse CI
npm run test:performance # Performance benchmarks
```

### Verification

```bash
npm run verify:build     # Verify build output
npm run verify:serving   # Verify production serving
npm run verify:sourcemaps # Verify source maps
npm run verify:ssr       # Verify SSR invariants
npm run verify:release   # Full release verification
npm run ci:checks        # All CI checks
```

---

## Performance Metrics

_Post React 19 + Vite 7 + Tailwind v4 migration (Dec 2025)_

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

```
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

See `DOCS-CSS-ARCHITECTURE.md` and `client/src/design-system.md` for details.

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
- **Production**: `https://api.runapparel.com/api`

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

## Testing

### Test Commands

```bash
npm run test             # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E regression
npm run test:a11y        # Accessibility
npm run test:lighthouse  # Performance
npm run test:e2e:prod    # Production E2E
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

```
dist/
├── public/              # Static assets
│   └── assets/          # Bundled CSS/JS
├── ssr/                  # SSR bundle
└── index.js             # Express server
```

### Release Verification

```bash
npm run verify:release   # Full release checks
```

This runs:

1. Production build
2. Router verification
3. Duplicate detection
4. Visual regression E2E tests

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
| `DOCS-CSS-ARCHITECTURE.md`    | CSS architecture (10/10) |
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
