# System Context & Architecture Analysis

## 1. Project Overview

**RUN-Remix** is a high-performance, monolithic full-stack e-commerce application designed for athletic wear ("Stay Hard - Stay Hard Running"). It's built for scale, featuring advanced caching, tiered architecture, and rigorous performance monitoring.

### Key Characteristics:

- **Monorepo-like Structure**: `client/` and `server/` coexist in the root.
- **Hybrid Routing**: Frontend uses `wouter` for lightweight client-side routing, while the backend is a robust Express service.
- **Performance Optimization**: Features a custom "Two-Tier" caching strategy (Memory L1 + KV L2), extensive React Query optimization, and batch processing to avoid N+1 issues.
- **Cloud Native**: Dockerized and tailored for Google Cloud Run with Cloud Build CI/CD.

## 2. Infrastructure & Deployment

- **Containerization**: `Dockerfile` uses a multi-stage node:20-alpine build.
  - builds frontend (`vite build`) and backend (`esbuild`) separately.
  - Exposes port 5000.
- **CI/CD**: `cloudbuild.yaml` automates the pipeline:
  1.  Builds Docker image (`gcr.io/$PROJECT_ID/run-remix`).
  2.  Pushes to GCR.
  3.  Deploys to Cloud Run (managed platform, `us-central1`, `NODE_ENV=production`).
- **Storage**: Google Cloud Storage for media assets.

## 3. Frontend Architecture

- **Framework**: React 19 (Vite).
- **State Management**:
  - `@tanstack/react-query`: Highly tuned with custom query key factories (`queryKeys`) and data-type specific settings (static, cms, products, live).
  - `zustand`: For global client state.
- **Performance Engineering**:
  - **Batching**: `mediaBatchScheduler` to consolidate media requests.
  - **Optimistic UI**: Query configurations for stale-while-revalidate.
  - **Monitoring**: Automatic cache cleanup when memory > 120MB (`queryClient.ts`).
- **Design System**:
  - **Components**: Located in `client/src/components/ui`, using `radix-ui` primitives and `tailwindcss`.
  - **Theming**: `theme-provider.tsx` handles dark/light modes.
  - **Visuals**: `framer-motion` for animations.

## 4. Backend Architecture

- **Runtime**: Node.js / Express 5.
- **Data Access Layer**:
  - **Pattern**: Repository Pattern (e.g., `ProductRepository`, `MediaRepository`) used by `DirectPostgreSQLStorage`.
  - **Storage**: `DirectPostgreSQLStorage` class implements `IStorage`, abstracting Drizzle ORM operations.
- **Caching Strategy** (`server/lib`):
  - `TwoTierBatchCache`: A specialized cache service with SWR support, benchmarking to keep batch queries < 300ms.
  - `UnifiedCache`: Singleton managing caching logic.
- **API Structure**:
  - Modularized in `server/routes` (domains: core, admin, media, resources).
  - `routes/index.ts` is the master router, applying middleware like `requireAdmin` and rate limiters.
- **Observability**:
  - Smart Logger (`lib/smart-logger.js`).
  - Performance tracking middleware.

## 5. Database & Schema

- **Technology**: PostgreSQL (Neon).
- **ORM**: Drizzle ORM.
- **Schema** (`shared/schema.ts`):
  - **Core**: `products`, `categories` (hierarchical), `fabrics`, `fibers`.
  - **Media**: `media_assets` with metadata for optimization.
  - **CMS**: `homepage_hero`, `about_sections`, `about_timeline_entries`.
  - **Performance**: Extensive indexing (B-tree, GIN) targeting active/deleted states.

## 6. Key Implementation Patterns

- **Direct Storage**: The app moved from hybrid storage complexity to "Direct PostgreSQL" (`postgresql-direct-storage.ts`), relying on indexes and optimization rather than complex in-memory stores for source-of-truth.
- **Batch Processing**: Both frontend and backend are designed to handle IDs in batches to minimize RTT (Round Trip Time).
- **Resilience**: Retry logic (`db-retry.ts`), Circuit Breakers (`db-circuit-breaker.ts`), and Keep-Alive mechanisms.

## 7. Recommendations

- **Routing**: Consolidate on TanStack Router if `wouter` limits growth, though `wouter` fits the current lightweight needs.
- **Documentation**: Maintain the OpenAPI spec as the API is rich and complex.
- **Testing**: Ensure the batching logic is covered by integration tests, as it's a critical performance path.
