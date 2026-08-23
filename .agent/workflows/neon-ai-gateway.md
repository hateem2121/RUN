---
description: One API and credential for frontier and open-source LLMs (OpenAI, Anthropic, Gemini, DeepSeek, etc.) built into your Neon branch.
---

# /neon-ai-gateway

**Description:** One API and one credential for frontier and open-source LLMs, built into your Neon branch and powered by Databricks. Route between model providers (OpenAI, Anthropic, Google/Gemini, Meta) with unified authentication and logging.

**Usage:** `/neon-ai-gateway [model | config | prompt]`

## Agent Instructions

When the user invokes `/neon-ai-gateway` or `/ai-gateway`:
1. Read `.agent/skills/neon-ai-gateway/SKILL.md` for AI Gateway endpoints, supported models, and SDK setup (OpenAI SDK, Anthropic SDK, Vercel AI SDK, Mastra).
2. Configure or inspect the unified model routing layer on the Neon branch.
3. Ensure AI requests and configurations branch cleanly with the database.
