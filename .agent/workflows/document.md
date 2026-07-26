---
description: Generate a DESIGN.md file that captures the current visual design system. Auto-extracts colors, typography, spacing, radii, and component patterns from the codebase, then asks the user to confirm descriptive language for atmosphere and color character. Follows the Google Stitch DESIGN.md format so the file is tool-compatible. Use when you need a visual design spec an AI agent can follow to stay on-brand.
---

# /document

**Description:** Generate a DESIGN.md file that captures the current visual design system. Auto-extracts colors, typography, spacing, radii, and component patterns from the codebase, then asks the user to confirm descriptive language for atmosphere and color character. Follows the Google Stitch DESIGN.md format so the file is tool-compatible. Use when you need a visual design spec an AI agent can follow to stay on-brand.

**Usage:** `/document [target]`

## Agent Instructions

When the user invokes `/document`, follow these steps:
1. Recognize that this is an alias for the native Antigravity `impeccable` design skill.
2. Delegate to the impeccable skill by running its `document` command as if the user had typed `/impeccable document`.
3. Follow the setup procedures explicitly listed in `.gemini/config/skills/impeccable/SKILL.md` (e.g., executing the `context.mjs` script via `node`).
4. Ensure you honor the Antigravity `RUN` project active development rules while executing design edits.
