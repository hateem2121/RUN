#!/bin/bash
set -e

# RUN Apparel B2B Platform - Bootstrap Script
# Usage: ./scripts/bootstrap.sh

echo "🚀 Bootstrapping RUN App Development Environment..."

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Environment Configuration
if [ ! -f .env ]; then
  echo "⚙️  Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env created. Please update it with your local secrets if needed."
else
  echo "✅ .env already exists."
fi

# 3. Verify Setup
echo "🔍 Verifying environment setup..."
./scripts/setup/verify-setup.sh

# 4. Port 5002 Check
echo "📡 Checking port 5002 availability..."
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Port 5002 is already in use. Please free it before running 'npm run dev'."
else
  echo "✅ Port 5002 is available."
fi

# 5. Biome Linting Check
echo "🧹 Running initial lint check..."
npm run lint || echo "⚠️  Linting issues found. Run 'npm run check:apply' to fix them."

echo "✨ Bootstrap complete! Run 'npm run dev' to start the development server."
