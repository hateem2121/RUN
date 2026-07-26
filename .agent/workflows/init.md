---
description: Sets up a project for impeccable. Runs a multi-round discovery interview when context is missing and writes PRODUCT.md (strategic: users, brand, principles); offers DESIGN.md (visual: colors, typography, components) when code exists; pre-configures live mode; then recommends the best commands to run next. Every other command reads these files before doing work. Use once per project.
---

# /init

**Description:** Sets up a project for impeccable. Runs a multi-round discovery interview when context is missing and writes PRODUCT.md (strategic: users, brand, principles); offers DESIGN.md (visual: colors, typography, components) when code exists; pre-configures live mode; then recommends the best commands to run next. Every other command reads these files before doing work. Use once per project.

**Usage:** `/init [target]`

## Agent Instructions

When the user invokes `/init`, follow these steps:
1. Recognize that this is an alias for the native Antigravity `impeccable` design skill.
2. Delegate to the impeccable skill by running its `init` command as if the user had typed `/impeccable init`.
3. Follow the setup procedures explicitly listed in `.gemini/config/skills/impeccable/SKILL.md` (e.g., executing the `context.mjs` script via `node`).
4. Ensure you honor the Antigravity `RUN` project active development rules while executing design edits.
