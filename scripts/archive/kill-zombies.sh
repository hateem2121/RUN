#!/bin/bash

echo "🧟 Hunting for zombie Node.js processes..."

# Kill broad category of node-based tools
pkill -f "node"
pkill -f "vite"
pkill -f "esbuild"
pkill -f "lightningcss"

echo "✅ Zombie processes neutralized. Memory should be freeing up."
