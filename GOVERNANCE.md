# Project Governance

**Project:** RUN Remix (`run-remix`) — The Agentic Sportswear Factory  
**Organization:** RUN APPAREL (PVT) LTD / Durus Industries (est. 1889)  
**Governance Model:** Founder-Led (BDFL) with Structured Maintainer Ladder & Subsystem Ownership  
**Last Updated:** August 2026  

---

## 1. Overview

RUN Remix is an open-source, AI-native B2B sportswear CMS and Agentic Software Factory. Our governance model is designed to maintain high technical integrity, deterministic standards (the **B.L.A.S.T.** protocol), and architectural coherence while fostering an open, inclusive, and active contributor community.

---

## 2. Roles and Responsibilities

### 2.1 Project Lead (Benevolent Dictator for Life - BDFL)

- **Current Lead:** M. Hateem Jamshaid (`@hateemjamshaid`) — Business Development Director, RUN APPAREL (PVT) LTD.
- **Responsibilities:**
  - Sets the overarching strategic roadmap and architectural vision.
  - Final decision-maker on contentious RFCs, licensing, and breaking architectural paradigms.
  - Grants and revokes Maintainer and Subsystem Owner permissions.

### 2.2 Core Maintainers

- **Responsibilities:**
  - Active triage, code review, and merging of Pull Requests.
  - Ensuring strict compliance with `gemini.md` (SSOT), Biome linting, and zero-error test suites.
  - Participating in release drafting, security advisories, and dependency maintenance.
  - Mentoring new contributors and reviewing RFC proposals.

### 2.3 Subsystem Owners

- **Responsibilities:**
  - Subject-matter experts responsible for specific modules within the monorepo:
    - **Frontend & 3D:** `@run-remix/client`, Tailwind v4, 3D glTF viewers, GSAP animations.
    - **Backend & Data:** `@run-remix/server`, Express 5, Neon PostgreSQL, Drizzle ORM, Google Cloud Tasks.
    - **Shared Contracts:** `@run-remix/shared`, Zod schemas, route manifests, type definitions.
    - **Security & CI/CD:** GitHub Actions workflows, OpenSSF Scorecards, Cloud Build, Docker.

### 2.4 Reviewers

- **Responsibilities:**
  - Regular contributors with domain expertise who review community pull requests and verify test coverage.

### 2.5 Contributors

- **Responsibilities:**
  - Any individual who submits code, documentation, bug reports, feature requests, or design improvements adhering to the [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guide](./CONTRIBUTING.md).

---

## 3. Maintainer Ladder & Progression

We believe in meritocratic progression based on sustained quality, technical alignment, and community stewardship.

```
┌────────────────────────────────────────────────────────┐
│                      Project Lead                      │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                    Core Maintainers                    │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│             Reviewers & Subsystem Owners               │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                   Active Contributors                  │
└────────────────────────────────────────────────────────┘
```

### Path to Reviewer

1. Submit at least 5 high-quality merged pull requests (features, bug fixes, or test enhancements).
2. Demonstrate strong familiarity with the B.L.A.S.T. protocol, TypeScript strict typing, and `gemini.md` constraints.
3. Nominated by an existing Maintainer and approved by the Project Lead.

### Path to Core Maintainer

1. Active participation as a Reviewer for at least 3 months.
2. Consistent technical judgment, adherence to security practices, and empathetic code reviews.
3. Unanimous approval from existing Core Maintainers and confirmation by the Project Lead.

---

## 4. Decision-Making & RFC Process

### 4.1 Daily Decisions (Lazy Consensus)

For bug fixes, documentation updates, dependency bumps, performance optimizations, and non-breaking improvements:
- Requires review and approval from at least **one Core Maintainer** or **Subsystem Owner**.
- Automated CI checks (`npm run verify:tech-integrity`, typecheck, lint, tests) must be 100% green.

### 4.2 Major Architectural Changes (RFC Process)

For changes that impact:
- Core data contracts in `@run-remix/shared`
- Breaking API route changes or schema migrations
- Introduction or replacement of core infrastructure dependencies
- Modifications to the governance model or security baseline

**Process:**
1. Open a discussion or issue prefixed with `[RFC]: <Title>`.
2. Detail the Motivation, Architectural Design, Alternatives Considered, Breaking Changes, and Migration Plan.
3. Maintain a minimum 7-day review period for community feedback.
4. Core Maintainers deliberate toward consensus. In the event of an impasse, the Project Lead provides the final binding decision.

---

## 5. Security & Confidentiality

Security disclosures and CVE handling are governed under [`SECURITY.md`](./SECURITY.md). Core Maintainers with security triage privileges are bound by strict confidentiality until a security patch and public advisory are published.

---

## 6. Offboarding and Emeritus Status

Maintainers who are inactive for 6 months will be transitioned to **Emeritus Maintainer** status to keep repository write permissions clean and secure. Emeritus maintainers may be reinstated upon renewed active engagement.
