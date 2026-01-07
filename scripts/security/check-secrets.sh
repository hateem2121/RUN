#!/bin/bash

# Secret Scanning Script
# Scans staged files for high-entropy strings and known secret patterns

echo "🔍 Starting secret scan..."

# Known patterns
PATTERNS=(
  "AIza[0-9A-Za-z-_]{35}" # Google API Key
  "sk_live_[0-9a-zA-Z]{24}" # Stripe Live Key
  "sq0atp-[0-9A-Za-z-_]{22}" # Square Access Token
  "access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}" # Braintree
  "-----BEGIN RSA PRIVATE KEY-----"
  "-----BEGIN PRIVATE KEY-----"
  "xkeysib-[0-9a-zA-Z]{64}" # Sendinblue
)

STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No staged files to scan."
  exit 0
fi

FAILURE=0

for file in $STAGED_FILES; do
  if [ -f "$file" ]; then
    for pattern in "${PATTERNS[@]}"; do
      if grep -qE "$pattern" "$file"; then
        echo "❌ ERROR: Potential secret found in $file (Pattern: $pattern)"
        FAILURE=1
      fi
    done
  fi
done

if [ $FAILURE -eq 1 ]; then
  echo "❌ Secret scan failed. Please remove the secrets before committing."
  exit 1
else
  echo "✅ No secrets detected in staged files."
  exit 0
fi
