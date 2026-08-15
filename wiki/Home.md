# Welcome to the RUN APPAREL Wiki 🏭

**RUN APPAREL (PVT) LTD** — *Sialkot, Pakistan* | Subsidiary of **Durus Industries** (est. 1889)

[![Version](https://img.shields.io/badge/CMS-v4.1.2-blue?style=flat-square)](./Release-Notes)
[![Architecture](https://img.shields.io/badge/Architecture_Health-100%2F100-brightgreen?style=flat-square)](./Architecture)
[![Node](https://img.shields.io/badge/Node-24%2B-339933?style=flat-square&logo=node.js)](./Tech-Stack)
[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?style=flat-square&logo=react)](./Tech-Stack)
[![Port](https://img.shields.io/badge/Port-5002-orange?style=flat-square)](./Getting-Started)

> **RUN Remix** is the production-grade CMS and B2B e-commerce platform powering RUN APPAREL's premium sustainable sportswear manufacturing business. This wiki serves as the **evergreen knowledge hub** — covering architecture, roadmap, operations, and developer onboarding.

> [!NOTE]
> This wiki supplements the in-repo `docs/` directory. Versioned technical specs live in `docs/`; this wiki covers high-level architecture, roadmaps, operational guides, and cross-cutting concerns that evolve independently of code releases.

---

## Quick Navigation

| 🏛️ Architecture & Tech | ⚡ Agentic Factory | 🔒 Security & Ops | 🚀 Developer Hub |
| :--- | :--- | :--- | :--- |
| [System Architecture](./Architecture) | [B.L.A.S.T. Protocol](./BLAST-Protocol) | [Security Model](./Security-Model) | [Getting Started](./Getting-Started) |
| [Visual Gallery (12 Diagrams)](./Visual-Architecture) | [Agent Roles & Ethos](./Agent-Directory) | [CSRF Protection](./CSRF-Protection) | [Development Workflow](./Workflow) |
| [Tech Stack Reference](./Tech-Stack) | [SOPs & Runbooks](./SOPs) | [Disaster Recovery](./Disaster-Recovery) | [Coding Standards](./Coding-Standards) |
| [ADR Index](./ADR-Index) | [Design System](./Design-System) | [Multi-Region Strategy](./Multi-Region) | [Troubleshooting](./Troubleshooting) |
| [API & Error Specs](./API-Reference) | [Route Manifest](./Route-Manifest) | [Observability (OTel)](./Observability) | [Contributing](./Contributing) |
| [Data Models (ERD)](./Data-Models) | | | |

---

## Project Identity

**RUN Remix** is **not** a generic CMS. It is an **Agentic Software Factory** — a fully staffed virtual engineering organisation operating inside a single monorepo. Heritage craftsmanship meets advanced agentic engineering to ship production-grade software at 10× velocity.

### Core Principles (from the [Factory Manifesto](./Ethos))

1. **Vision First (Blueprint)** — Reasoning in markdown precedes logic in TypeScript. We build "The Why" before "The How."
2. **Physical Excellence (The Wow)** — Software must reflect the quality of the garments we manufacture. Every interaction is premium, responsive, and visually stunning.
3. **Absolute Integrity (Non-Negotiable)** — Vulnerabilities, slop, and `any` types are unacceptable. Zero tolerance for technical debt.
4. **Continuous Evolution (Evolve)** — The factory learns from every sprint. Every retrospective patches a process and updates an SOP.

---

## System Status & Health Matrix

> **Last Verified:** 15 August 2026

| Parameter | Current | Target | Status |
| :--- | :--- | :--- | :--- |
| **CMS Version** | `v4.1.2` | Semantic Release | 🟢 Stable |
| **Architecture Health Score** | **100 / 100** | $\geq 95$ | 🟢 Impeccable |
| **Test Suites** | 170+ files · 2,612 tests | $\geq 80\%$ service coverage | 🟢 Passing |
| **TypeScript & Biome** | 0 errors / 1,015 files | 0 errors | 🟢 Clean |
| **AI Slop Detector (`detect.mjs`)** | 0 anti-patterns | 0 anti-patterns | 🟢 Clean |
| **Dedicated Port** | `5002` (hardcoded) | Never 3000 | 🟢 Enforced |
| **Heuristic Critique Score** | 40 / 40 | $\geq 36$ | 🟢 Perfect |

---

## System Architecture

> [!TIP]
> **High-Fidelity Editorial Diagrams**: Access the complete set of 12 vector-rendered, self-contained SVG diagrams in the [Visual Architecture Gallery](./Visual-Architecture) or open the interactive tabbed viewer at [`wiki/diagrams/index.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/index.html).

### C4 Context Diagram

The platform follows a **decoupled, SSR-native** architecture with strict workspace boundaries:

```mermaid
C4Context
    title RUN Remix — System Context (C4 Level 1)

    Person(user, "B2B Client / Admin", "Browser on Port 5002")

    System_Boundary(platform, "RUN Remix Platform") {
        Container(client, "React 19 Client", "Vite 8 · React Router v8 · Tailwind v4", "SSR SPA with file-based routing")
        Container(server, "Express 5 API", "Node 24 · Drizzle ORM · neverthrow", "REST API & business logic")
        Container(shared, "@run-remix/shared", "TypeScript 6 · Zod v4 · Drizzle", "Schemas, types, route manifest")
    }

    System_Ext(google_auth, "Google OAuth 2.0", "Authentication Provider")
    System_Ext(neon, "Neon Serverless Postgres", "Primary Data Store")
    System_Ext(redis, "Redis (ioredis)", "L2 Cache & Session Store")
    System_Ext(gcs, "Google Cloud Storage", "Media CDN")
    System_Ext(cloud_tasks, "Google Cloud Tasks", "Background Job Queue")
    System_Ext(erp, "External B2B APIs", "Logistics & ERP via Opossum")

    Rel(user, client, "Uses", "HTTPS")
    Rel(client, server, "API Requests", "JSON/REST")
    Rel(client, gcs, "Loads Assets", "HTTPS")
    Rel(server, neon, "Reads/Writes", "HTTP Driver")
    Rel(server, redis, "Cache/Session", "TCP")
    Rel(server, google_auth, "Authenticates", "OAuth 2.0")
    Rel(server, cloud_tasks, "Enqueues Jobs", "HTTPS")
    Rel(server, erp, "Circuit Breaker", "HTTPS")
```

### Monorepo Structure

```mermaid
graph LR
    subgraph Monorepo["run-remix/ (Turborepo + npm Workspaces)"]
        direction TB
        CLIENT["client/<br/>React 19 · Vite 8<br/>React Router v8"]
        SERVER["server/<br/>Express 5 · Drizzle<br/>neverthrow Services"]
        SHARED["shared/<br/>@run-remix/shared<br/>Zod v4 · Route Manifest"]
    end

    CLIENT -->|"imports types & schemas"| SHARED
    SERVER -->|"imports types & schemas"| SHARED
    CLIENT x--x|"NEVER imports"| SERVER
    SERVER x--x|"NEVER imports"| CLIENT
    SHARED x--x|"NEVER imports React/Express"| CLIENT
    SHARED x--x|"NEVER imports React/Express"| SERVER

    style CLIENT fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    style SERVER fill:#dcfce7,stroke:#22c55e,color:#14532d
    style SHARED fill:#fef3c7,stroke:#f59e0b,color:#78350f
```

> [!IMPORTANT]
> **Import boundary is sacred.** Deep imports into `@run-remix/shared/schemas/*` are prohibited. Always use the barrel export: `import { ... } from "@run-remix/shared"`.

### Server Layered Architecture

```mermaid
graph TB
    subgraph Express5["Express 5 Server (Port 5002)"]
        direction TB
        MW["Middleware Layer<br/>CSRF · RBAC · Rate Limiter<br/>Correlation ID · SSR Cache"]
        ROUTES["Route Handlers (Thin Controllers)<br/>Validate → Call Service → Respond"]
        SERVICES["Service Layer (neverthrow)<br/>All Business Logic<br/>ResultAsync&lt;T, E&gt;"]
        REPOS["Repository Layer<br/>Drizzle ORM · Parameterized Queries"]
    end

    MW --> ROUTES
    ROUTES --> SERVICES
    SERVICES --> REPOS
    REPOS --> NEON[("Neon Postgres")]
    SERVICES --> CACHE["Two-Tier Cache<br/>L1: lru-cache<br/>L2: ioredis"]
    SERVICES --> GCT["Google Cloud Tasks<br/>Background Workers"]
    SERVICES --> CB["Opossum Circuit Breaker<br/>External API Calls"]

    style MW fill:#fce4ec,stroke:#e91e63,color:#880e4f
    style ROUTES fill:#e3f2fd,stroke:#2196f3,color:#0d47a1
    style SERVICES fill:#e8f5e9,stroke:#4caf50,color:#1b5e20
    style REPOS fill:#fff3e0,stroke:#ff9800,color:#e65100
```

> [!TIP]
> **Thin Controller Rule:** If a route handler contains an `if` statement with domain logic, a database call, or a data transformation — it is a violation. Move it to `server/services/`.

---

## Request Lifecycle

### Product Load — Full Data Flow

```mermaid
sequenceDiagram
    participant User as B2B Client
    participant Client as React Client (Vite 8)
    participant API as Express 5 API
    participant Cache as Redis (ioredis)
    participant DB as Neon Postgres

    User->>Client: Navigates to /categories/running
    Client->>Client: React Router v8 (Client Loader)
    Client->>API: GET /api/v1/categories/running/products

    API->>API: Middleware Chain (CSRF, Correlation ID, Session)

    API->>Cache: GET cache:categories:running:products
    alt Cache Hit (L2)
        Cache-->>API: JSON Data
    else Cache Miss
        API->>DB: SQL via Drizzle HTTP Driver
        DB-->>API: Result Rows
        API->>Cache: SETEX 300s (TTL 5 min)
    end

    API-->>Client: 200 OK { products: [...] }
    Client->>User: Renders Product Grid (Tailwind v4 @theme tokens)
```

### Admin Media Upload — Background Task Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant Client as React Admin Panel
    participant API as Express 5 API
    participant GCS as Google Cloud Storage
    participant Tasks as Google Cloud Tasks
    participant Worker as HTTP Worker

    Admin->>Client: Drops file in MediaLibrary
    Client->>API: POST /api/media/upload (Multer)
    API->>API: Validate file type/size + CSRF + RBAC
    API->>GCS: Stream upload to bucket
    API->>API: Create DB record (media_items)
    API->>Tasks: Enqueue optimisation job
    API-->>Client: 201 Created { id, url }

    Tasks->>Worker: POST /api/worker (verifyCloudTaskToken)
    Worker->>Worker: Image compression & thumbnail generation
    Worker->>GCS: Upload optimised variants
    Worker->>API: Update DB record
    Client->>Client: React Query cache invalidates ['media']
```

---

## Data Models (ERD)

Derived from `shared/schemas/` — the single source of truth for all data shapes.

```mermaid
erDiagram
    Users ||--o{ Sessions : "has sessions"
    Users {
        uuid id PK
        string email UK
        string role
        boolean is_admin
        json preferences
        timestamp deleted_at
    }

    Products }|--|{ Categories : "belongs to"
    Products ||--o{ Materials : "composed of"
    Products ||--o{ ProductRelations : "has related"
    Products ||--o{ Media : "visualised by"
    Products {
        uuid id PK
        string slug UK
        string name
        json price_data
        boolean approved
        timestamp deleted_at
    }

    Categories {
        uuid id PK
        string slug UK
        string name
        int level
    }

    Media {
        uuid id PK
        string url
        string type
        uuid product_id FK
    }

    Blog {
        uuid id PK
        string slug UK
        string title
        json content
        boolean published
    }

    SustainabilityMetrics ||--o{ MetricHistory : "tracks over time"
    SustainabilityMetrics {
        uuid id PK
        string name
        string category
        string current_value
    }

    MetricHistory {
        int id PK
        uuid metric_id FK
        string value
        timestamp recorded_at
    }
```

---

## CI/CD & Deployment Pipeline

### Cloud Build — Canary Rollout Strategy

```mermaid
graph LR
    subgraph CI["Google Cloud Build"]
        INSTALL["npm ci"] --> INTEGRITY["verify:tech-integrity"]
        INTEGRITY --> DOCS["check:docs"]
        DOCS --> BUILD["Docker Build<br/>(Multi-stage · Node 24 Alpine)"]
    end

    BUILD --> PUSH["Push to<br/>Container Registry"]
    PUSH --> MIGRATE["Drizzle DB Migration<br/>(runs BEFORE new code)"]
    MIGRATE --> CANARY["Deploy Canary<br/>(no traffic)"]
    CANARY --> HEALTH["Health Check<br/>/api/health × 5 retries"]
    HEALTH --> T10["Shift 10% Traffic"]
    T10 --> WAIT1["Monitor 30s"]
    WAIT1 --> T50["Shift 50% Traffic"]
    T50 --> WAIT2["Monitor 30s"]
    WAIT2 --> FULL["Full Rollout<br/>(--to-latest)"]

    style CANARY fill:#fff3e0,stroke:#ff9800
    style FULL fill:#e8f5e9,stroke:#4caf50
```

### Dockerfile Highlights

| Stage | Detail |
| :--- | :--- |
| **Builder** | `node:24-alpine` · `npm ci --include=dev` · `turbo run build` |
| **Runtime** | `node:24-alpine` · `npm ci --only=production` · Tini init · Non-root `USER node` |
| **Port** | `ENV PORT=5002` · `EXPOSE 5002` |
| **Healthcheck** | `node scripts/healthcheck.js` every 30s, 3 retries |

---

## Security Architecture

The platform implements **defence-in-depth** across all layers:

| Control | Implementation |
| :--- | :--- |
| **Authentication** | Google OAuth 2.0 (no email/password). Session rotation every 15 min. |
| **Sessions** | `DrizzleSessionStore` (Neon PostgreSQL). `HttpOnly` + `SameSite=strict` cookies. |
| **CSRF** | Double-Submit Cookie pattern. `crypto.timingSafeEqual` validation. |
| **Rate Limiting** | Redis-backed sliding-window rate limiter with tiered policies. |
| **Input Validation** | Zod v4 schemas on **all** external inputs. |
| **SQL Injection** | Drizzle ORM parameterized queries — no raw SQL permitted. |
| **Circuit Breakers** | `opossum` wrapping all external API and database calls. |
| **Error Handling** | `neverthrow` `ResultAsync<T, E>` — no raw `throw` or `try/catch` in services. |
| **Headers** | Helmet.js: strict CSP, HSTS, X-Frame-Options, nosniff. |
| **Secrets** | GCP Secret Manager references in `cloudbuild.yaml`. Never committed to git. |
| **CI Scanning** | `security.yml` pipeline: Trivy, secret scanning, `npm audit`. |
| **Container** | Non-root user, Alpine base, Tini init, healthchecks. |

### Authentication Flow (Google OAuth 2.0 + Sliding Sessions)

```mermaid
sequenceDiagram
    participant Browser as Client Browser
    participant API as Express API (:5002)
    participant Google as Google OAuth 2.0
    participant DB as Neon Postgres
    participant Redis as Redis (ioredis)

    Browser->>API: 01 · GET /api/login
    API->>Browser: 02 · 302 Redirect to Google Consent (state, nonce)
    Browser->>Google: 03 · User grants openid/profile consent
    Google->>API: 04 · GET /api/auth/google/callback?code=...
    API->>Google: 05 · Exchange code for tokens (POST /token)
    Google-->>API: 06 · Access token + verified profile
    API->>DB: 07 · Upsert user record (Drizzle ORM)
    API->>Redis: 08 · SET sess:{id} (15m rotation, UA bound)
    API-->>Browser: 09 · Set connect.sid (HttpOnly, SameSite=strict)
```

### Vulnerability Response SLAs

| Severity | Acknowledgment | Target Patch |
| :--- | :--- | :--- |
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium | 5 business days | 30 days |
| Low | 10 business days | Next release |

> [!CAUTION]
> **Never** open a public GitHub issue for security vulnerabilities. Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) or contact M. Hateem Jamshaid directly.

---

## Tech Stack Reference

| Layer | Technology | Version | Key Constraint |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | 24.15.0 | LTS only |
| **Frontend** | React + React Router v8 | 19.2.7 | No `forwardRef`. Named exports. |
| **Build** | Vite 8 (Rolldown bundler) | 8.0.10+ | Programmatic via `ssr-handler.ts` |
| **Language** | TypeScript | 6.0.3 | Strict mode. No `any`. |
| **Styling** | Tailwind CSS v4 | 4.2.4+ | `@theme` tokens only. `@utility` directive. No arbitrary values. |
| **Animations** | GSAP 3 + locomotive-scroll | 3.15 / 5.0.1 | No framer-motion or lenis. |
| **Backend** | Express 5 | 5.2.1 | Async-native. No `try/catch` in handlers. |
| **ORM** | Drizzle ORM + drizzle-zod | 0.45.2 | Parameterised queries only. |
| **Database** | Neon Serverless PostgreSQL | — | HTTP driver. Soft deletes mandatory. |
| **Schema** | Zod | 4.2.1+ | All schemas in `@run-remix/shared`. |
| **Error Handling** | neverthrow | — | `ResultAsync<T, E>`. Never `.unwrap()`. |
| **Sessions** | DrizzleSessionStore | — | No MemoryStore, no JWT in localStorage. |
| **Cache** | lru-cache (L1) + ioredis (L2) | — | No `@upstash/redis` or `connect-redis`. |
| **Background** | Google Cloud Tasks | — | HTTP workers via `verifyCloudTaskToken`. |
| **3D Viewer** | LazyUnifiedModelViewer | — | No `@react-three/fiber` or drei. |
| **Rich Text** | TipTap | 3.20.1+ | — |
| **Toasts** | sonner | 2.0.7+ | No custom implementations. |
| **Linting** | Biome | 2.3.10+ | No ESLint or Prettier. |
| **Testing** | Vitest + Playwright | — | 80%+ service coverage. |
| **Logging** | Pino | — | No `console.log` in server. |
| **Tracing** | OpenTelemetry | — | — |
| **Icons** | lucide-react (primary), @tabler/icons-react (secondary) | — | — |
| **CI/CD** | Google Cloud Build | — | Canary rollouts. |
| **Orchestration** | Google Cloud Run | — | Multi-region planned. |
| **Dev Port** | 5002 | **Hardcoded** | **Never 3000.** |

---

## Frontend-to-Admin Route Mapping

> [!IMPORTANT]
> **Architectural Invariant:** Every public page that renders CMS content MUST have a corresponding `/admin/:module` counterpart. Creating a public route without its admin pair is a violation.

| Public Route | Admin Route | API Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `/` | `/admin/dashboard` | `/api/dashboard/stats` | Homepage / Dashboard |
| `/products` | `/admin/products` | `/api/products` | Product Catalog |
| `/categories` | `/admin/categories` | `/api/categories` | Category Browser |
| `/blog` | `/admin/blog` | `/api/blog/posts` | Blog Listing |
| `/about` | `/admin/about` | `/api/pages/about` | About Page |
| `/contact` | `/admin/contact` | `/api/contact-info` | Contact Page |
| `/gallery` | `/admin/gallery` | `/api/media` | Media Gallery |
| `/manufacturing` | `/admin/manufacturing` | `/api/manufacturing/status` | Manufacturing Facilities |
| `/sustainability` | `/admin/sustainability` | `/api/sustainability` | Sustainability Reports |
| `/technology` | `/admin/technology` | `/api/technology` | Innovation Lab |
| `/services` | `/admin/services` | `/api/services` | Manufacturing Services |
| `/fabrics` | `/admin/fabrics` | `/api/fabrics` | Fabric Catalog |
| `/fibers` | `/admin/fibers` | `/api/fibers` | Fiber & Yarn Catalog |
| `/accessories` | `/admin/accessories` | `/api/accessories` | Accessories Catalog |
| `/certifications` | `/admin/certifications` | `/api/certifications` | Certifications |
| `/size-charts` | `/admin/size-charts` | `/api/size-charts` | Size Charts |
| `/resources` | `/admin/resources` | `/api/resources` | B2B Resources |

**URL pattern distinction:**
- **Public routes** use human-readable slugs (e.g., `/blog/my-post-slug`)
- **Admin routes** use database IDs (e.g., `/admin/blog/posts/123/edit`)
- **Public API** returns only published content; **Admin API** returns all content including drafts.

---

## B.L.A.S.T. Protocol

Every engineering task follows the deterministic **B.L.A.S.T.** methodology — no exceptions:

```mermaid
graph LR
    B["<b>B</b>lueprint<br/>Read schemas, routes,<br/>types & config"] --> L["<b>L</b>ink<br/>Verify API contracts,<br/>Zod schemas & env keys"]
    L --> A["<b>A</b>rchitect<br/>Trace request flow,<br/>SSR/cache/auth patterns"]
    A --> S["<b>S</b>tylize<br/>Apply @theme tokens,<br/>GSAP patterns, a11y"]
    S --> T["<b>T</b>rigger<br/>Implement, test &<br/>run verify:tech-integrity"]

    style B fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    style L fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
    style A fill:#fff3e0,stroke:#ef6c00,color:#e65100
    style S fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style T fill:#fce4ec,stroke:#c62828,color:#b71c1c
```

| Phase | What to do |
| :--- | :--- |
| **Blueprint** | Read every relevant schema, route, type, and config file before writing a single line of code. Map the full data contract. |
| **Link** | Verify all API contracts, Zod schemas, and env keys. Confirm `@run-remix/shared` has everything you need. |
| **Architect** | Trace the full request/data flow. Confirm SSR/cache/auth patterns. Check for side effects. |
| **Stylize** | Apply correct Tailwind v4 `@theme` tokens, GSAP patterns, and design system constraints. |
| **Trigger** | Implement, verify with `npm run verify:tech-integrity`, and ship. |

---

## 2026 Strategic Roadmap

```mermaid
gantt
    title RUN APPAREL CMS — 2026 Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Q2 2026 — Foundation
    React 19 & Tailwind v4 Migration           :done, q2a, 2026-04-01, 2026-05-15
    Express 5 & neverthrow Refactor             :done, q2b, 2026-05-10, 2026-06-20
    CI/CD Consolidation (15 to 5 pipelines)     :done, q2c, 2026-05-20, 2026-06-30

    section Q3 2026 — Quality & Features
    WCAG AA Design System Polish                :done, q3a, 2026-07-01, 2026-08-15
    Zero AI-Slop (detect.mjs clean)             :done, q3b, 2026-07-15, 2026-08-15
    B2B Sustainable Supply Chain Tracker         :active, q3c, 2026-08-01, 2026-09-15
    WebMCP Agentic Form Interceptors            :q3d, 2026-08-15, 2026-09-30

    section Q4 2026 — Scale
    Multi-Region Read Replicas (Neon)            :q4a, 2026-10-01, 2026-11-15
    3D Apparel Configurator (LazyViewer)         :q4b, 2026-11-01, 2026-12-15
    Zero-Downtime Canary Rollouts (Automated)    :q4c, 2026-12-01, 2026-12-31
```

### Current Sprint (Q3 2026)

- [x] Universal WCAG AA accessibility — touch targets $\geq 44\text{px}$, high-contrast tokens, semantic headings
- [x] Zero design anti-patterns — eradicated AI-slop gradients, elastic beziers, side-tab accents via `detect.mjs`
- [x] Architecture Health Score → **100/100** across all 10 categories
- [ ] B2B sustainable supply chain visualiser — live tracking of organic yarn lots and recycled polyester batches
- [ ] WebMCP agentic form interception — integrated synthetic form actions with agent-invoked response streaming

---

## Getting Started (Developer Onboarding)

### Prerequisites

| Requirement | Version |
| :--- | :--- |
| Node.js | $\geq$ 24.15.0 (`nvm use 24`) |
| npm | $\geq$ 10.9.2 |
| Port | **5002** (non-negotiable) |

### 1. Clone & Setup

```bash
git clone <repository-url>
cd RUN

# Install all workspace dependencies
npm ci

# Copy environment template
cp .env.example .env
# Fill in: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET

# Verify complete repository integrity
npm run verify:tech-integrity
```

### 2. Run Locally

```bash
# Launch unified dev server (Client + Server via Express SSR)
npm run dev
# → http://localhost:5002
# → Admin: http://localhost:5002/admin
# → API: http://localhost:5002/api/v1
```

### 3. Pre-Commit Verification Gate

```bash
npm run check:apply             # Biome format & lint (auto-fix)
npm run typecheck               # TypeScript zero-error check (client + server)
npm run test                    # Full Vitest suite (170+ files)
npm run verify:tech-integrity   # Non-negotiable 8-check integrity gate
```

> [!WARNING]
> If `verify:tech-integrity` fails, **do not commit**. Fix the issue first. This gate is enforced by pre-commit hooks and CI.

<details>
<summary><strong>Full list of available npm scripts</strong></summary>

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Start dev server (Port 5002) |
| `npm run build` | Full Turbo production build |
| `npm run test` | Run all Vitest suites |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:integration` | Integration test suite |
| `npm run typecheck` | TypeScript type check (both workspaces) |
| `npm run check:apply` | Biome lint + format (auto-fix) |
| `npm run verify:tech-integrity` | 8-check integrity validator |
| `npm run verify-port` | Port 5002 compliance check |
| `npm run migrate:deploy` | Run Drizzle database migrations |
| `npm run build:analyze` | Bundle size analysis |
| `npm run check:docs` | Markdown link checker |
| `npm run check:secrets` | Secret scanning |
| `npm run check:bundle` | Bundle size threshold check |

</details>

---

## Architecture Decision Records (ADRs)

All significant architectural decisions are documented as ADRs in `docs/adr/`:

| ADR | Decision | Status |
| :--- | :--- | :--- |
| ADR-0002 | React 19 over Next.js | Accepted |
| ADR-0003 | Neon Serverless Database | Accepted |
| ADR-0004 | Express 5 Framework | Accepted |
| ADR-0005 | Drizzle ORM | Accepted |
| ADR-0006 | Tailwind v4 | Accepted |
| ADR-0007 | Cloud Run Deployment | Accepted |
| ADR-0009 | Biome over ESLint | Accepted |
| ADR-0010 | Monorepo Structure | Accepted |
| ADR-0011 | Google OAuth | Accepted |
| ADR-0012 | Two-Tier Caching | Accepted |
| ADR-0013 | Error Handling Architecture (neverthrow) | Accepted |
| ADR-0014 | Observability Pipeline (OTel) | Accepted |
| ADR-0015 | React Router v8 | Accepted |
| ADR-0016 | Admin Parity Pattern | Accepted |
| ADR-0017 | GSAP Animation | Accepted |

---

## Standard Operating Procedures (SOPs)

| SOP | Purpose |
| :--- | :--- |
| `SOP_CODE_CHANGE` | Standard workflow for any code modification |
| `SOP_DEPLOY` | Production deployment checklist |
| `SOP_ROLLBACK` | Emergency rollback procedure |
| `SOP_MIGRATE` | Database migration protocol |
| `SOP_API_HANDSHAKE` | API contract verification |
| `SOP_UI_UPGRADE` | Frontend component upgrade guide |
| `SOP_ARCHITECTURE_AUDIT` | Full architecture health assessment |
| `SOP_AGENTIC_SPRINT` | Agentic sprint ceremony protocol |
| `SOP_3D_OPTIMIZATION` | 3D model performance optimisation |

---

## API Error Specification

All API errors comply with **RFC 7807: Problem Details for HTTP APIs** (`application/problem+json`).

<details>
<summary><strong>Error response format & standard error codes</strong></summary>

### Response Format

```json
{
  "type": "https://api.run-remix.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request contained invalid parameters.",
  "instance": "/api/subscribe",
  "requestId": "req_12345",
  "invalid-params": {
    "email": ["Invalid email format"]
  }
}
```

### Standard Error Codes

| Code | Status | Class | Description |
| :--- | :--- | :--- | :--- |
| `INVALID_INPUT` | 400 | `ValidationError` | Validation failed |
| `BAD_REQUEST` | 400 | `BadRequestError` | Malformed request |
| `UNAUTHORIZED` | 401 | `UnauthorizedError` | Not authenticated |
| `FORBIDDEN` | 403 | `ForbiddenError` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | `NotFoundError` | Resource does not exist |
| `CONFLICT` | 409 | `ConflictError` | Duplicate resource |
| `DB_DEADLOCK` | 409 | `AppError` | Retryable deadlock |
| `RATE_LIMIT_EXCEEDED` | 429 | `RateLimitError` | Too many requests |
| `INTERNAL_ERROR` | 500 | `InternalError` | Unexpected server error |
| `DB_CONNECTION_ERROR` | 503 | `DatabaseError` | Database unavailable |
| `DB_TIMEOUT` | 504 | `AppError` | Query timeout |

</details>

---

## Multi-Region Strategy

```mermaid
graph TD
    USER["Global B2B Client"] --> GCLB["Google Cloud<br/>Load Balancer (Anycast)"]
    GCLB --> US["Cloud Run<br/>us-central1 (Primary)"]
    GCLB --> EU["Cloud Run<br/>europe-west1 (Secondary)"]
    GCLB -.-> ASIA["Cloud Run<br/>asia-northeast1 (Planned)"]

    US --> NEON["Neon Postgres<br/>(Primary · us-east-1)"]
    EU --> NEON
    ASIA -.-> REPLICA["Neon Read Replica<br/>(Planned)"]

    US --> REDIS["Redis<br/>(Global Replicated)"]
    EU --> REDIS

    style US fill:#e8f5e9,stroke:#2e7d32
    style EU fill:#e3f2fd,stroke:#1565c0
    style ASIA fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
    style REPLICA fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
```

| Phase | Scope | Status |
| :--- | :--- | :--- |
| **Phase 1** | Single Region + CDN (GCS multi-region bucket) | ✅ Complete |
| **Phase 2** | Multi-Region Compute (US + EU Cloud Run) | 🔄 Q4 2026 |
| **Phase 3** | Neon Read Replicas + Region-aware pooling | 📋 Planned |

---

## Disaster Recovery

| Parameter | Target |
| :--- | :--- |
| **RTO** (Recovery Time Objective) | < 1 Hour |
| **RPO** (Recovery Point Objective) | < 1 Minute (Neon PITR) |

| Component | Recovery Method |
| :--- | :--- |
| **Database** | Neon Point-in-Time Recovery (30-day window) |
| **Media Assets** | GCS multi-region + object versioning |
| **Sessions** | DrizzleSessionStore auto-recovers with DB |
| **Infrastructure** | Re-deploy via Cloud Build from `main` branch |

---

## Contributing

<details>
<summary><strong>Pull Request checklist</strong></summary>

- [ ] `npm run verify:tech-integrity` exits 0
- [ ] `npm run typecheck` exits 0 (no TypeScript errors)
- [ ] `npm run check:apply` applied (Biome clean)
- [ ] `npm run test` passes
- [ ] `task_plan.md` updated before starting
- [ ] `findings.md` updated after finishing
- [ ] No new `any` types introduced
- [ ] No `@react-three/fiber` or `drei` imports
- [ ] No hardcoded ports other than 5002
- [ ] Tests added for any new service-layer logic
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

</details>

### Commit Message Format

```
<type>(<scope>): <subject>

feat(products): add 3D configurator lazy loader
fix(auth): rotate session on Google OAuth callback
chore(deps): update Drizzle ORM to 0.45.2
```

---

## Support & Contact

| Channel | Purpose |
| :--- | :--- |
| **GitHub Issues** | Bug reports, feature requests (use templates) |
| **Slack `#run-remix-dev`** | Development questions |
| **Slack `#run-remix-incidents`** | Production incidents |
| **M. Hateem Jamshaid** | Architectural decisions, security disclosures |

For vulnerability reports: see [Security Policy](./Security-Model).
For troubleshooting: see [Troubleshooting Guide](./Troubleshooting).

---

*Copyright © 2026 RUN APPAREL (PVT) LTD / Durus Industries. All rights reserved.*
