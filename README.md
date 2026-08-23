# RUN Remix — The Agentic Sportswear Factory

**Version:** 4.1.2 | **Port:** 5002 (Exclusively) | **Engine:** Antigravity / gstack | **License:** MIT | **Last Updated:** August 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hateem2121/RUN)
[![Node 24+](https://img.shields.io/badge/Node-24%2B-339933?logo=node.js)](https://nodejs.org)
[![React 19](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)
[![Tailwind V4](https://img.shields.io/badge/Tailwind-V4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express 5](https://img.shields.io/badge/Express-5.2.1-000000?logo=express)](https://expressjs.com)
[![Biome Clean](https://img.shields.io/badge/Linter-Biome_2.5-60A5FA?logo=biome)](https://biomejs.dev)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hateem2121/RUN/badge)](https://scorecard.dev/viewer/?site=github.com/hateem2121/RUN)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## 🏭 Overview

**RUN Remix** is an open-source, AI-native B2B sportswear CMS and **Agentic Software Factory**. Engineered for **RUN APPAREL (PVT) LTD** (a subsidiary of Durus Industries, est. 1889), it unifies century-old garment manufacturing craftsmanship with high-velocity agentic software engineering.

It provides a production-grade blueprint for building deterministic, high-performance commerce and manufacturing platforms with real-time 3D garment configuration, WebMCP agentic forms, and strict monorepo boundaries.

---

## ⚡ Quick Start

### 1. Launch in Browser (1-Click Dev Container)

Click [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hateem2121/RUN) to launch a fully provisioned Node 24 + Biome cloud environment with port 5002 auto-forwarded.

### 2. Local Setup

```bash
# Clone the repository
git clone <repository-url>
cd RUN

# Install dependencies (Node 24+ required)
npm install

# Configure environment variables
cp .env.example .env

# Verify system integrity
npm run verify:tech-integrity

# Start development server
npm run dev
# → Application live on http://localhost:5002
```

---

## 📐 Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Client (React 19 / Vite 8)                       │
│  - React Router v8 Leaf Routes (Default Exports + ErrorBoundary)        │
│  - Tailwind CSS v4 (@theme & @utility tokens)                           │
│  - 3D Garment Configurator (LazyUnifiedModelViewer + glTF streaming)   │
│  - GSAP 3.15 + locomotive-scroll Motion Engine                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    import { schemas, types, routes }
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Shared Package (@run-remix/shared)                   │
│  - Drizzle pgTable Schemas & drizzle-zod Validators                     │
│  - Central Route Manifests & Constant Enums                             │
│  - Zero client/server runtime dependencies (Boundary Sacred)           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    validated data contracts & types
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                        Server (Express 5 / Node 24)                     │
│  - Thin Controllers (Validation ──► Service Layer ──► neverthrow Match) │
│  - Database: Neon Serverless PostgreSQL (Drizzle ORM Parameterized)     │
│  - Sessions: DrizzleSessionStore (Neon PostgreSQL)                      │
│  - Background Processing: Google Cloud Tasks HTTP Workers               │
│  - Observability: OpenTelemetry Tracing + Pino Structured Logs          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ The Agentic Factory (Slash Commands)

RUN Remix is powered by 23+ specialized agent workflows:

| Command | Role | Responsibility |
|---------|------|----------------|
| `/office-hours` | **CEO** | Set vision, product goals, and business constraints. |
| `/plan-ceo-review` | **CEO** | High-level feasibility, user value, and product scope. |
| `/plan-eng-review` | **Eng Manager** | Architecture, invariants, test matrices, and security. |
| `/plan-design-review` | **Design Lead** | Visual hierarchy, empty states, and design system fidelity. |
| `/shape` | **Product Lead** | Interactive UX shaping and design briefs before code. |
| `/review` | **Senior Reviewer** | Forensic code quality and regression analysis. |
| `/qa` | **QA Lead** | Automated browser E2E and visual golden verification. |
| `/ship` | **Release Eng** | Production readiness, security gating, and deployment triggers. |
| `/retro` | **Team Lead** | Sprint retro and SOP documentation updates. |

---

## 🏗️ Technical Stack & Invariants

| Layer | Technology | Key Invariant |
|-------|------------|---------------|
| **Frontend** | React 19.2.7, React Router v8, Vite 8 (Rolldown) | Raw `ref` props (no `forwardRef`). Default exports for leaf routes. |
| **Styling** | Tailwind CSS v4 | `@utility` layer only. Zero arbitrary pixel classes in JSX. |
| **Animations** | GSAP 3.15, locomotive-scroll 5.0.1 | No `framer-motion` or `lenis`. |
| **Backend** | Express 5.2.1, Node 24 | Async-native handlers. No `try/catch` in controllers. |
| **Database** | Neon Serverless PostgreSQL | Parameterized Drizzle ORM queries only (no raw SQL). |
| **Sessions** | `DrizzleSessionStore` (Neon) | No `MemoryStore` or deprecated session packages. |
| **Services** | `neverthrow` ResultAsync | Zero raw throws in services; explicit `ResultAsync<T, E>`. |
| **Background** | Google Cloud Tasks | Signed token validation via `verifyCloudTaskToken`. |
| **Resilience** | `opossum` Circuit Breaker | Mandatory wrapping for all external API endpoints. |
| **Linting** | Biome 2.5 | Biome strictly replaces ESLint and Prettier. |
| **Port** | 5002 Exclusively | Hardcoded dev and test port (never 3000). |

---

## 📚 Community Standards & Documentation

RUN Remix adheres strictly to [Open Source Guides](https://opensource.guide/) and modern repository health standards:

| Resource | Document | Purpose |
|----------|----------|---------|
| **Code of Conduct** | [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | Contributor Covenant v2.1 community pledge and enforcement. |
| **Contributing** | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Developer induction, B.L.A.S.T. methodology, and PR guidelines. |
| **Governance** | [`GOVERNANCE.md`](./GOVERNANCE.md) | Founder-Led BDFL governance, maintainer ladder, and RFC process. |
| **Roadmap** | [`ROADMAP.md`](./ROADMAP.md) | Living 2026–2027 product milestones and feature tracks. |
| **Security Policy** | [`SECURITY.md`](./SECURITY.md) | Vulnerability disclosure, response SLAs, and GHSA reporting. |
| **Support Channels** | [`SUPPORT.md`](./SUPPORT.md) | GitHub Discussions, bug triage, and enterprise contacts. |
| **Citation** | [`CITATION.cff`](./CITATION.cff) | Citation File Format (CFF) metadata for academic/industry use. |
| **Constitution** | [`gemini.md`](./gemini.md) | Ultimate Single Source of Truth (SSOT) for monorepo constraints. |
| **Sponsorship** | [`.github/FUNDING.yml`](./.github/FUNDING.yml) | GitHub Sponsors and project funding channels. |

---

## 🔍 Pre-Push Quality Verification

Every contribution must pass the full technical integrity gate:

```bash
npm run check:apply           # Biome format + lint (auto-fix)
npm run typecheck             # Strict TypeScript verification (0 errors)
npm run verify:tech-integrity # Monorepo integrity suite (all checks exit 0)
npm run test                  # Vitest unit & integration tests
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) © 2026 **RUN APPAREL (PVT) LTD** & **Durus Industries (est. 1889)**.
