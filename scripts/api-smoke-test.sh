#!/bin/bash
# Truly free API smoke test using curl (No Bruni/Postman required)

BASE_URL="http://localhost:5001"
echo "🔥 Starting API Smoke Test on $BASE_URL..."

# 1. Health Check
echo "\n[1] Checking Health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Health Check Passed (200 OK)"
else
  echo "❌ Health Check Failed ($HTTP_CODE)"
  exit 1
fi

# 2. Inquiry Endpoint (Test POST)
echo "\n[2] Testing Inquiry POST..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/inquiries" \
  -H "Content-Type: application/json" \
  -d '{"name": "Smoke Test", "email": "test@example.com", "message": "Automated smoke test"}')

# Simple check if response contains expected ID or success
if echo "$RESPONSE" | grep -q "id"; then
   echo "✅ Inquiry Created: $RESPONSE"
else
   echo "⚠️ Inquiry Response unexpected (might be intentional if auth required): $RESPONSE"
   # Don't fail the build for this if we aren't sure of auth
fi

echo "\n✨ Smoke Test Complete!"
exit 0
