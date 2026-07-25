# RUN Remix — The Agentic Sportswear Factory (v4.1.2)

> **PRIMARY SOURCE OF TRUTH (SSOT): `gemini.md`**
>
> This file (`CLAUDE.md`) is a supplementary layer containing Claude Code-native behavior only (identity, tone, and the 8-Step Agentic Sprint). 
> For all architectural rules, tech-stack constraints, forbidden patterns, repository structure, and deployment conventions, you MUST obey `gemini.md`. `gemini.md` is the absolute Single Source of Truth (SSOT) for this repository and always takes precedence.
> Do NOT duplicate technical rules from `gemini.md` here.
> **MCP Tool Stack:** See `MCP.md` for MCP server registry and priority ladder.

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

*Last updated: 2026-07-11 | Identity: Agentic Software Factory v4.1.2*

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
