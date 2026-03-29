#!/bin/bash
set -euo pipefail

# VS Code Extensions Auto-Installer
# Installs all recommended extensions from .vscode/extensions.json
# Uses Node.js to safely parse the JSON configuration

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

# Check for extension config
if [ ! -f ".vscode/extensions.json" ]; then
    echo -e "${RED}❌ .vscode/extensions.json not found!${NC}"
    exit 1
fi

# Use Node.js to safely parse JSON (guaranteed dependency in this project)
# We filter out comments by parsing standard JSON (VS Code allows comments, but we need to arguably handle them)
# Actually, JSON.parse does NOT support comments. VS Code uses "JSON with Comments" (jsonc).
# To be safe, we'll use a regex in node or stripping comments.
# Since we are in a node >= 24 env, we can use fs.readFileSync and some regex to strip comments before parsing.
echo "reading .vscode/extensions.json..."

# Extract extensions using Node.js with comment stripping
EXTENSIONS_LIST=$(node -e '
  const fs = require("fs");
  const content = fs.readFileSync(".vscode/extensions.json", "utf8");
  // Simple regex to strip JS style comments
  const jsonContent = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  try {
    const json = JSON.parse(jsonContent);
    if (json.recommendations && Array.isArray(json.recommendations)) {
      console.log(json.recommendations.join("\n"));
    }
  } catch (e) {
    console.error("Failed to parse extensions.json:", e.message);
    process.exit(1);
  }
')

# Convert newline separated string to array
mapfile -t extensions <<< "$EXTENSIONS_LIST"

# Filter out empty lines if any
extensions=(${extensions[@]})

total=${#extensions[@]}
installed=0
failed=0

echo "📦 Found $total extensions in configuration"
echo ""

# Install each extension
for ext in "${extensions[@]}"; do
    # Skip if empty (safety check)
    if [ -z "$ext" ]; then continue; fi

    echo -n "Installing $ext... "
    
    # We use || true to prevent set -e from killing the script on individual extension failure
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
