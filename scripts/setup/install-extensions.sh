#!/bin/bash

# VS Code Extensions Auto-Installer
# Installs all recommended extensions for RUN-Remix project

echo "🚀 Installing VS Code Extensions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if code command is available
if ! command -v code &> /dev/null; then
    echo -e "${RED}❌ VS Code 'code' command not found!${NC}"
    echo ""
    echo "To install the 'code' command:"
    echo "1. Open VS Code"
    echo "2. Press: Cmd+Shift+P"
    echo "3. Type: 'Shell Command: Install code command in PATH'"
    echo "4. Press Enter"
    echo "5. Restart terminal"
    echo "6. Run this script again"
    echo ""
    echo -e "${YELLOW}OR manually install extensions from VS Code:${NC}"
    echo "1. Open this project in VS Code"
    echo "2. Click notification: 'This workspace has extension recommendations'"
    echo "3. Click 'Install All'"
    exit 1
fi

echo -e "${GREEN}✅ VS Code CLI found${NC}"
echo ""

# Extension list (December 2025 - VERIFIED WORKING)
declare -a extensions=(
    # Essential Development
    "rphlmr.drizzle-lab"
    "bradlc.vscode-tailwindcss"
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
    "usernamehw.errorlens"
    
    # Database & Backend
    "ckolkman.vscode-postgres"
    "rangav.vscode-thunder-client"
    
    # Cloud & DevOps
    "googlecloudtools.cloudcode"
    
    # TypeScript & React
    "mattpocock.ts-error-translator"
    "previewjs.previewjs"
    "wallabyjs.console-ninja"
    
    # 3D Development
    "cesium.gltf-vscode"
    
    # Testing
    "vitest.explorer"
    "ryanluker.vscode-coverage-gutters"
    
    # Productivity
    "christian-kohler.path-intellisense"
    "formulahendry.auto-rename-tag"
    "wix.vscode-import-cost"
    "aaron-bond.better-comments"
    "mhutchie.git-graph"
    "mikestead.dotenv"
)

total=${#extensions[@]}
installed=0
failed=0

echo "📦 Installing $total extensions..."
echo ""

# Install each extension
for ext in "${extensions[@]}"; do
    echo -n "Installing $ext... "
    
    if code --install-extension "$ext" --force > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((installed++))
    else
        echo -e "${RED}✗${NC}"
        ((failed++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Installation Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Installed: $installed/$total${NC}"

if [ $failed -gt 0 ]; then
    echo -e "${RED}❌ Failed: $failed${NC}"
fi

echo ""
echo "🎉 Extension installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart VS Code: Cmd+Shift+P → 'Developer: Reload Window'"
echo "2. Check installed extensions: Cmd+Shift+X"
echo "3. Verify settings in .vscode/settings.json"
echo ""
echo "Happy coding! 🚀"
