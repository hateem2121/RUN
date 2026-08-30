# Global Superpowers Skills & Slash Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install, download, wire, and register all 14 skills from `https://github.com/obra/superpowers` into machine-global Google Antigravity configuration so they are universally available across any project and triggered via `/` slash commands.

**Architecture:** Maintain a global plugin clone at `~/.gemini/config/plugins/superpowers/`, generate universal, project-agnostic workflow files in `~/.gemini/config/workflows/<skill-name>.md` for each skill, and provide an automated sync script `~/.gemini/config/scripts/sync-superpowers.sh`.

**Tech Stack:** Google Antigravity Plugin & Workflow System, Git, Bash / Node.js, Markdown.

**Spec:** [`docs/superpowers/specs/2026-08-24-global-superpowers-installation-design.md`](file:///Users/hateemjamshaid/Sites/RUN/docs/superpowers/specs/2026-08-24-global-superpowers-installation-design.md)

## Global Constraints

- Global plugin location: `~/.gemini/config/plugins/superpowers`
- Global workflows location: `~/.gemini/config/workflows`
- Slash commands format: Full skill names (`/brainstorming`, `/systematic-debugging`, `/test-driven-development`, etc.)
- Workflows must be 100% project-agnostic with zero hardcoded repository dependencies.

---

### Task 1: Verify & Sync Upstream Superpowers Repository

**Files:**
- Modify: `~/.gemini/config/plugins/superpowers/plugin.json`
- Verify: `~/.gemini/config/plugins/superpowers/skills/*/SKILL.md`

**Interfaces:**
- Consumes: `https://github.com/obra/superpowers.git`
- Produces: Complete, updated local repository with all 14 skills and plugin manifests

- [ ] **Step 1: Fetch and pull latest changes from upstream**
  Ensure working directory is clean and up to date with `origin/main`.
- [ ] **Step 2: Validate all 14 skills exist with frontmatter**
  Verify `brainstorming`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills`.
- [ ] **Step 3: Verify plugin manifest**
  Ensure `plugin.json` and `gemini-extension.json` are properly formatted.

---

### Task 2: Implement Automated Synchronization Script (`sync-superpowers.sh`)

**Files:**
- Create: `~/.gemini/config/scripts/sync-superpowers.sh`

**Interfaces:**
- Consumes: `~/.gemini/config/plugins/superpowers/skills/`
- Produces: Executable synchronization utility that updates upstream git and generates workflow markdown files

- [ ] **Step 1: Write `~/.gemini/config/scripts/sync-superpowers.sh`**
  Script pulls latest git updates, iterates through every skill directory, extracts name/description frontmatter, and generates universal workflow files into `~/.gemini/config/workflows/<skill-name>.md`.
- [ ] **Step 2: Make executable and test dry-run**
  Set `chmod +x ~/.gemini/config/scripts/sync-superpowers.sh` and execute.

---

### Task 3: Clean & Generate Universal Global Workflows

**Files:**
- Create/Modify: `~/.gemini/config/workflows/brainstorming.md`
- Create/Modify: `~/.gemini/config/workflows/dispatching-parallel-agents.md`
- Create/Modify: `~/.gemini/config/workflows/executing-plans.md`
- Create/Modify: `~/.gemini/config/workflows/finishing-a-development-branch.md`
- Create/Modify: `~/.gemini/config/workflows/receiving-code-review.md`
- Create/Modify: `~/.gemini/config/workflows/requesting-code-review.md`
- Create/Modify: `~/.gemini/config/workflows/subagent-driven-development.md`
- Create/Modify: `~/.gemini/config/workflows/systematic-debugging.md`
- Create/Modify: `~/.gemini/config/workflows/test-driven-development.md`
- Create/Modify: `~/.gemini/config/workflows/using-git-worktrees.md`
- Create/Modify: `~/.gemini/config/workflows/using-superpowers.md`
- Create/Modify: `~/.gemini/config/workflows/verification-before-completion.md`
- Create/Modify: `~/.gemini/config/workflows/writing-plans.md`
- Create/Modify: `~/.gemini/config/workflows/writing-skills.md`

**Interfaces:**
- Consumes: `~/.gemini/config/scripts/sync-superpowers.sh`
- Produces: 14 clean, universal Antigravity slash commands

- [ ] **Step 1: Clean legacy project-specific workflow files from `~/.gemini/config/workflows/`**
- [ ] **Step 2: Execute generator to write all 14 full-name workflows**
- [ ] **Step 3: Verify markdown formatting and frontmatter validity**

---

### Task 4: End-to-End Verification & Validation

**Files:**
- Audit: `~/.gemini/config/workflows/`
- Audit: `~/.gemini/config/plugins/superpowers/`

- [ ] **Step 1: Test `sync-superpowers.sh` end-to-end**
- [ ] **Step 2: Verify all 14 slash commands are available**
- [ ] **Step 3: Run repository integrity checks (`npm run check:docs`, `npm run check:md`)**
