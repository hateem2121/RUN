#!/bin/bash

# Extension Availability Checker
# Checks which recommended extensions are actually available in VS Code marketplace

echo "🔍 Checking Extension Availability..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Extensions from our list
declare -a extensions=(
    "drizzle-kit.drizzle-kit"
    "bradlc.vscode-tailwindcss"
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
    "usernamehw.errorlens"
    "ckolkman.vscode-postgres"
    "rangav.vscode-thunder-client"
    "googlecloudtools.cloudcode"
    "mattpocock.ts-error-translator"
    "zenclabs.reactpreview"
    "wallabyjs.console-ninja"
    "cesium.gltf-vscode"
    "vitest.explorer"
    "ryanluker.vscode-coverage-gutters"
    "christian-kohler.path-intellisense"
    "formulahendry.auto-rename-tag"
    "wix.vscode-import-cost"
    "aaron-bond.better-comments"
    "mhutchie.git-graph"
    "mikestead.dotenv"
)

echo "📋 Extension Status:"
echo ""

successful=()
failed=()

for ext in "${extensions[@]}"; do
    # Try to get extension info (this will fail if extension doesn't exist)
    if code --install-extension "$ext" --force 2>&1 | grep -q "successfully\|already installed"; then
        echo -e "${GREEN}✓${NC} $ext"
        successful+=("$ext")
    else
        echo -e "${RED}✗${NC} $ext"
        failed+=("$ext")
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Available: ${#successful[@]}${NC}"
echo -e "${RED}✗ Failed: ${#failed[@]}${NC}"
echo ""

if [ ${#failed[@]} -gt 0 ]; then
    echo "❌ Failed Extensions:"
    for ext in "${failed[@]}"; do
        echo "   - $ext"
    done
    echo ""
    echo "💡 These extensions may be:"
    echo "   • Deprecated or renamed"
    echo "   • Not available in marketplace"
    echo "   • Require specific VS Code version"
fi

echo ""
echo "Run this if you see failures and want alternatives."
