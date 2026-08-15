# Contributing to RUN Remix

Welcome to **RUN Remix**! We are delighted you're interested in contributing to the open-source **Agentic Sportswear Factory**.

RUN Remix powers digital manufacturing and custom 3D sportswear technology for **RUN APPAREL (PVT) LTD** (a subsidiary of Durus Industries, est. 1889). We maintain a 100% B2B, premium sustainable manufacturing identity. Our software must reflect the same flawless precision, performance, and deterministic reliability as our physical sportswear.

The single source of truth for architectural constraints is [`gemini.md`](./gemini.md).

---

## 📜 Code of Conduct

All contributors and maintainers are expected to uphold the [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md). Please report any unacceptable behavior to `hateem@runapparel.com`.

---

## ⚡ Quick Onboarding & Environment Setup

### Option A: 1-Click Cloud Development (Recommended)
You can launch an instant, pre-configured development environment in your browser using **GitHub Codespaces** or VS Code Dev Containers:

1. Click **Code > Codespaces > Create codespace on main**.
2. The Dev Container automatically provisions Node 24, installs dependencies, configures Biome, forwards port **5002**, and executes integrity checks.

### Option B: Local Machine Setup

**Prerequisites:**
- **Node.js:** `v24.0.0` or newer (`node --version`)
- **npm:** `v10.9.2` or newer
- **Git**

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/RUN.git
cd RUN

# 2. Install monorepo dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Verify system integrity
npm run verify:tech-integrity

# 5. Launch development server (Starts on port 5002)
npm run dev
```

---

## 🛠️ Contribution Workflow

We follow standard GitHub flow with branch-based pull requests.

1. **Find or Open an Issue:** Check [open issues](https://github.com/hateem2121/RUN/issues). For bugs or features, use the structured [GitHub Issue Forms](./.github/ISSUE_TEMPLATE/).
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/3d-pantone-swatches
   # or
   git checkout -b fix/auth-session-rotation
   ```
3. **Follow the B.L.A.S.T. Protocol:**
   - **Blueprint:** Map schemas and types before code.
   - **Link:** Verify API contracts and Zod schemas in `@run-remix/shared`.
   - **Architect:** Structure logic cleanly (Routes -> Services with `neverthrow` Results).
   - **Stylize:** Use Tailwind v4 `@theme` design tokens and GSAP animations.
   - **Trigger:** Verify against test suites and CI checks.

---

## 🛡️ Core Technical Invariants

| Rule / Subsystem | Strict Requirement |
|------------------|--------------------|
| **Dev Port** | **5002 exclusively**. Never 3000, 8080, or arbitrary ports. |
| **Monorepo Boundaries** | Import shared schemas only via barrel exports (`@shared/index` or `@run-remix/shared`). Never use deep schema paths. |
| **React 19** | Raw `ref` props (never `forwardRef`). Named exports for components; default exports for leaf route files. |
| **Express 5** | Route handlers are thin controllers. No `try/catch` in routes. Never raw `throw` in `server/services/`. Return `neverthrow` `ResultAsync`. |
| **Database & Sessions** | Parameterized Drizzle ORM queries only (no raw SQL). Session store uses `DrizzleSessionStore` (Neon PostgreSQL). |
| **CSS & Design** | Tailwind CSS v4 `@theme` tokens only. No arbitrary pixel classes in JSX (`w-[342px]` is forbidden). |
| **3D Viewer** | `LazyUnifiedModelViewer` only. Never `@react-three/fiber`, `drei`, or raw `useGLTF`. |
| **Motion** | `gsap` + `ScrollTrigger` and `locomotive-scroll`. Never `framer-motion` or `lenis`. |
| **Linting & Types** | Biome 2.5 (`npm run check:apply`) and TypeScript 6 strict mode (0 errors, no `any`). |

---

## 📝 Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(products): add 3D Pantone swatch configurator
fix(session): stabilize DrizzleSessionStore touch interval
docs(governance): clarify RFC submission process
refactor(server): wrap external tax service with opossum circuit breaker
test(e2e): add visual regression coverage for mobile viewports
```

---

## 🔍 Pre-PR Verification Checklist

Before submitting your Pull Request, execute the verification suite:

```bash
npm run check:apply           # Biome format & lint auto-fix
npm run typecheck             # Strict TypeScript verification (0 errors)
npm run verify:tech-integrity # Monorepo integrity suite (all checks exit 0)
npm run test                  # Vitest unit & integration tests
```

---

## 👥 Governance & Community

- **Governance Model:** Detailed in [`GOVERNANCE.md`](./GOVERNANCE.md).
- **Roadmap:** High-level milestones tracked in [`ROADMAP.md`](./ROADMAP.md).
- **Security:** Private vulnerability reports must follow [`SECURITY.md`](./SECURITY.md).
- **Discussions:** General questions and architecture ideas belong in GitHub Discussions (`<repository-url>/discussions`).

Thank you for helping engineer the future of sustainable sportswear technology.

**RUN APPAREL (PVT) LTD** — Sialkot, Pakistan | Subsidiary of Durus Industries (est. 1889)

