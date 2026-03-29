#!/bin/bash
# .agent/scripts/check-vite-config.sh

if [ -f "vite.config.js" ] && [ -f "vite.config.ts" ]; then
  echo "❌ CRITICAL ERROR: Both vite.config.js and vite.config.ts exist."
  echo "   This causes undefined build behavior."
  echo "   Please delete vite.config.js immediately."
  exit 1
fi

echo "✅ Vite config check passed."
exit 0
