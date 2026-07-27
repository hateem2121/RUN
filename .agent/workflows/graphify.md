---
description: Create a knowledge graph of the codebase, notes, or papers using Graphify. Use when the user types /graphify. It extracts concepts and relationships using vision models when needed and connects them into one graph.
---

# /graphify

**Description:** Create a knowledge graph of the codebase, notes, or papers using Graphify. Use when the user types `/graphify`. It extracts concepts and relationships using vision models when needed and connects them into one graph.

**Usage:** `/graphify [target] [options]`

## Agent Instructions

When the user invokes `/graphify`, follow these steps:
1. Identify the target path provided (e.g., `.` or `./raw` or a URL). If not provided, assume `.`.
2. Execute the `graphify` command in the terminal via the `run_command` tool (e.g., `graphify .`).
3. After the command completes, view the outputs generated in the `graphify-out/` folder.
4. Present the `graphify-out/GRAPH_REPORT.md` findings to the user, highlighting surprising connections, god nodes, or suggested questions.
