#!/bin/bash
set -e

echo "☢️  Initiating Tailwind v4 Nuclear Remediation..."

# 1. Clean up Legacy Configs (Ghosts)
echo "👻 Exorcising legacy configuration files..."
rm -f tailwind.config.js tailwind.config.ts
rm -f postcss.config.js postcss.config.cjs postcss.config.mjs
rm -f .postcssrc .postcssrc.json .postcssrc.yml
rm -f client/tailwind.config.js client/postcss.config.js

# 2. Nuke Artifacts & Caches
echo "💥 Nuking artifacts and caches..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json # In case of accident
rm -rf client/dist
rm -rf client/.vite
rm -rf node_modules/.vite
rm -rf .vite

# 3. Clean Install Dependencies
echo "📦 Reinstalling dependencies (this may take a minute)..."
npm install

# 4. Check for Tailwind v4 presence
echo "🔍 Verifying Tailwind version..."
npm list tailwindcss @tailwindcss/vite || echo "⚠️ Warning: Tailwind packages not found in tree!"

echo "✅ Remediation complete."
