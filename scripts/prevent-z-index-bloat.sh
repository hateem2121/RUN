#!/bin/bash

# Configuration
SEARCH_DIR="client/src"
FORBIDDEN_PATTERN="z-\[[0-9]"
ALLOWLIST_FILE="scripts/.z-index-allowlist"
SCRIPT_DIR="scripts"

# Ensure script directory exists
mkdir -p "$SCRIPT_DIR"

# Create allowlist if it doesn't exist
touch "$ALLOWLIST_FILE"

echo "🔍 Scanning for arbitrary Z-Index values ($FORBIDDEN_PATTERN) in $SEARCH_DIR..."

# Find all matches
MATCHES=$(grep -rE "$FORBIDDEN_PATTERN" "$SEARCH_DIR" | grep -vFf "$ALLOWLIST_FILE")

if [ -n "$MATCHES" ]; then
  echo "❌ Error: Arbitrary Z-Index values detected!"
  echo "---------------------------------------------------------"
  echo "Policy: Use design tokens (z-modal, z-dock, etc.) instead of arbitrary numeric values."
  echo "Existing violations are allowed via $ALLOWLIST_FILE."
  echo ""
  echo "Violations:"
  echo "$MATCHES"
  echo ""
  echo "Action Required:"
  echo "1. Replace 'z-[...]' with a standard token (e.g. z-10, z-50)."
  echo "2. If absolutely necessary, add the exact line to $ALLOWLIST_FILE to bypass."
  echo "---------------------------------------------------------"
  exit 1
else
  echo "✅ No new arbitrary Z-Index violations found."
  exit 0
fi
