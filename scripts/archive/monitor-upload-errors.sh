#!/bin/bash
# Monitor upload errors in real-time

echo "🔍 Starting upload error monitoring..."
echo "📝 Watching for: finalize, gltf, glb, error, 500, 415, 413"
echo "=================================================="
echo ""

# Get the most recent log file
LOG_FILE=$(ls -t /tmp/logs/Start_application_*.log 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
  echo "❌ No log file found"
  exit 1
fi

echo "📁 Monitoring: $LOG_FILE"
echo ""

# Monitor for errors
tail -f "$LOG_FILE" | grep --line-buffered -i -E "finalize|gltf|glb|error|500|415|413|unsupported|chunk|model" | while read line; do
  # Color code different log types
  if echo "$line" | grep -qi "error"; then
    echo "❌ ERROR: $line"
  elif echo "$line" | grep -qi "finalize"; then
    echo "🔧 FINALIZE: $line"
  elif echo "$line" | grep -qi "gltf\|glb"; then
    echo "📦 GLTF: $line"
  elif echo "$line" | grep -qi "chunk"; then
    echo "📊 CHUNK: $line"
  else
    echo "ℹ️  $line"
  fi
done
