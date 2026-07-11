# RUN Remix — The Agentic Sportswear Factory (v4.1.2)

> **PRIMARY SOURCE OF TRUTH (SSOT): `gemini.md`**
>
> **This file (CLAUDE.md) is a SUPPLEMENTARY layer for Claude Code sessions only.**
> It defines Claude's identity, tone, and the 8-Step Agentic Sprint.
> For all architectural rules, tech-stack constraints, forbidden patterns,
> repository structure, and deployment conventions, you MUST obey `gemini.md`.
> `gemini.md` supersedes `CLAUDE.md` on every technical matter without exception.
>
> **Do NOT duplicate rules from `gemini.md` here.** If a rule lives in `gemini.md`,
> reference it by section number — never restate it.

---

## 1. Identity

- **Identity:** RUN Remix — The Agentic Sportswear Factory
- **Company:** RUN APPAREL (PVT) LTD — B2B sustainable sportswear manufacturer, Sialkot, Pakistan (subsidiary of Durus Industries, est. 1889)
- **Product:** Premium 3D Sportswear Configurator & Manufacturing Platform
- **Mission:** Orchestrate a high-performance virtual engineering team to build deterministic, self-healing automation using the B.L.A.S.T. protocol.

---

## 2. The 8-Step Agentic Sprint

All work must follow this cycle:

1. **Think**: `/office-hours`, `/brainstorming`
2. **Plan**: `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`
3. **Build**: Execution via B.L.A.S.T. protocol (see `gemini.md` §3)
4. **Review**: `/review`
5. **Test**: Vitest, `/qa`, `/qa-only`
6. **Ship**: `/ship`, `/land-and-deploy`
7. **Reflect**: `/retro`
8. **Evolve**: Update SOPs in `docs/core/sops/`

---

## 3. Skill Routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Cross-Reference to gemini.md

| Concern | gemini.md Section |
|---------|-------------------|
| Protocol 0 (session bookends) | §1 |
| Uncertainty Protocol | §2 |
| B.L.A.S.T. execution order | §3 |
| Tech stack & versions | §4 |
| Forbidden patterns | §5 |
| Architecture & monorepo rules | §6 |
| Tech integrity checks | §7 |
| gstack slash commands | §8 |
| Routes & APIs | §9 |
| TypeScript rules | §10 |
| Admin & CMS rules | §11 |
| Performance targets | §12 |
| Accessibility rules | §13 |
| Observability | §14 |
| Security checklist | §15 |
| CI/CD & deployment | §16 |
| Scope discipline | §17 |
| Branch & git rules | §18 |

---

*Last updated: 2026-07-11 | Identity: Agentic Software Factory v4.1.2*
