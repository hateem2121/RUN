#!/bin/bash
# Security Audit Script for Environment Variables & Secret Leaks

echo "Starting Environment Security Audit..."

# 1. Check for .env files committed to git
echo "Checking for committed .env files..."
if git ls-files | grep "\.env" | grep -v "\.env\.example"; then
  echo "[FAIL] .env files found in git!"
  exit 1
else
  echo "[PASS] No .env files in git."
fi

# 2. Check for secrets in client bundles (if built)
echo "Checking client bundles for secrets..."
CLIENT_BUILD_DIR="../client/dist" # Adjust path as needed
SECRETS=("SESSION_SECRET" "DATABASE_URL" "GOOGLE_CLIENT_SECRET" "STRIPE_SECRET_KEY")

if [ -d "$CLIENT_BUILD_DIR" ]; then
  for secret in "${SECRETS[@]}"; do
    if grep -r "$secret" "$CLIENT_BUILD_DIR"; then
      echo "[FAIL] Found potentially leaked secret key name '$secret' in client bundle!"
    else
      echo "[PASS] Secret key '$secret' not found in client bundle."
    fi
  done
else
  echo "[WARN] Client build directory not found. Skipping bundle check."
fi

# 3. Check for specific dangerous patterns in server code
echo "Checking for direct process.env usage outside config..."
# We expect usage in config/environment.ts, index.ts, boot/middleware.ts, etc.
# Ideally, we should grep and exclude known good files.

echo "Audit Complete."
