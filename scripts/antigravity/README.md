# Google Antigravity SDK — Multi-Agent Orchestrator

This directory contains the Python-based Google Antigravity SDK multi-agent orchestrator for the **RUN APPAREL** monorepo.

## Architecture

The orchestrator spawns and coordinates 4 specialized subagents:
1. **Database Specialist (`db_specialist`)**: Manages Neon Serverless Postgres, Drizzle schemas, migrations, and query egress optimization.
2. **Frontend & UI Engineer (`frontend_engineer`)**: Manages React 19, Tailwind CSS v4 design tokens, GSAP animations, and Radix UI.
3. **Backend Service Craftsman (`backend_craftsman`)**: Enforces Express 5 thin controllers, `neverthrow` Result contracts, and Cloud Tasks.
4. **Quality & Security Auditor (`quality_auditor`)**: Runs Biome linting, TypeScript strict checking, Knip dead-code analysis, and SSR invariants.

## Setup & Prerequisites

```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r scripts/antigravity/requirements.txt

# 3. Configure API Key
export GEMINI_API_KEY="your-gemini-api-key"
# OR for Vertex AI:
# gcloud auth application-default login
# export GOOGLE_CLOUD_PROJECT="your-gcp-project"
```

## Running the Orchestrator

```bash
# Autonomous execution
python scripts/antigravity/orchestrator.py "Audit database schemas and check egress patterns"

# Custom prompt
python scripts/antigravity/orchestrator.py "Refactor manufacturing controller to use neverthrow ResultAsync"
```
