#!/usr/bin/env bash
# Dynamically map gstack skills to .agents/skills for Antigravity native recognition
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
AGENTS_SKILLS_DIR="$REPO_ROOT/.agents/skills"

mkdir -p "$AGENTS_SKILLS_DIR"

for skill_dir in "$REPO_ROOT/.claude/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  # Skip 'gstack' base directory and 'scripts'
  if [ "$skill_name" != "gstack" ] && [ "$skill_name" != "scripts" ] && [ "$skill_name" != "*" ]; then
    # Remove old directory symlink if it exists
    if [ -L "$AGENTS_SKILLS_DIR/$skill_name" ]; then
      rm "$AGENTS_SKILLS_DIR/$skill_name"
    fi
    # Create real directory
    mkdir -p "$AGENTS_SKILLS_DIR/$skill_name"
    # Symlink the SKILL.md file inside
    ln -snf "../../../.claude/skills/$skill_name/SKILL.md" "$AGENTS_SKILLS_DIR/$skill_name/SKILL.md"
  fi
done

echo "GStack skills successfully registered to $AGENTS_SKILLS_DIR"
