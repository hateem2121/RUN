#!/bin/bash

# Define banned patterns
BANNED_PATTERNS=(
  "z-\["
  "min-h-\["
  "w-\["
  "shadow-\["
  "h-\["
  "min-w-\["
  "max-h-\["
  "max-w-\["
  "duration-\["
  "delay-\["
)

# Directory to scan
SCAN_DIR="client/src"

# Files to exclude (add using standard grep exclude syntax if needed)
# Currently scanning all .tsx files in SCAN_DIR

echo "🔍 Scanning for banned CSS patterns in $SCAN_DIR..."

EXIT_CODE=0

for pattern in "${BANNED_PATTERNS[@]}"; do
  # Use grep to find the pattern recursively in .tsx files
  # -r: recursive
  # -n: line number
  # --include: only check tsx files
  # Escaped pattern for grep
  RESULTS=$(grep -r -n --include="*.tsx" "$pattern" "$SCAN_DIR")
  
  if [ ! -z "$RESULTS" ]; then
    echo "❌ Banned pattern found: '$pattern'"
    echo "$RESULTS" | while read -r line; do
        echo "  - $line"
    done
    echo ""
    EXIT_CODE=1
  fi
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No banned CSS patterns found."
else
  echo "⚠️  Please fix the above violations by replacing arbitrary values with standard tokens or theme variables."
  echo "   Exceptions allowed only for truly unique 'hero' animations."
fi

exit $EXIT_CODE
