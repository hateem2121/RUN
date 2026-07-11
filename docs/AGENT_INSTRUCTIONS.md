# Agent Instructions

**For:** AI Coding Agents (Antigravity, Claude Code, etc.)
**Version:** 4.1.2 (Protocol 0 Aligned)
**Last Updated:** July 2026

---

## 🏛️ Project Constitution

**Primary Source of Truth (SSOT):** [`gemini.md`](../gemini.md)

All agents working on this codebase MUST strictly adhere to the rules defined in
`gemini.md`. That document takes precedence over all other documentation, including
this file. Do NOT duplicate rules from `gemini.md` here.

**Supplementary files:**
- [`AGENTS.md`](../AGENTS.md) — Active development rules and hard constraints
- [`CLAUDE.md`](../CLAUDE.md) — Claude Code-specific identity and workflow (Claude sessions only)

---

## 🚀 Quick Start for New Agents

```bash
# 1. Read the constitution (mandatory first action)
cat gemini.md

# 2. Read active development rules
cat AGENTS.md

# 3. Check current sprint state
cat task_plan.md

# 4. Verify port compliance
npm run verify-port

# 5. Start dev server (port 5002 — always)
npm run dev
```

---

## 📋 Cross-Reference Guide

| Agent Concern | Where to Look |
|---------------|---------------|
| Tech stack, versions, forbidden patterns | `gemini.md` §4–§5 |
| Architecture, monorepo structure, import rules | `gemini.md` §6 |
| Session start/end protocol (Protocol 0) | `gemini.md` §1 |
| Uncertainty / ambiguity handling | `gemini.md` §2 |
| B.L.A.S.T. execution order | `gemini.md` §3 |
| Port 5002 compliance | `gemini.md` §4, `AGENTS.md`, `npm run verify-port` |
| Route creation (public + admin pairs) | `gemini.md` §9, `shared/route-manifest.ts` |
| Security checklist | `gemini.md` §15 |
| CI/CD pipeline rules | `gemini.md` §16 |
| gstack slash commands | `gemini.md` §8 |
| Tech integrity verification | `gemini.md` §7, `npm run verify:tech-integrity` |

---

**Remember:** When in doubt, read `gemini.md`. It is the single source of truth.
