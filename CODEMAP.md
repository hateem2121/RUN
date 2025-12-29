# Project CodeMap 🗺️

**Status:** Live System Map
**Last Updated:** December 2025

This document serves as the high-level map for the RUN-Remix codebase, explaining **how** the system works, not just **what** is in it.

---

## 1. System Architecture

```mermaid
graph TD
    %% Client Layer
    subgraph Client [Frontend (React 19 + Vite)]
        Entry[index.html] --> App[App.tsx]
        App --> Routes[Router]
        Routes --> Public[Public Pages]
        Routes --> Admin[Admin Dashboard]

        Public --> Components[shadcn/ui Components]
        Admin --> Components

        Components --> Hooks[Custom Hooks]
        Hooks --> ApiLib[API Client]
    end

    %% Server Layer
    subgraph Server [Backend (Express 5 + Node.js)]
        ServerEntry[index.ts] --> Middleware[Middleware Layer]
        Middleware --> RoutesAPI[API Routes]
        RoutesAPI --> Services[Business Logic]
        Services --> Schema[Drizzle Schema]
    end

    %% Data Layer
    subgraph Data [Data Persistence]
        Schema --> DB[(PostgreSQL)]
        Services --> Storage[GCP Cloud Storage]
    end

    %% External Services
    subgraph External [External Services]
        Sentry[Sentry (Observability)]
        Redis[Upstash Redis (Rate Limiting)]
    end

    %% Connections
    ApiLib <-->|JSON/REST| ServerEntry
    Schema <--> DB
    Middleware -.-> Redis
    ServerEntry -.-> Sentry
    Client -.-> Sentry
```

---

## 2. Directory Map (The "Why")

### `client/` (The Frontend)

| Directory                 | Purpose                                                        | Key Patterns                                        |
| ------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `src/components/ui`       | **Atomic UI Library**. Contains reusable shadcn/ui components. | Use `cva` for variants, `cn` for merging.           |
| `src/components/admin`    | **Admin Domain**. Components specific to the CMS/Dashboard.    | Complex forms, data tables, storage managers.       |
| `src/components/products` | **Product Domain**. Public-facing product displays.            | 3D viewers, interactive galleries, specs.           |
| `src/pages`               | **Route Pages**. Top-level page components.                    | `useEffect` for page title, data fetching.          |
| `src/lib`                 | **Core Utilities**. Helper functions and constants.            | `design-tokens.ts` (CSS vars), `utils.ts` (merger). |

### `server/` (The Backend)

| Directory    | Purpose                                                      | Key Patterns                      |
| ------------ | ------------------------------------------------------------ | --------------------------------- |
| `routes`     | **API Endpoints**. Definitions of REST limits.               | `router.get()`, `router.post()`.  |
| `services`   | **Business Logic**. Complex operations isolated from routes. | `ProductService`, `MediaService`. |
| `middleware` | **Request Processing**. Auth, logging, rate limiting.        | `rateLimiter.ts`, `security.ts`.  |
| `db`         | **Database Config**. Drizzle setup.                          | `index.ts`, `migrate.ts`.         |

### `shared/` (The Bridge)

- **`schema.ts`**: The **Single Source of Truth** for data shapes. Defines database tables (Drizzle) AND validation types (Zod). Shared by Client and Server.

---

## 3. Key Data Flows

### A. Rendering a Product Page

1. **User** visits `/products/:slug`.
2. **Client** (`EnhancedProductDetail.tsx`) calls `useQuery(getProduct)`.
3. **API** receives `GET /api/products/:slug`.
4. **Server** (`server/routes.ts` -> `storage.ts`) queries PostgreSQL via Drizzle.
5. **DB** returns product data + joined media.
6. **Server** sends JSON response.
7. **Client** renders data; 3D viewer lazy-loads GLB model from GCP.

### B. Admin Uploading a File

1. **Admin** drops file in `MediaLibrary`.
2. **Client** POSTs to `/api/media/upload`.
3. **Server** validates file type/size (Multer).
4. **Service** streams file to **GCP Storage**.
5. **Service** creates record in **PostgreSQL** (`media_items` table).
6. **Server** returns the new media object.
7. **Client** React Query cache invalidates `['media']`, updating the UI instantly.

---

## 4. Feature Implementation Map

Where to look when working on X:

| Feature            | Frontend Entry                        | Backend Logic              | Database Table                 |
| ------------------ | ------------------------------------- | -------------------------- | ------------------------------ |
| **CMS/Admin**      | `client/src/pages/admin.tsx`          | `server/routes/admin.ts`   | `users`, `audit_logs`          |
| **Products**       | `client/src/pages/products.tsx`       | `server/storage.ts`        | `products`, `product_variants` |
| **Media**          | `client/src/components/admin/media`   | `server/services/media.ts` | `media_items`                  |
| **Contact**        | `client/src/pages/contact.tsx`        | `server/routes/contact.ts` | `inquiries`                    |
| **Sustainability** | `client/src/pages/sustainability.tsx` | `server/routes.ts`         | `sustainability_metrics`       |
| **Theming**        | `client/src/index.css`                | N/A                        | N/A                            |

---

## 5. State Management Strategy

- **Server State**: Managed by **TanStack Query** (v5).
  - Keys: `['products']`, `['media', { page: 1 }]`.
  - Stale Time: 5 minutes (default).
- **UI State**: React `useState` / `useReducer` for local interactions (modals, form inputs).
- **URL State**: **Wouter** for routing, query params for filters (`?category=men`).
- **Global Auth**: React Context (`AuthProvider`) holding the session.

---

## 6. CSS Architecture Map

> See `DOCS-CSS-ARCHITECTURE.md` for full details.

- **Tokens**: `client/src/index.css` (@theme block).
- **Type-Safe Access**: `client/src/lib/design-tokens.ts`.
- **Utilities**: `client/src/lib/utils.ts` (cn helper).
- **Standards**: NO hardcoded colors. NO arbitrary values.

---

_Use this map to orient yourself before diving into specific files._
