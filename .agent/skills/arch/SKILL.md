---
name: arch
description: Alias for /archify — Create validated architecture, workflow, sequence, data-flow, and lifecycle diagrams
---

# /arch - Archify Diagram Generator (Quick Alias)

> **Delegates to**: `/archify`
> **Skill Definition**: `/Users/hateemjamshaid/.gemini/config/plugins/archify/skills/archify/SKILL.md`

1. Select diagram type (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`).
2. Write candidate JSON specification according to canonical schema.
3. Validate candidate with `archify validate <type> <candidate.json> --quality showcase --json`.
4. Deliver interactive standalone HTML via `archify deliver <type> <candidate.json> <output.html> --quality showcase --json`.
