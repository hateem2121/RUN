---
name: agent-teams
description: |
  Orchestrate teams of Claude Code sessions. Coordinate multiple Claude Code instances working together as a team with shared tasks, messaging, and centralized management.
  Triggers:
  - "agent teams", "create team", "teammate", "split panes"
  - "experimental feature", "parallel work", "delegate mode"
---

# Agent Teams

Coordinate multiple Claude Code instances working together as a team, with shared tasks, inter-agent messaging, and centralized management.

## Setup
Experimental feature. Enabled via `settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## When to Use
- **Research and review**: Multiple teammates investigate different aspects simultaneously.
- **New modules or features**: Teammates each own a separate piece.
- **Debugging with competing hypotheses**: Test different theories in parallel.
- **Cross-layer coordination**: Spanning frontend, backend, and tests.

## Key Concepts
- **Team Lead**: One session coordinating work, assigning tasks, and synthesizing results.
- **Teammates**: Work independently in their own context windows.
- **Shared Task List**: Claim work and track progress.
- **Display Modes**: 
    - `in-process`: All inside one terminal (Shift+Up/Down to cycle).
    - `split panes`: Each gets their own pane (requires tmux or iTerm2).

## Tools & Commands
- **Create**: "Create an agent team for [task] with [structure]."
- **Delegate Mode**: Press `Shift+Tab` to make the lead coordination-only.
- **Plan Approval**: "Require plan approval before they make any changes."
- **Shutdown**: "Ask the [name] teammate to shut down."
- **Cleanup**: "Clean up the team."

## Best Practices
- **Parallel Work**: Best when teammates can operate independently.
- **Context**: Teammates don't inherit lead's history; include task details in spawn prompt.
- **File Conflicts**: Avoid multiple teammates editing the same file.
- **Quality Gates**: Use hooks like `TeammateIdle` or `TaskCompleted`.
