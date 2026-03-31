# Standard Operating Procedure: The Agentic Sprint (v4.0)

## 🎯 Purpose

To establish a deterministic, high-velocity development cycle for the **RUN Remix Agentic Software Factory** using the `gstack` slash commands.

## 🏗️ The 8-Step High-Performance Cycle

### 1. 🧠 Think (Extraction)

- **Role**: CEO / Founder
- **Command**: `/office-hours` (followed by specific product brainstorming)
- **Goal**: Challenge hypotheses, extract the "Narrow Wedge," and define the vision for a feature. Do not talk implementation here; focus on the "Why."

### 2. 📝 Plan (Alignment)

- **Role**: CEO & Eng Manager
- **Commands**: `/plan-ceo-review`, `/plan-eng-review`
- **Ritual**: Update `task_plan.md`. Create a detailed implementation plan artifact.
- **Output**: A fully reviewed and approved blueprint (L1 Architecture).

### 3. 🏗️ Build (Architecture)

- **Role**: Full Stack Engineer
- **Protocol**: **B.L.A.S.T.**
  - **Blueprint**: Define schemas and logic in shared/.
  - **Link/Architect**: Build THIN routes and THICK services.
- **Goal**: Minimum Viable Logic.

### 4. 🔍 Review (Forensics)

- **Role**: Senior Reviewer
- **Command**: `/review`
- **Checklist**:
  - Zero `any` types.
  - Zero `try/catch` in Express 5 handlers.
  - Zero `forwardRef` in React 19.
  - Zero arbitrary Tailwind values in JSX.

### 5. 🧪 Test (Verification)

- **Role**: QA Lead
- **Commands**: `npm run test`, `/qa <staging-url>`
- **Budget**: 80%+ coverage on services. No visual regression deviations.

### 6. 🚢 Ship (Deployment)

- **Role**: Release Engineer
- **Commands**: `/ship`, `/land-and-deploy`
- **Output**: An atomic deployment following the Cloud Run canary strategy.

### 7. 🪞 Reflect (Retrospection)

- **Role**: Team Lead
- **Command**: `/retro`
- **Ritual**: Update `findings.md`. Log any "unlearned lessons" or system friction.

### 8. 🧬 Evolve (Self-Annealing)

- **Role**: Systems Architect
- **Action**: Patch scripts, update SOPs, and "anneal" the system so that friction never repeats.

---

## 🚫 Stop-Gaps (Mandatory)

- No **BUILD** before **PLAN** approval.
- No **SHIP** before **REVIEW** and **TEST** passes.
- No **COMPLETE** before `npm run verify:tech-integrity` exits 0.

---

*Version: 1.0.0 | Updated: 2026-03-31 | RUN Remix v4.0.0*
