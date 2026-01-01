#!/bin/bash
# scripts/run-proof.sh

# defaults
export PORT="${PORT:-5001}"
export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:$PORT}"

echo "🔹 Target Environment: $E2E_BASE_URL"

# Only manage server lifecycle if NOT in CI
if [ -z "$CI" ]; then
  # 1. Kill any stale server on designated port
  echo "🔹 [Local] Cleaning up port $PORT..."
  lsof -t -i:$PORT | xargs kill -9 2>/dev/null || true

  # 2. Start Server detached
  echo "🔹 [Local] Starting Dev Server on port $PORT..."
  npm run dev -- --port $PORT --strictPort &
  SERVER_PID=$!
else
  echo "🔹 [CI] Assuming server is managed externally."
fi

# 3. Wait for Readiness
echo "🔹 Waiting for server readiness at $E2E_BASE_URL..."
MAX_RETRIES=60
COUNT=0
# We check the root path / for general availability 
# AND /e2e-overlay to ensure the test route is mounted (if applicable/critical)
# For now, generic readiness on root is standard practice, but we'll stick to a simple check.
until curl -s "$E2E_BASE_URL" > /dev/null; do
  sleep 1
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Server failed to become ready in ${MAX_RETRIES}s"
    # Kill if we started it
    if [ -n "$SERVER_PID" ]; then kill $SERVER_PID; fi
    exit 1
  fi
  echo "   ...waiting ($COUNT/$MAX_RETRIES)"
done

echo "✅ Server is Ready at $E2E_BASE_URL"

# 4. Run Proof Suite
echo "🔹 Executing Playwright Proofs..."
# Pass base url through env if Playwright config uses process.env.E2E_BASE_URL
# (Playwright config usually reads standard env vars)
npx playwright test --project=chromium
EXIT_CODE=$?

# 5. Cleanup (Local only)
if [ -n "$SERVER_PID" ]; then
  echo "🔹 [Local] Stopping Server (PID: $SERVER_PID)..."
  kill $SERVER_PID
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Proof Suite Passed."
else
  echo "❌ Proof Suite Failed."
fi

exit $EXIT_CODE
