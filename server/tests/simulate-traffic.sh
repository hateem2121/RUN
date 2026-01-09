#!/bin/bash

# PHASE 2C: Traffic Simulation for Cache Hit Rate Validation
# Simulates realistic B2B platform traffic patterns and measures cache performance

echo "🚀 Starting Cache Hit Rate Validation..."
echo "================================================"
echo ""

# Configuration
PORT="${PORT:-5001}" # Default to 5001 (Local Dev), override for 5000 (Docker)
BASE_URL="http://localhost:${PORT}"
DURATION_MINUTES=${1:-5}  # Default 5 minutes
REQUESTS_PER_MINUTE=50
TOTAL_REQUESTS=$((DURATION_MINUTES * REQUESTS_PER_MINUTE))
DELAY_MS=$((60000 / REQUESTS_PER_MINUTE))

# Weighted route distribution (matches realistic B2B usage)
declare -a ROUTES=(
  "/api/homepage/batch:10"           # Highest traffic
  "/api/products:8"                  # Product browsing
  "/api/categories:6"                # Category navigation
  "/api/media:5"                     # Media loading
  "/api/homepage/hero:4"             # Homepage sections
  "/api/homepage/slogans:3"
  "/api/homepage/process-cards:3"
)

echo "Configuration:"
echo "  Duration:     $DURATION_MINUTES minutes"
echo "  Requests:     $TOTAL_REQUESTS total ($REQUESTS_PER_MINUTE req/min)"
echo "  Base URL:     $BASE_URL"
echo ""

# Get baseline cache metrics
echo "📊 Baseline Cache Metrics:"
echo "------------------------------------------------"
curl -s "$BASE_URL/api/metrics/cache" | jq -r '
  "  Hit Rate:        \(.metrics.hitRate | tonumber | . * 100 | round / 100)%",
  "  Total Hits:      \(.metrics.totalHits)",
  "  Total Misses:    \(.metrics.totalMisses)",
  "  Total Entries:   \(.metrics.totalEntries)",
  "  Avg Response:    \(.metrics.avgResponseTime | tonumber | round)ms"
' 2>/dev/null || echo "  ⚠️  Could not fetch baseline metrics"
echo ""

# Function to select weighted random route
select_route() {
  local total_weight=0
  for route in "${ROUTES[@]}"; do
    weight="${route##*:}"
    total_weight=$((total_weight + weight))
  done
  
  local random=$((RANDOM % total_weight))
  local weight_sum=0
  
  for route in "${ROUTES[@]}"; do
    path="${route%%:*}"
    weight="${route##*:}"
    weight_sum=$((weight_sum + weight))
    if [ $random -lt $weight_sum ]; then
      echo "$path"
      return
    fi
  done
  
  echo "/api/homepage/batch"  # Fallback
}

# Simulate traffic
echo "🔄 Simulating Traffic..."
echo "------------------------------------------------"
start_time=$(date +%s)
hits=0
misses=0

for i in $(seq 1 $TOTAL_REQUESTS); do
  route=$(select_route)
  
  # Make request (silent, measure time)
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$route" 2>/dev/null | tail -1)
  
  # Track progress every 50 requests
  if [ $((i % 50)) -eq 0 ]; then
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    # Get current cache metrics
    current_metrics=$(curl -s "$BASE_URL/api/metrics/cache" 2>/dev/null)
    current_hit_rate=$(echo "$current_metrics" | jq -r '.metrics.hitRate // 0' 2>/dev/null)
    
    echo "  Progress: $i/$TOTAL_REQUESTS requests | Elapsed: ${elapsed}s | Hit Rate: ${current_hit_rate}%"
  fi
  
  # Delay between requests
  sleep $(echo "scale=3; $DELAY_MS / 1000" | bc)
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "✅ Traffic Simulation Complete"
echo "  Duration: ${duration}s"
echo ""

# Get final cache metrics
echo "📈 Final Cache Metrics:"
echo "================================================"
final_metrics=$(curl -s "$BASE_URL/api/metrics/cache" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "$final_metrics" | jq -r '
    "  Cache Hit Rate:       \(.metrics.hitRate | tonumber | . * 100 | round / 100)%",
    "  Total Hits:           \(.metrics.totalHits)",
    "  Total Misses:         \(.metrics.totalMisses)",
    "  Total Entries:        \(.metrics.totalEntries)",
    "  Avg Response Time:    \(.metrics.avgResponseTime | tonumber | round)ms",
    "  Memory Usage:         \((.metrics.estimatedMemoryUsage / 1024 / 1024) | round)MB",
    "  Health Score:         \(.healthScore)",
    "  Status:               \(.status)"
  '
  
  echo ""
  echo "🎯 Performance Assessment:"
  echo "================================================"
  
  hit_rate=$(echo "$final_metrics" | jq -r '.metrics.hitRate')
  baseline=69
  target=75
  
  # Compare to targets
  if [ "$(echo "$hit_rate >= $target" | bc)" -eq 1 ]; then
    echo "  ✅ PASS: Hit rate ${hit_rate}% exceeds ${target}% target"
    improvement=$(echo "$hit_rate - $baseline" | bc)
    echo "  Improvement: +${improvement}% from Phase 2A baseline"
  elif [ "$(echo "$hit_rate >= $baseline" | bc)" -eq 1 ]; then
    echo "  ⚠️  PARTIAL: Hit rate ${hit_rate}% above baseline (${baseline}%) but below target (${target}%)"
    gap=$(echo "$target - $hit_rate" | bc)
    echo "  Gap to target: ${gap}%"
  else
    echo "  ❌ FAIL: Hit rate ${hit_rate}% below baseline (${baseline}%)"
    degradation=$(echo "$baseline - $hit_rate" | bc)
    echo "  Performance degradation: -${degradation}%"
  fi
else
  echo "  ⚠️  Could not fetch final metrics"
fi

echo ""
echo "================================================"
