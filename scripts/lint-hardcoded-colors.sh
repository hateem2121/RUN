#!/bin/bash
# Detect hardcoded hex colors in className strings
# Part of CSS Architecture remediation - Phase 1 Task 1.5

echo "🔍 Scanning for hardcoded colors in classNames..."

# Pattern: bg-[#xxx], text-[#xxx], border-[#xxx], etc.
# Note: Some files are excluded as they use intentional inline styles or dev tools
VIOLATIONS=$(grep -rn "\(bg\|text\|border\|fill\|stroke\)-\[#" client/src --include="*.tsx" 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v "VisualContracts" | \
  grep -v "scroll-expansion-hero" | \
  grep -v "button-hover-multiple" | \
  grep -v "UnifiedModelViewer")

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Found hardcoded colors:"
  echo "$VIOLATIONS"
  echo ""
  echo "Replace with design tokens: bg-background, text-foreground, etc."
  echo "See design-tokens.ts for available tokens."
  exit 1
else
  echo "✅ No hardcoded colors found in classNames"
  exit 0
fi
