# Visual Architecture Gallery 🎨

> **RUN APPAREL CMS v4.1.2** — *Sialkot, Pakistan* | Subsidiary of **Durus Industries** (est. 1889)

This gallery contains **12 editorial-quality architectural diagrams** designed using the `cathrynlavery/diagram-design` principles (pure HTML+SVG, zero-shadows, editorial typography, brand tokens, and high information density).

> [!TIP]
> **Interactive Gallery**: Open [`wiki/diagrams/index.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/index.html) in any web browser to interactively preview all 12 diagrams with a tabbed interface.

---

## 1. System Architecture Suite

### 1.1 C4 Level 1 — System Context

- **Diagram File**: [`wiki/diagrams/architecture-c4.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/architecture-c4.html)
- **Scope**: Explains the RUN Remix platform boundary, user ingress on port `5002`, and connections to all 6 external services (Google OAuth 2.0, Neon Postgres, Redis, Google Cloud Storage, Cloud Tasks, External B2B APIs via Opossum).

### 1.2 Express 5 Server Layered Architecture

- **Diagram File**: [`wiki/diagrams/architecture-layers.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/architecture-layers.html)
- **Scope**: Four-layer vertical execution stack:
  1. *Middleware*: CSRF, RBAC, Rate Limiting, Correlation ID, SSR Cache
  2. *Route Handlers*: Thin controllers (Validate → Call Service → Respond)
  3. *Service Layer* (**Focal Accent**): `neverthrow` `ResultAsync<T, E>` business logic
  4. *Repository Layer*: Drizzle ORM parameterized SQL
  - Connected to Two-Tier Cache (L1 LRU + L2 Redis), Cloud Tasks worker queue, and Opossum circuit breakers.

### 1.3 Monorepo Import Boundaries

- **Diagram File**: [`wiki/diagrams/architecture-monorepo.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/architecture-monorepo.html)
- **Scope**: Triangular workspace isolation contract across `client/`, `server/`, and `shared/` (`@run-remix/shared`). Illustrates allowed barrel imports vs. strictly prohibited cross-workspace direct dependencies.

### 1.4 Technology Stack Pyramid

- **Diagram File**: [`wiki/diagrams/pyramid-tech-stack.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/pyramid-tech-stack.html)
- **Scope**: Stepped tapered pyramid of 30+ technologies spanning Infrastructure, Data, Services, Schemas (central integration point), Presentation, and Design.

---

## 2. Execution & Data Flow Suite

### 2.1 B.L.A.S.T. Execution Protocol

- **Diagram File**: [`wiki/diagrams/flow-blast.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/flow-blast.html)
- **Scope**: 5-stage sequential engineering methodology:
  - **B** — Blueprint (Blue)
  - **L** — Link (Purple)
  - **A** — Architect (Orange)
  - **S** — Stylize (Green)
  - **T** — Trigger (Manufacturing Gold)

### 2.2 Product Request Lifecycle

- **Diagram File**: [`wiki/diagrams/flow-request-lifecycle.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/flow-request-lifecycle.html)
- **Scope**: 5-column swimlane illustrating the complete lifecycle of a product query: Browser → React Router v8 Client Loader → Express API → Redis L2 Cache (Hit short-circuit vs Miss) → Neon DB → Redis SETEX write-through → DOM render.

### 2.3 Google OAuth 2.0 Authentication Flow

- **Diagram File**: [`wiki/diagrams/flow-auth.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/flow-auth.html)
- **Scope**: 9-step sequence from `/api/login` through Google consent, token exchange, Neon user upsert, Redis sliding session (`sess:{id}`), and secure `connect.sid` cookie issuance.

### 2.4 Core Data Models (ERD)

- **Diagram File**: [`wiki/diagrams/data-erd.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/data-erd.html)
- **Scope**: Complete schema relationship model for `users`, `sessions`, `products`, `categories`, `media`, `materials`, `product_relations`, `blog`, `sustainability_metrics`, and `metric_history`.

---

## 3. Security, Operations & Roadmap Suite

### 3.1 Security Defence-in-Depth

- **Diagram File**: [`wiki/diagrams/security-layers.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/security-layers.html)
- **Scope**: 6 concentric shells detailing 12 security controls from external Network/Transport through Application, Service, Data, down to the Core Secrets layer.

### 3.2 CI/CD Canary Deployment Pipeline

- **Diagram File**: [`wiki/diagrams/flow-cicd-canary.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/flow-cicd-canary.html)
- **Scope**: 3-phase automated deployment pipeline on Google Cloud Build featuring pre-deployment Drizzle DB migrations, canary health checks, 10% → 50% progressive traffic shifting, and full rollout.

### 3.3 Multi-Region Deployment Strategy

- **Diagram File**: [`wiki/diagrams/infra-multiregion.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/infra-multiregion.html)
- **Scope**: Geographic multi-region topology on Google Cloud Run (`us-central1`, `europe-west1`, `asia-northeast1`) with global Anycast load balancing and Neon read replication.

### 3.4 2026 Strategic Roadmap Timeline

- **Diagram File**: [`wiki/diagrams/timeline-roadmap.html`](file:///Users/hateemjamshaid/Sites/RUN/wiki/diagrams/timeline-roadmap.html)
- **Scope**: Chronological timeline through Q2 Foundation (complete), Q3 Quality & Features (active sprint), and Q4 Scale & Expansion (planned).

---

## Brand Design Tokens

All diagrams adhere strictly to the **RUN APPAREL Design System**:

| Token Role | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Paper (Background)** | `#fafaf9` | Warm off-white canvas |
| **Ink (Primary)** | `#1c1917` | Jet black typography |
| **Muted (Secondary)** | `#78716c` | Subtitles, secondary notes, inactive paths |
| **Accent (Highlight)** | `#d4a853` | Manufacturing Gold — focal items only |
| **Technology / Links** | `#0047ab` | Technology blue links and primary routes |
| **Sustainability / Success**| `#00c97b` | Sustainability green badges and verified gates |
| **Hairline (Borders)** | `#d6d3d1` | Silver 1px structural dividing lines |
| **Typography** | `Inter` + `JetBrains Mono` | Clean editorial titles & monospace technical schemas |

---

*Copyright © 2026 RUN APPAREL (PVT) LTD / Durus Industries. All rights reserved.*
