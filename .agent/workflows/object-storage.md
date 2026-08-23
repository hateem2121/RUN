---
description: Alias for /neon-object-storage — S3-compatible branchable object storage on Neon.
---

# /object-storage

**Description:** Alias for `/neon-object-storage`. S3-compatible object storage that branches with your Neon project.

**Usage:** `/object-storage [bucket | upload | presigned-url]`

## Agent Instructions

When the user invokes `/object-storage`, execute the `/neon-object-storage` workflow defined in `.agent/workflows/neon-object-storage.md` and consult `.agent/skills/neon-object-storage/SKILL.md`.
