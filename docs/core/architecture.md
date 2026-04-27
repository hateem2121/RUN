# Project CodeMap & Architecture 🗺️

**Status:** Live System Map
**Last Updated:** April 2026
**Version:** 3.0.0

This document serves as the high-level map for the RUN-Remix codebase, explaining **how** the system works, **what** it is composed of, and **where** to find things.

---

## 1. System Context

Run Remix is a modern B2B e-commerce platform built on a "Bleeding Edge" stack (React 19, Express 5, Tailwind 4).

### High-Level Architecture (C4)

```mermaid
C4Context
    title System Context Diagram
    
    Person(user, "User", "Web Browser Interaction")
    
    System_Boundary(run_remix, "RUN-Remix Platform") {
        Container(frontend, "Frontend SPA", "React 19, Vite", "Client-side application")
        Container(backend, "Backend API", "Express 5, Node 24", "REST API & Business Logic")
    }

    System_Ext(google_auth, "Google OAuth", "Authentication Provider")
    System_Ext(neon_db, "Neon Postgres", "Primary Data Store (Serverless)")
    System_Ext(upstash, "Upstash Redis", "L2 Cache & Session Store")
    System_Ext(gcs, "Google Cloud Storage", "Asset CDN")
    System_Ext(sentry, "Sentry", "Error Tracking")

    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, backend, "API Requests", "JSON/REST")
    Rel(frontend, gcs, "Loads Assets", "HTTPS")
    Rel(backend, neon_db, "Reads/Writes", "HTTP/Postgres")
    Rel(backend, upstash, "Cache/Session", "REST")
    Rel(backend, google_auth, "Authenticates", "OAuth 2.0")
    Rel(backend, sentry, "Reports Errors", "HTTPS")
```

---

## 2. Deployment & Runtime

The system runs on **Google Cloud Run** with a standardized CI/CD pipeline using Cloud Build.

```mermaid
graph TB
    subgraph CI_CD ["Google Cloud Build"]
        build_step["Docker Build (Multi-stage)"]
        test_step["Unit Tests (Vitest)"]
        Verify["npm run verify:tech-integrity"]
    end

    subgraph Runtime ["Google Cloud Run (Managed)"]
        lb["Load Balancer / Ingress"]
        
        subgraph Instances ["Container Instances"]
            express["Node 24 Container"]
            health["Health Check (scripts/healthcheck.js)"]
            express -- "Exposes 5002" --> health
        end
    end

    build_step --> |Push Image| Registry["Container Registry"]
    Registry --> |Deploy| Runtime
    lb --> Instances
```

---

## 3. Directory Map (The "Why")

The project uses **NPM Workspaces** to manage dependencies across packages.

### `client/` (`@run-remix/client`)

| Directory                 | Purpose                                                        | Key Patterns                                        |
| ------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `app/components/ui`       | **Atomic UI Library**. Contains reusable shadcn/ui components. | Use `cva` for variants, `cn` for merging.           |
| `app/components/admin`    | **Admin Domain**. Components specific to the CMS/Dashboard.    | Complex forms, data tables, storage managers.       |
| `app/components/products` | **Product Domain**. Public-facing product displays.            | 3D viewers, interactive galleries, specs.           |
| `app/routes`              | **Route Pages**. Top-level page components.                    | `useEffect` for page title, data fetching.          |
| `app/lib`                 | **Core Utilities**. Helper functions and constants.            | `design-tokens.ts` (CSS vars), `utils.ts` (merger). |

### `server/` (`@run-remix/server`)

| Directory    | Purpose                                                      | Key Patterns                       |
| ------------ | ------------------------------------------------------------ | ---------------------------------- |
| `routes`     | **API Endpoints**. Definitions of REST limits.               | `router.get()`, `router.post()`.   |
| `services`   | **Business Logic**. Complex operations isolated from routes. | `AuthService`, `MediaService`.     |
| `middleware` | **Request Processing**. Auth, logging, rate limiting.        | `correlation-id.ts`, `nonce.ts`.   |
| `db`         | **Database Config**. Drizzle setup.                          | `db.ts`, `migrations/`.            |
| `lib`        | **System Core**. Caching, resilience, logging.               | `unified-cache.ts`, `db-retry.ts`. |

### `shared/` (`@run-remix/shared`)

- **`schema.ts`**: The **Single Source of Truth** for data shapes. Defines database tables (Drizzle) AND validation types (Zod). Shared by Client and Server.
- **`package.json`**: Configured as specific ESM package (`type: "module"`).

---

## 4. Key Data Flows

### A. Request Lifecycle (Product Load)

```mermaid
sequenceDiagram
    participant User
    participant Client as React Client (Vite)
    participant API as Express API
    participant Cache as Redis (Upstash)
    participant DB as Neon Postgres

    User->>Client: Navigates to /categories/running
    Client->>Client: React Router (Client Loader)
    Client->>API: GET /api/v1/categories/running/products
    
    API->>API: Validate Session (Express Middleware)
    
    API->>Cache: GET cache:categories:running:products
    alt Cache Hit
        Cache-->>API: JSON Data
    else Cache Miss
        API->>DB: SQL Query (Drizzle HTTP)
        DB-->>API: Result Rows
        API->>Cache: SETEX 300 data
    end

    API-->>Client: 200 OK { products: [...] }
    Client->>User: Renders Product Grid (Tailwind v4)
```

### B. Admin Upload Flow

1. **Admin** drops file in `MediaLibrary`.
2. **Client** POSTs to `/api/media/upload`.
3. **Server** validates file type/size (Multer).
4. **Service** streams file to **GCP Storage**.
5. **Service** creates record in **PostgreSQL** (`media_items` table).
6. **Server** returns the new media object.
7. **Client** React Query cache invalidates `['media']`, updating the UI instantly.

---

## 5. Data Models (ERD)

Derived from `shared/schemas` directory structure.

```mermaid
erDiagram
    Users ||--o{ Orders : places
    Users {
        uuid id PK
        string email
        string role
        json preferences
    }

    Products }|--|{ Categories : "belongs to"
    Products ||--o{ Materials : "composed of"
    Products {
        uuid id PK
        string slug
        string name
        json price_data
    }

    Categories {
        uuid id PK
        string slug
        string name
        int level
    }

    Media }|--|| Products : "visualizes"
    Media {
        uuid id PK
        string url
        string type
    }
```

---

## 6. Feature Implementation Map

Where to look when working on X:

| Feature            | Frontend Entry                         | Backend Logic              | Database Table                 |
| ------------------ | -------------------------------------- | -------------------------- | ------------------------------ |
| **CMS/Admin**      | `client/app/routes/admin.tsx`          | `server/routes/admin.ts`   | `users`, `audit_logs`          |
| **Products**       | `client/app/routes/products.tsx`       | `server/routes/core`       | `products`, `product_variants` |
| **Media**          | `client/app/components/admin/media`    | `server/services/media.ts` | `media_items`                  |
| **Contact**        | `client/app/routes/contact.tsx`        | `server/routes/contact.ts` | `inquiries`                    |
| **Sustainability** | `client/app/routes/sustainability.tsx` | `server/routes/core`       | `sustainability_metrics`       |
| **Theming**        | `client/app/index.css`                 | N/A                        | N/A                            |

---

## 7. Architecture Health

> **Last Assessed:** April 2026 | **Target Score:** 100/100 | **Current Score:** 96.2/100

| Category | Score | Status | Justification |
| :--- | :--- | :--- | :--- |
| **Maintainability** | 98% | ✅ Excellent | All monoliths decomposed (ProductCreateEditModal, PageContentRepository, MediaGrid, MediaUploadEnhanced, MediaLibraryContextEnhanced). Zero tech debt on ledger. |
| **Security** | 96% | ✅ Excellent | Healthchecks standardized; secrets managed; deps locked; RBAC bypass fail-closed in production. |
| **Performance** | 92% | ✅ Excellent | Neon-HTTP driver + split vendor chunking + aggressive cache headers + upload queue concurrency management. |
| **Scalability** | 98% | ✅ Excellent | Cloud Run + Redis + Stateless Auth is infinite scale ready. |
| **Reliability** | 96% | ✅ Excellent | Standardized DB driver; idempotency middleware; domain repository isolation. |
| **Incident Response** | 94% | ✅ Excellent | Runbooks documented for critical scenarios including circuit breaker trips and rate limit surges. |
| **Testing Strategy** | 90% | ✅ Excellent | Vitest + Playwright configured; coverage thresholds enforced at 80%; 80/80 test files passing. |
| **Accessibility** | 89% | ⚠️ Good | WCAG AA standards documented; automated axe-core testing integration pending. |
| **Documentation** | 97% | ✅ Excellent | Comprehensive docs; architecture health metrics current; CHANGELOG and SOPs actively maintained. |
| **Directory Structure** | 96% | ✅ Excellent | Monorepo fully modular. Admin components domain-organized. Backend repositories decomposed into domain-specific modules. |

### Improvement Roadmap

| Phase | Focus Area | Target | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation | 94/100 | ✅ Complete |
| **Phase 2** | Quality Assurance | 96/100 | ✅ Complete |
| **Phase 3** | Organization | 98/100 | 🔄 In Progress |
| **Phase 4** | Security & Infrastructure | 99/100 | 📋 Planned |
| **Phase 5** | Verification | 100/100 | 📋 Planned |

_Use this map to orient yourself before diving into specific files. See [Architecture Improvement Plan](../../plans/architecture-improvement-plan.md) for detailed roadmap._
