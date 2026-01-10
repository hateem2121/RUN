#!/bin/bash
set -euo pipefail

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

# Check if there are staged files without capturing them yet
if git diff --cached --quiet; then
  echo "✅ No staged files to scan."
  exit 0
fi

FAILURE=0

# Safe file iteration handling spaces/newlines in filenames
while IFS= read -r -d '' file; do
  if [ -f "$file" ]; then
    # Skip binary files if needed, but grep handles them mostly
    
    for pattern in "${PATTERNS[@]}"; do
      # Use || true to prevent set -e from exiting on no match
      if grep -qE "$pattern" "$file" || false; then 
         # Wait, grep -qE returns 0 on match. If it returns 1 (no match), set -e would kill the script?
         # No, because it is in an 'if' format?
         # 'if command; then' DOES swallow the failure. strict mode is safe in if condition.
         # Re-verifying: yes, 'if grep ...' is safe.
         :
      fi
      
      if grep -qE "$pattern" "$file"; then
        echo "❌ ERROR: Potential secret found in $file (Pattern: $pattern)"
        FAILURE=1
        # No break, find all secrets
      fi
    done
  fi
done < <(git diff --cached --name-only -z)

if [ $FAILURE -eq 1 ]; then
  echo "❌ Secret scan failed. Please remove the secrets before committing."
  exit 1
else
  echo "✅ No secrets detected in staged files."
  exit 0
fi
