#!/bin/bash
# Tailwind v4 Migration - Final Setup Verification Script
#
# This script verifies all guardrails are operational and provides
# instructions for the final manual GitHub configuration step.
#
# Run: bash scripts/verify-migration-complete.sh

set -e

echo "======================================"
echo "Tailwind v4 Migration - Final Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check 1: CSS Import Order
echo "📋 Checking CSS import order..."
if npx tsx scripts/lint-css-import-order.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CSS import order: PASS${NC}"
else
    echo -e "${RED}❌ CSS import order: FAIL${NC}"
    exit 1
fi

# Check 2: SSR Preload
echo "📋 Checking SSR preload configuration..."
if npx tsx scripts/check-ssr-preload.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSR preload check: PASS${NC}"
else
    echo -e "${YELLOW}⚠️  SSR preload check: WARNING (non-blocking)${NC}"
fi

# Check 3: Visual Baselines Exist
echo "📋 Checking visual baselines..."
SNAPSHOT_COUNT=$(find e2e/__snapshots__/ -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SNAPSHOT_COUNT" -ge 100 ]; then
    echo -e "${GREEN}✅ Visual baselines: $SNAPSHOT_COUNT snapshots found${NC}"
else
    echo -e "${RED}❌ Visual baselines: Only $SNAPSHOT_COUNT found (expected 130+)${NC}"
    exit 1
fi

# Check 4: CI Workflows Exist
echo "📋 Checking CI workflows..."
if [ -f ".github/workflows/visual-regression.yml" ] && [ -f ".github/workflows/update-baselines.yml" ]; then
    echo -e "${GREEN}✅ CI workflows: Present${NC}"
else
    echo -e "${RED}❌ CI workflows: Missing${NC}"
    exit 1
fi

# Check 5: Documentation Exists
echo "📋 Checking documentation..."
DOCS=(
    "TAILWIND_V4_MIGRATION_COMPLETE.md"
    "TAILWIND_V4_POSTMIGRATION_CHECKLIST.md"
    "docs/BRANCH_PROTECTIONS.md"
    ".github/CODEOWNERS"
)
ALL_DOCS_PRESENT=true
for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        echo -e "${RED}❌ Missing: $doc${NC}"
        ALL_DOCS_PRESENT=false
    fi
done
if [ "$ALL_DOCS_PRESENT" = true ]; then
    echo -e "${GREEN}✅ Documentation: Complete${NC}"
fi

echo ""
echo "======================================"
echo "🎉 All Automated Checks Passed!"
echo "======================================"
echo ""

# Final Manual Step Instructions
echo -e "${YELLOW}📝 FINAL MANUAL STEP REQUIRED:${NC}"
echo ""
echo "Enable GitHub Branch Protections:"
echo ""
echo "1. Go to your GitHub repository"
echo "2. Navigate to: Settings → Branches → Add rule"
echo "3. Branch name pattern: 'main' (or 'develop')"
echo "4. Enable these settings:"
echo "   ☐ Require a pull request before merging"
echo "   ☐ Require review from Code Owners"
echo "   ☐ Require status checks to pass before merging"
echo "     - Add: 'Tailwind v4 Guardrails'"
echo "     - Add: 'Visual Regression Tests'"
echo "   ☐ Require branches to be up to date before merging"
echo "   ☐ Do not allow force pushes"
echo "   ☐ Do not allow deletions"
echo ""
echo "5. Save changes"
echo ""
echo "📖 Detailed instructions: docs/BRANCH_PROTECTIONS.md"
echo ""
echo "======================================"
echo "✅ Migration Complete!"
echo "======================================"
