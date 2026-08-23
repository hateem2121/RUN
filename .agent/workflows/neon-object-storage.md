---
description: S3-compatible object storage that branches with your Neon project for uploads, media, documents, and blobs.
---

# /neon-object-storage

**Description:** S3-compatible object storage that branches with your Neon project, keeping files and database tables in sync across every branch.

**Usage:** `/neon-object-storage [bucket | upload | presigned-url]`

## Agent Instructions

When the user invokes `/neon-object-storage` or `/object-storage`:
1. Read `.agent/skills/neon-object-storage/SKILL.md` for S3 API compatibility, presigned URL generation, and bucket configuration.
2. Implement branch-aware file storage workflows that synchronize media with database state across preview and development branches.
