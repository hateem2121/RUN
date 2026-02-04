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

echo "✨ Bootstrap complete! Run 'npm run dev' to start the development server."
