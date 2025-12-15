#!/bin/bash

# VS Code Extensions Setup Verification Script
# Run this after installing the recommended extensions

echo "🔍 Verifying VS Code Extension Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if code command is available
if ! command -v code &> /dev/null; then
    echo -e "${YELLOW}⚠️  VS Code 'code' command not found in PATH${NC}"
    echo "   To fix: Open VS Code -> Cmd+Shift+P -> 'Shell Command: Install code command in PATH'"
    echo ""
    SKIP_EXTENSION_CHECK=true
fi

# Check for extensions.json
if [ -f ".vscode/extensions.json" ]; then
    echo -e "${GREEN}✅ .vscode/extensions.json found${NC}"
    EXTENSION_COUNT=$(grep -c "\"" .vscode/extensions.json | head -1)
    echo "   📦 $EXTENSION_COUNT extension recommendations configured"
else
    echo -e "${RED}❌ .vscode/extensions.json not found${NC}"
fi

# Check for settings.json
if [ -f ".vscode/settings.json" ]; then
    echo -e "${GREEN}✅ .vscode/settings.json found${NC}"
    
    # Check for specific settings
    if grep -q "editor.formatOnSave" .vscode/settings.json; then
        echo "   ✓ Auto-format on save enabled"
    fi
    
    if grep -q "tailwindCSS.experimental.classRegex" .vscode/settings.json; then
        echo "   ✓ TailwindCSS class detection configured"
    fi
else
    echo -e "${RED}❌ .vscode/settings.json not found${NC}"
fi

# Check for Prettier config
if [ -f ".prettierrc" ]; then
    echo -e "${GREEN}✅ .prettierrc found${NC}"
else
    echo -e "${YELLOW}⚠️  .prettierrc not found${NC}"
fi

# Check for ESLint config
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
    echo -e "${GREEN}✅ ESLint config found${NC}"
else
    echo -e "${YELLOW}⚠️  ESLint config not found (optional)${NC}"
fi

echo ""
echo "📋 Recommended Extensions List:"
echo "─────────────────────────────────────"

# Parse and display extensions
if [ -f ".vscode/extensions.json" ]; then
    grep '".*\\..*"' .vscode/extensions.json | grep -v '//' | sed 's/.*"\(.*\)".*/  • \1/' | head -20
fi

echo ""
echo "🚀 Next Steps:"
echo "─────────────────────────────────────"
echo "1. Open this project in VS Code"
echo "2. Look for notification: 'This workspace has extension recommendations'"
echo "3. Click 'Install All' or 'Show Recommendations'"
echo "4. Restart VS Code after installation"
echo ""
echo "To manually install extensions:"
echo "  • Open Command Palette (Cmd+Shift+P)"
echo "  • Type: 'Extensions: Show Recommended Extensions'"
echo "  • Click cloud icon to install all"
echo ""

# Check if running in VS Code integrated terminal
if [ -n "$TERM_PROGRAM" ] && [ "$TERM_PROGRAM" = "vscode" ]; then
    echo -e "${GREEN}✅ Running in VS Code integrated terminal${NC}"
    echo "   Extensions notification should appear automatically"
else
    echo -e "${YELLOW}⚠️  Not running in VS Code integrated terminal${NC}"
    echo "   Open this project in VS Code to see extension recommendations"
fi

echo ""
echo "✨ Setup verification complete!"
