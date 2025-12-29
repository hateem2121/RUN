#!/bin/bash
# lint-css-values.sh
# Checks for forbidden CSS patterns: magic z-indices and arbitrary widths

EXIT_CODE=0

echo "🔍 Checking for magic Z-Index values (z-10, z-50, etc.)..."
echo "   Allowed: z-0, z-modal, z-elevated, etc."
# Search for z- followed by a non-zero digit, or arbitrary values like z-[10]
MAGIC_Z=$(grep -rE "class(Name)?=.*z-([1-9][0-9]*|\[.*\])" client/src/components | grep -v "z-0")

if [ -n "$MAGIC_Z" ]; then
  echo "❌ Found magic Z-Index usage:"
  echo "$MAGIC_Z"
  # EXIT_CODE=1 # Warning only for now
else
  echo "✅ No magic Z-Index values found."
fi

echo ""
echo "🔍 Checking for arbitrary Width values (w-[...])..."
ARBITRARY_W=$(grep -rE "class(Name)?=.*w-\[[0-9]+px\]" client/src/components | head -n 5)

if [ -n "$ARBITRARY_W" ]; then
  echo "⚠️ Found arbitrary width usage (showing first 5):"
  echo "$ARBITRARY_W"
else
  echo "✅ No arbitrary width values found."
fi

exit $EXIT_CODE
