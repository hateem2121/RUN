# RUN Remix — The Agentic Sportswear Factory

**Version:** 4.1.0 | **Port:** 5002 (Exclusively) | **Engine:** gstack | **Last Updated:** May 2026

[![Node 24+](https://img.shields.io/badge/Node-24%2B-339933?logo=node.js)](https://nodejs.org)
[![React 19](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev)
[![Tailwind V4](https://img.shields.io/badge/Tailwind-V4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express 5](https://img.shields.io/badge/Express-5.1.0-000000?logo=express)](https://expressjs.com)

---

## 🏭 The Agentic Software Factory

**RUN Remix** is not just a codebase; it is an **Agentic Software Factory**. Powered by Garry Tan's `gstack` setup, it orchestrates a high-performance virtual engineering team specialized in premium B2B sportswear tech.

We combine **Heritage Craftsmanship** (Durus Industries, est. 1889) with **Advanced Agentic Engineering** to ship production-grade software at 10x velocity.

---

## ⚡ Quick Start

### 1. Developer Induction

```bash
# Clone the factory
git clone <repository-url>
cd RUN-REMIX

# Provision the environment
npm install
cp .env.example .env
# Fill in DATABASE_URL, Upstash, Google IDs, etc.

# Verify Tech Integrity
npm run verify:tech-integrity
```

### 2. Run Locally

```bash
# Start dev server (Client + Server via Turbo)
npm run dev
# → Opens on http://localhost:5002
```

### 3. Pre-Push Checklist

```bash
npm run check:apply           # Biome format + lint (auto-fix)
npm run typecheck             # Must be 0 errors
npm run verify:tech-integrity # Must exit 0
npm run test                  # Tests must pass
```

---

## 🛠️ The Team (Slash Commands)

The factory is staffed by 23+ specialized agent roles:

| Command | Role | Goal |
|---------|------|------|
| `/office-hours` | **CEO** | Set the vision and challenge assumptions. |
| `/plan-ceo-review` | **CEO** | High-level feasibility and business alignment. |
| `/plan-eng-review` | **Eng Manager** | Architecture, security, and performance review. |
| `/plan-design-review` | **Design Lead** | "The Wow" factor and aesthetic consistency. |
| `/review` | **Senior Reviewer** | Forensic code analysis and refactoring. |
| `/qa` | **QA Lead** | Real-world browser verification. |
| `/ship` | **Release Eng** | Final checks and deployment triggers. |
| `/retro` | **Team Lead** | Learn from the sprint and update SOPs. |
| `/investigate` | **Specialist** | Solve the most complex "impossible" bugs. |
| `/devex-review` | **DX Lead** | Developer experience audit — tooling, workflow, onboarding. |

---

## 🏗️ Technical Stack

| Layer | Technology | Key Constraint |
|-------|-----------|----------------|
| **Frontend** | React 19.2.4 | NO `forwardRef`. Named exports only. |
| **Styling** | Tailwind CSS V4 | `@utility` layer only. NO arbitrary JSX values. |
| **Backend** | Express 5.1.0 | Async-native handlers. NO `try/catch`. |
| **3D** | `@google/model-viewer` | `LazyUnifiedModelViewer` required. |
| **Database** | Neon Serverless | HTTP Driver only. |
| **ORM** | Drizzle 0.45.1 | Parameterized queries. No raw SQL. |
| **Testing** | Vitest | 80%+ service coverage required. |
| **Linting** | Biome 2.3.10 | NOT ESLint or Prettier. |

---

## 📐 B.L.A.S.T. Protocol

Every task follows the deterministic **B.L.A.S.T.** methodology:

1. **Blueprint**: Define schemas and SOPs in `docs/` before code.
2. **Link**: Verify APIs and `.env` with atomic scripts.
3. **Architect**: Build layers (L1 SOP → L2 Route → L3 Service).
4. **Stylize**: Apply the 5 Dimensions of Design (Skeleton, Skin, Palette, Voice, Soul).
5. **Trigger**: Deploy via automated CI/CD pipelines.

---

## 📚 Documentation

| Resource | Path |
|----------|------|
| Constitution | [`gemini.md`](./gemini.md) |
| Agent Ethos | [`docs/core/ETHOS.md`](./docs/core/ETHOS.md) |
| Agent Roles | [`docs/core/AGENTS.md`](./docs/core/AGENTS.md) |
| SOPs | [`docs/core/sops/`](./docs/core/sops/) |
| Onboarding | [`docs/ONBOARDING.md`](./docs/ONBOARDING.md) |
| Dev Workflow | [`docs/DEVELOPMENT_WORKFLOW.md`](./docs/DEVELOPMENT_WORKFLOW.md) |
| Coding Standards | [`docs/CODING_STANDARDS.md`](./docs/CODING_STANDARDS.md) |
| API Reference | [`docs/api/`](./docs/api/) |
| Architecture | [`docs/core/architecture.md`](./docs/core/architecture.md) |
| Security | [`SECURITY.md`](./SECURITY.md) |
| CSRF Protection | [`docs/security/csrf-protection.md`](./docs/security/csrf-protection.md) |
| Security Headers | [`docs/security/headers.md`](./docs/security/headers.md) |
| Disaster Recovery | [`docs/infrastructure/disaster-recovery.md`](./docs/infrastructure/disaster-recovery.md) |
| Multi-Region Strategy | [`docs/infrastructure/multi-region.md`](./docs/infrastructure/multi-region.md) |
| Dependency Graph | [`docs/core/dependency-graph.md`](./docs/core/dependency-graph.md) |
| Contributing | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Changelog | [`CHANGELOG.md`](./CHANGELOG.md) |

---

## 🛡️ Security & Performance

- **Port 5002** is used for ALL services.
- **100/100 Architecture Health Score** (Verified May 2026).
- Sub-500ms p95 latency via L1/L2 caching + real-time Web Vitals monitoring.
- Zero-tolerance for `any` types or unsafe data patterns.
- Automated security scanning on every PR + accessibility regression tests.

For vulnerability reporting, see [`SECURITY.md`](./SECURITY.md).

Security tools in use: Trivy, GitHub secret scanning, DAST (`dast-scan.yml`), `npm audit`.

---

## License

Copyright © 2026 RUN APPAREL (PVT) LTD / Durus Industries. All rights reserved.

This is proprietary software. Unauthorized use, reproduction, or distribution is prohibited.
See [`LICENSE`](./LICENSE) for full terms.
