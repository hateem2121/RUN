# Product & Engineering Roadmap

**Project:** RUN Remix (`run-remix`) — The Agentic Sportswear Factory  
**Owner:** RUN APPAREL (PVT) LTD / Durus Industries  
**Horizon:** 2026 – 2027  
**Status:** Active Living Document  

---

## 🎯 Vision

RUN Remix bridges heritage apparel craftsmanship (Durus Industries, est. 1889) with cutting-edge agentic software engineering. Our goal is to provide the world's most performant, deterministic, and future-proof open-source CMS platform for premium B2B sportswear manufacturing and custom apparel configuration.

---

## 🗺️ Roadmap Tracks

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│   Phase 1: Foundation   │ ──► │     Phase 2: Scale      │ ──► │  Phase 3: Intelligence  │
│   (v4.0 - v4.1 — DONE)  │     │   (Q3 2026 - Q4 2026)   │     │      (2027 Horizon)     │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## ✅ Completed Milestones (v4.0 – v4.1.2)

- [x] **Full-Stack Modernization**: React 19.2.7 + React Router v8 + Vite 8 (Rolldown) + Express 5.2.1.
- [x] **Database & ORM**: Neon Serverless PostgreSQL with Drizzle ORM 0.45.2 and Zod v4 validation.
- [x] **Deterministic Architecture**: Zero-tolerance rulebook (`gemini.md`), `neverthrow` Result patterns, strict monorepo module boundaries.
- [x] **Styling & Motion**: Tailwind CSS v4 `@theme` / `@utility` engine with GSAP 3.15 and locomotive-scroll.
- [x] **Cloud & Infrastructure**: Automated Google Cloud Build, GKE deployments, and Cloud Tasks background workers.
- [x] **Forensic Quality**: 100/100 Architecture Health Score, 590+ E2E automated tests, Biome linting, and automated SSR hydration integrity checks.

---

## 🚀 Near-Term Horizon (Q3 2026 – Q4 2026)

### 1. Open Source Community & Ecosystem
- [ ] **Community Standards**: Full compliance with [Open Source Guides](https://opensource.guide/), GitHub Issue Forms Suite, Code of Conduct, and Governance.
- [ ] **Developer Experience**: 1-click Dev Containers for GitHub Codespaces & VS Code on Node 24.
- [ ] **Supply Chain Hardening**: OpenSSF Scorecards, GitHub Dependency Review, and SLSA provenance tagging on all releases.

### 2. WebMCP & Agentic Form Protocols
- [ ] **Native WebMCP Forms**: Standardize `<form toolname="..." tooldescription="...">` across all public and admin workflows.
- [ ] **Agentic Event Handlers**: Native `event.nativeEvent.agentInvoked` support and streaming form responses for autonomous agentic pair programmers.

### 3. Next-Gen 3D Garment Configurator
- [ ] **Lazy 3D Engine**: Enhanced `LazyUnifiedModelViewer` with instant glTF streaming, real-time material shader swaps (nylon, recycled polyester, organic cotton), and AR quicklook.
- [ ] **Dynamic Colorway Engine**: Real-time Pantone and custom dye PMS preview with instant SVG vector decal mapping.

### 4. Observability & Telemetry
- [ ] **OpenTelemetry Exporters**: Native OTLP traces, metrics, and structured log shipping to OpenTelemetry collectors.
- [ ] **Real-Time Core Web Vitals**: In-app performance budget telemetry with automated threshold alerts.

---

## 🔮 Future Horizon (2027+)

### 1. Multi-Tenant Manufacturing Exchange
- [ ] **Tenant Isolation**: Secure row-level and schema-level multi-tenancy for global apparel brands and distributed manufacturing facilities.
- [ ] **Supply Chain EDI Integration**: Standardized ANSI X12 / EDIFACT electronic data interchange connectors for global logistics.

### 2. AI Fabric Optimization & Pattern Layout
- [ ] **Nesting & Yield Algorithms**: AI-assisted 2D pattern nesting to reduce fabric cutting waste toward 0% scrap.
- [ ] **Carbon & ESG Tracking**: Automated Product Carbon Footprint (PCF) calculation per garment based on raw material provenance.

---

## 💡 Submitting Roadmap Proposals

Have an idea for the roadmap?
1. Check existing proposals and discussions on GitHub Discussions.
2. Submit a feature proposal using the [Feature Request Issue Form](./.github/ISSUE_TEMPLATE/feature_request.yml).
3. For major architectural proposals, follow the RFC process outlined in [`GOVERNANCE.md`](./GOVERNANCE.md).
