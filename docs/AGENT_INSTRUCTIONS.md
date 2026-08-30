# Agent Instructions

**For:** AI Coding Agents (Antigravity, Claude Code, etc.)  
**Version:** 4.1.2 (Protocol 0 Aligned)  
**Last Updated:** August 2026  

---

## 🏛️ Project Constitution

**Primary Source of Truth (SSOT):** [`gemini.md`](../gemini.md)

All agents working on this codebase MUST strictly adhere to the rules defined in `gemini.md`. That document takes precedence over all other documentation, including this file. Do NOT duplicate rules from `gemini.md` here.

**Supplementary files:**
- [`AGENTS.md`](../AGENTS.md) — Active development rules, testing guardrails, and environment invariants.

---

## 🚀 Quick Start for New Agents

```bash
# 1. Read the constitution (mandatory first action)
cat gemini.md

# 2. Read active development rules
cat AGENTS.md

# 3. Check current sprint state
cat task_plan.md

# 4. Verify tech integrity & port compliance
npm run verify:tech-integrity

# 5. Start dev server (port 5002 — always)
npm run dev
```

---

## 📋 Cross-Reference Guide

| Agent Concern | Where to Look |
| :--- | :--- |
| **Tech Stack, Versions & Invariants** | `gemini.md` §1 |
| **Forbidden Patterns & Zero Tolerance** | `gemini.md` §2.1 |
| **Tooling & System Invariants** | `gemini.md` §2.2 |
| **Architecture & Service Patterns** | `gemini.md` §3 |
| **Protocol 0 Verification (8 Gates)** | `gemini.md` §4, `npm run verify:tech-integrity` |
| **Knowledge Graph & MCP Tools** | `gemini.md` §5 |
| **Testing & Playwright Guardrails** | `AGENTS.md` §2 |
| **WCAG 2.2 Accessibility Standards** | `AGENTS.md` §2 |
| **Markdown & Git Hygiene** | `AGENTS.md` §3 |

---

**Remember:** When in doubt, read `gemini.md`. It is the single source of truth.
