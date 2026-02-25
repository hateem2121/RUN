#!/bin/bash
FILES_FILE=$1
OUTPUT_FILE=$2

echo "Path|Author|Date|Size" > $OUTPUT_FILE
while read -r p; do
  if [ -f "$p" ]; then
    AUTHOR=$(git log -1 --format="%an" -- "$p" 2>/dev/null || echo "Unknown")
    DATE=$(git log -1 --format="%ai" -- "$p" 2>/dev/null || echo "Unknown")
    SIZE=$(wc -l < "$p")
    echo "$p|$AUTHOR|$DATE|$SIZE" >> $OUTPUT_FILE
  fi
done < "$FILES_FILE"
