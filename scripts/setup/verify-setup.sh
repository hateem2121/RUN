#!/bin/bash
set -euo pipefail

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
    # We continue but warn
else
    echo -e "${GREEN}✅ VS Code CLI found${NC}"
fi

# Check for extensions.json
if [ -f ".vscode/extensions.json" ]; then
    echo -e "${GREEN}✅ .vscode/extensions.json found${NC}"
    
    # Use Node to count recommmended extensions reliably
    EXTENSION_COUNT=$(node -e '
      const fs = require("fs");
      const content = fs.readFileSync(".vscode/extensions.json", "utf8");
      const jsonContent = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      try {
        const json = JSON.parse(jsonContent);
        console.log(json.recommendations ? json.recommendations.length : 0);
      } catch (e) {
        console.log("0");
      }
    ')
    
    echo "   📦 $EXTENSION_COUNT extension recommendations configured"
else
    echo -e "${RED}❌ .vscode/extensions.json not found${NC}"
fi

# Check for settings.json
if [ -f ".vscode/settings.json" ]; then
    echo -e "${GREEN}✅ .vscode/settings.json found${NC}"
    
    # Check for specific settings
    # We use if/grep -q which is safe with set -e
    if grep -q "editor.formatOnSave" .vscode/settings.json; then
        echo "   ✓ Auto-format on save enabled"
    fi
    
    if grep -q "tailwindCSS.experimental.classRegex" .vscode/settings.json; then
        echo "   ✓ TailwindCSS class detection configured"
    fi
else
    echo -e "${RED}❌ .vscode/settings.json not found${NC}"
fi

# Check for Biome config
if [ -f "biome.json" ]; then
    echo -e "${GREEN}✅ biome.json found${NC}"
else
    echo -e "${RED}❌ biome.json not found${NC}"
fi

echo ""
echo "📋 Recommended Extensions List:"
echo "─────────────────────────────────────"

# Parse and display extensions nicely
if [ -f ".vscode/extensions.json" ]; then
     node -e '
      const fs = require("fs");
      const content = fs.readFileSync(".vscode/extensions.json", "utf8");
      const jsonContent = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      try {
        const json = JSON.parse(jsonContent);
        if (json.recommendations) {
          json.recommendations.slice(0, 20).forEach(ext => console.log(`  • ${ext}`));
          if (json.recommendations.length > 20) console.log(`  ... and ${json.recommendations.length - 20} more`);
        }
      } catch (e) {
        console.error("  Error parsing extensions list");
      }
    '
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
if [ -n "${TERM_PROGRAM:-}" ] && [ "$TERM_PROGRAM" = "vscode" ]; then
    echo -e "${GREEN}✅ Running in VS Code integrated terminal${NC}"
    echo "   Extensions notification should appear automatically"
else
    echo -e "${YELLOW}⚠️  Not running in VS Code integrated terminal${NC}"
    echo "   Open this project in VS Code to see extension recommendations"
fi

echo ""
echo "✨ Setup verification complete!"
