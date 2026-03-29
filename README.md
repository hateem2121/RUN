# RUN Remix Ecosystem

**Version:** 3.0.0 | **Port:** 5002 (Exclusively) | **Last Updated:** March 2026

[![Node 24+](https://img.shields.io/badge/Node-24%2B-339933?logo=node.js)](https://nodejs.org)
[![React 19](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev)
[![Tailwind V4](https://img.shields.io/badge/Tailwind-V4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express 5](https://img.shields.io/badge/Express-5.1.0-000000?logo=express)](https://expressjs.com)
[![Port 5002](https://img.shields.io/badge/Port-5002-FF6B6B)](./docs/core/port-5002-architecture.md)

---

## What This Is

**RUN Remix** is a B2B Premium 3D Sportswear Configurator and Manufacturing Platform built for **RUN APPAREL (PVT) LTD** — a sustainable sportswear manufacturer based in Sialkot, Pakistan, and a subsidiary of Durus Industries (est. 1889).

The platform combines heritage craftsmanship with advanced agentic engineering, delivering a premium glassmorphism UI with real-time 3D product configuration, a full admin CMS, and a deterministic CI/CD pipeline built on the **B.L.A.S.T. protocol**.

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd RUN-RUN-PROD

# Install all workspace dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in DATABASE_URL, UPSTASH_REDIS_REST_URL, GOOGLE_CLIENT_ID, SESSION_SECRET, etc.

# Verify the full tech stack
npm run verify:tech-integrity

# Start the development server (port 5002)
npm run dev:server
```

Open **http://localhost:5002** — admin panel at **http://localhost:5002/admin**.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | React | 19.2.4 | Functional only. No `forwardRef`. Named exports only. |
| Build | Vite | 7.0.0 | Port 5002 exclusively. |
| Styling | Tailwind CSS | V4 | `@utility` syntax. No arbitrary values in JSX. |
| Language | TypeScript | Strict | No `any`. Explicit return types on all functions. |
| Backend | Express | 5.1.0 | Async-native. No `try/catch` in route handlers. |
| Runtime | Node.js | ≥ 24 | |
| ORM | Drizzle ORM | 0.45.1 | Neon serverless HTTP driver only. |
| Database | Neon Serverless PostgreSQL | — | `@neondatabase/serverless` HTTP driver. |
| Cache | Upstash Redis | — | Two-tier: L1 (`lru-cache`) + L2 (Upstash). |
| 3D | `@google/model-viewer` | — | `LazyUnifiedModelViewer` required. **Never** `@react-three/fiber`. |
| Animation | GSAP 3 | 3.14+ | `@gsap/react` + ScrollTrigger. Locomotive Scroll. |
| State | Zustand | 5 | |
| Data Fetching | TanStack Query | 5 | |
| Forms | React Hook Form + Zod | — | Always validate with Zod schemas. |
| Auth | Google OAuth 2.0 | — | Session stored in Upstash Redis. |
| Testing | Vitest | — | Not Jest. 80%+ coverage on services. |
| Linting | Biome | — | Not ESLint or Prettier. |
| Icons | Lucide React | — | Only. |
| CI/CD | GitHub Actions + Cloud Build | — | 22 workflows. Cloud Run canary deploy. |

---

## Project Structure

```
/
├── client/                   # React 19 + Vite 7 + Tailwind V4
│   └── app/
│       ├── routes/           # File-based routing (React Router 7)
│       ├── components/
│       │   ├── ui/           # Generic reusable (Radix-based)
│       │   ├── admin/        # Admin-only
│       │   └── [domain]/     # Domain-specific (products/, categories/)
│       ├── hooks/            # Custom React hooks
│       ├── stores/           # Zustand state
│       └── services/         # API clients
├── server/                   # Express 5 + Node 24
│   ├── routes/               # THIN — call services, return responses
│   ├── services/             # THICK — all business logic lives here
│   ├── lib/
│   │   ├── db/               # Drizzle + Neon repositories
│   │   ├── cache/            # L1/L2 cache implementation
│   │   ├── resilience/       # Circuit breakers, rate limiting
│   │   └── monitoring/       # OTel, Sentry, Prometheus
│   └── middleware/           # Express middleware (30+ files)
├── shared/                   # Shared TypeScript types & Zod schemas
├── docs/
│   ├── core/sops/            # Standard Operating Procedures
│   ├── adr/                  # 16 Architecture Decision Records
│   ├── api/                  # API reference
│   ├── runbooks/             # Incident response runbooks
│   └── security/             # Threat model, pen test policy
├── .agent/
│   ├── rules/                # 5 always-on Claude Code rule files
│   ├── skills/               # 21 project skills (SKILL.md format)
│   └── workflows/            # 3 workflow guides
├── .github/
│   ├── workflows/            # 22 CI/CD workflow files
│   └── ISSUE_TEMPLATE/       # Bug report and feature request templates
├── scripts/                  # Verification and utility scripts
├── gemini.md                 # Project Constitution (AntiGravity v3.0)
├── CLAUDE.md                 # Claude Code project constitution
├── task_plan.md              # Active task memory
└── findings.md               # Active findings memory
```

---

## Key Commands

```bash
# Development
npm run dev:server            # Full stack dev server on port 5002
npm run dev:client            # Client only

# Code Quality (run before every commit)
npm run check:apply           # Biome format + lint (auto-fix)
npm run typecheck             # TypeScript strict check (0 errors required)
npm run verify:tech-integrity # Full system integrity check (must exit 0)

# Testing
npm run test                  # Vitest unit/integration tests
npm run test:coverage         # Coverage report (target: 80%+ on services)
npm run test:e2e              # Playwright E2E tests

# Database
npm run migrate:deploy        # Run Drizzle migrations
npm run verify:connect        # Verify Neon + Upstash + Email connections

# Build & Deploy
npm run build                 # Turborepo production build
npm run start                 # Start production server (port 5002)
npm run build:analyze         # Bundle size analysis
```

---

## Hard Constraints

These are non-negotiable. Every PR is checked against them.

1. **Port 5002** — Every service, every time. No exceptions.
2. **`@google/model-viewer` only** — Never import `@react-three/fiber`, `@react-three/drei`, or `useGLTF`.
3. **No `any` in TypeScript** — Use proper types or `unknown` with type guards.
4. **No `forwardRef`** — React 19 uses raw ref props.
5. **No `try/catch` in Express 5 route handlers** — Express 5 handles async errors natively.
6. **No arbitrary Tailwind values in JSX** — Define custom values in the `@utility` layer.
7. **No business logic in routes** — Routes call services; services contain the logic.
8. **No Jest** — Use Vitest.
9. **No ESLint/Prettier** — Use Biome (`npm run check:apply`).
10. **`npm run verify:tech-integrity` must exit 0** before any task is declared complete.

---

## 3D Pipeline

- Use `LazyUnifiedModelViewer` for **all** public-facing 3D renders (lazy-loads the 1MB+ engine).
- Models must be optimized GLB files under 5MB.
- 3D assets live in `client/public/assets/models/`.
- Full guide: [`docs/workflows/3d-integration.md`](./.agent/workflows/3d-integration.md)

```tsx
// Correct
import { LazyUnifiedModelViewer } from '@/components/ui/LazyUnifiedModelViewer';

// Never
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
```

---

## Authentication

Authentication uses **Google OAuth 2.0** exclusively. No email/password login.

- Sessions stored in **Upstash Redis** (serverless, cross-instance consistency).
- Session ID rotation every 15 minutes.
- Secure, HttpOnly, SameSite cookies.
- All `/admin/*` routes protected by auth middleware.

Configure in `.env`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
```

---

## Deployment

Production deploys via **Google Cloud Run** using a canary promotion strategy:

```
Commit → GitHub Actions CI → Cloud Build → 0% traffic → 10% → 50% → 100%
```

Key files:
- `cloudbuild.yaml` — Cloud Build pipeline
- `.github/workflows/deploy.yml` — Deploy trigger
- `.github/workflows/ci.yml` — Quality gates (lint, typecheck, Neon branch, migration, coverage)

Canary rollback triggers automatically if error rate exceeds threshold. See [`docs/core/sops/SOP_ROLLBACK.md`](./docs/core/sops/SOP_ROLLBACK.md).

---

## Testing

| Type | Tool | Target |
|------|------|--------|
| Unit / Integration | Vitest | 80%+ coverage on `server/services/` |
| E2E | Playwright | Critical user flows |
| Visual Regression | Playwright baselines | `.github/workflows/visual-regression.yml` |
| Performance | Lighthouse CI | LCP, INP, CLS budgets |
| Security | Trivy + DAST | `.github/workflows/security-scanning.yml` |

```bash
npm run test                  # All unit tests
npm run test:coverage         # Coverage report
npm run test:e2e              # Playwright E2E
```

---

## B.L.A.S.T. Protocol

Every feature follows the B.L.A.S.T. build methodology:

| Step | Meaning | Action |
|------|---------|--------|
| **Blueprint** | Vision first | Define schemas in `shared/`, SOPs in `docs/core/sops/` |
| **Link** | Handshake | Verify APIs and `.env` via `scripts/` atomics |
| **Architect** | The Build | L1 SOPs → L2 Navigation → L3 Tools |
| **Stylize** | The Wow | Apply 5D Design: Skeleton, Skin, Palette, Voice, Soul |
| **Trigger** | Deploy | Automation via CI/CD pipelines |

Every task must start by updating `task_plan.md` and end by updating `findings.md`.

---

## Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Main Bundle | < 100KB gzipped | Verified ~92KB |
| Route Chunks | < 50KB each | |
| Total Initial Load | < 300KB | |
| Public API p95 | < 100ms | L1/L2 cache strategy |
| Admin API p95 | < 500ms | |
| LCP | < 2.5s | Hero preloaded via `fetchPriority="high"` |

L1/L2 caching strategy: `lru-cache` (< 1ms) → Upstash Redis (5–30ms) → Neon (database).

---

## Documentation

| Resource | Location |
|----------|---------|
| Architecture Decision Records | [`docs/adr/`](./docs/adr/) |
| Standard Operating Procedures | [`docs/core/sops/`](./docs/core/sops/) |
| API Reference | [`docs/api/`](./docs/api/) |
| Incident Runbooks | [`docs/runbooks/`](./docs/runbooks/) |
| Security & Threat Model | [`docs/security/`](./docs/security/) |
| Coding Standards | [`docs/CODING_STANDARDS.md`](./docs/CODING_STANDARDS.md) |
| Observability & Monitoring | [`docs/observability/`](./docs/observability/) |
| Claude Code Constitution | [`CLAUDE.md`](./CLAUDE.md) |
| Project Constitution | [`gemini.md`](./gemini.md) |

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full guide.

Quick checklist before every push:

```bash
npm run check:apply           # Format and lint
npm run typecheck             # Zero TypeScript errors
npm run verify:tech-integrity # Must exit 0
npm run test                  # Tests must pass
```

- Push directly to `main` (internal team).
- Use Biome, not ESLint or Prettier.
- Follow B.L.A.S.T.: update `task_plan.md` before starting, `findings.md` after finishing.
- Never introduce `@react-three/fiber`, `any` types, `forwardRef`, or `try/catch` in Express handlers.

---

## Environment Variables

Key variables required in `.env` (see `.env.example` for full list):

```bash
PORT=5002
DATABASE_URL=...              # Neon serverless PostgreSQL
DIRECT_DATABASE_URL=...       # Neon direct (for LISTEN/NOTIFY)
UPSTASH_REDIS_REST_URL=...    # Upstash Redis
UPSTASH_REDIS_REST_TOKEN=...  # Upstash auth
GOOGLE_CLIENT_ID=...          # Google OAuth2
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...            # Session signing
SENTRY_DSN=...                # Error tracking
OTEL_EXPORTER_OTLP_ENDPOINT=... # Distributed tracing
```

---

## Security

To report a security vulnerability, see [`SECURITY.md`](./SECURITY.md).

Security tools in use: Trivy, GitHub secret scanning, DAST (`dast-scan.yml`), `npm audit`.

---

## License

Copyright © 2026 RUN APPAREL (PVT) LTD / Durus Industries. All rights reserved.

This is proprietary software. Unauthorized use, reproduction, or distribution is prohibited.
See [`LICENSE`](./LICENSE) for full terms.
