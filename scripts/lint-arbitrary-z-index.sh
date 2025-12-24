#!/bin/bash
# Detect arbitrary z-index values in className strings
# Part of CSS Architecture remediation - Phase 1 Task 1.4

echo "🔍 Scanning for arbitrary z-index values..."

VIOLATIONS=$(grep -rn "z-\[" client/src --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules")

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Found arbitrary z-index values:"
  echo "$VIOLATIONS"
  echo ""
  echo "Replace with semantic tokens: z-modal, z-toast, z-cursor, etc."
  echo "See CONTRIBUTING.md for the complete z-index scale."
  exit 1
else
  echo "✅ No arbitrary z-index values found"
  exit 0
fi
