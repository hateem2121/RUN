#!/usr/bin/env python3
"""
Google Antigravity SDK — Multi-Agent Monorepo Orchestrator
RUN APPAREL CMS (run-remix)

This orchestrator coordinates a 4-agent team using the Google Antigravity Python SDK:
1. DB Specialist (Neon Serverless Postgres / Drizzle ORM)
2. Frontend Engineer (React 19, Tailwind CSS v4, GSAP)
3. Backend Craftsman (Express 5, neverthrow Result, Opossum)
4. Quality & Security Auditor (Biome, Knip, Vite SSR, CodeQL)
"""

import asyncio
import os
import sys
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

try:
    from google.antigravity import Agent, LocalAgentConfig, types
except ImportError:
    print("Error: google-antigravity SDK is not installed.")
    print("Install via: pip install -r scripts/antigravity/requirements.txt")
    sys.exit(1)


def create_monorepo_orchestrator(
    api_key: Optional[str] = None,
    interactive: bool = False,
    vertex: bool = False,
    project: Optional[str] = None,
    location: str = "us-central1",
) -> Agent:
    """Configures and builds the multi-agent hierarchy."""

    # 1. Database Specialist Subagent
    db_specialist = types.SubagentConfig(
        name="db_specialist",
        description=(
            "Expert in Neon Serverless PostgreSQL, Drizzle ORM schemas, database branching, "
            "migrations, connection pooling, and egress optimization."
        ),
        system_instructions=(
            "You are the Neon PostgreSQL Database Specialist for RUN APPAREL. "
            "All table schemas reside in shared/schemas/. Always enforce soft-deletes, "
            "connection pooling with PgBouncer, and strict column projection to prevent egress spikes."
        ),
        capabilities=types.SubagentCapabilities(
            enabled_tools=[
                types.BuiltinTools.VIEW_FILE,
                types.BuiltinTools.GREP_SEARCH,
                types.BuiltinTools.RUN_COMMAND,
            ],
        ),
    )

    # 2. Frontend & Design System Engineer Subagent
    frontend_engineer = types.SubagentConfig(
        name="frontend_engineer",
        description=(
            "Specialist in React 19, React Router v8, Tailwind CSS v4 @theme design tokens, "
            "GSAP animations, and accessible Radix UI component primitives."
        ),
        system_instructions=(
            "You are the Frontend & UI Engineer for RUN APPAREL. Enforce React 19 form actions "
            "(with closure wrappers for react-hook-form), Tailwind CSS v4 direct functional tokens "
            "(never arbitrary brackets), GSAP ScrollTrigger animations, and Zero AI Slop styling."
        ),
        capabilities=types.SubagentCapabilities(
            enabled_tools=[
                types.BuiltinTools.VIEW_FILE,
                types.BuiltinTools.GREP_SEARCH,
                types.BuiltinTools.FIND_BY_NAME,
            ],
        ),
    )

    # 3. Backend Service Craftsman Subagent
    backend_craftsman = types.SubagentConfig(
        name="backend_craftsman",
        description=(
            "Specialist in Express 5 thin controllers, neverthrow ResultAsync services, "
            "Pino logging, Opossum circuit breakers, and Cloud Tasks background workers."
        ),
        system_instructions=(
            "You are the Backend Service Craftsman. Never place business logic or raw try/catch "
            "in Express 5 route handlers. Use neverthrow ResultAsync for all domain services. "
            "Protect all third-party external APIs with Opossum circuit breakers."
        ),
        capabilities=types.SubagentCapabilities(
            enabled_tools=[
                types.BuiltinTools.VIEW_FILE,
                types.BuiltinTools.GREP_SEARCH,
                types.BuiltinTools.RUN_COMMAND,
            ],
        ),
    )

    # 4. Quality, Security & Forensics Auditor Subagent
    quality_auditor = types.SubagentConfig(
        name="quality_auditor",
        description=(
            "Audits code quality, Biome 2.3+ linting, TypeScript strictness, Knip dead-code "
            "detection, Vite SSR invariants, and CodeQL security analysis."
        ),
        system_instructions=(
            "You are the Lead Forensics & Security Auditor. Enforce npm run check, "
            "npm run verify:tech-integrity, and npm run check:knip across all workspaces."
        ),
        capabilities=types.SubagentCapabilities(
            enabled_tools=[
                types.BuiltinTools.VIEW_FILE,
                types.BuiltinTools.RUN_COMMAND,
                types.BuiltinTools.GREP_SEARCH,
            ],
        ),
    )

    # Execution behavior
    behavior = (
        types.AgentBehavior.INTERACTIVE
        if interactive
        else types.AgentBehavior.AUTONOMOUS
    )

    # Capabilities and Subagent Delegation
    capabilities = types.CapabilitiesConfig(
        agent_behavior=behavior,
        enable_subagents=True,
        max_subagent_depth=2,
        allowed_subagents=[
            "db_specialist",
            "frontend_engineer",
            "backend_craftsman",
            "quality_auditor",
        ],
    )

    # Operational Budget Limits
    budget = types.BudgetConfig(
        max_model_calls=50,
        max_tool_calls=100,
        max_total_tokens=1_000_000,
    )

    # Root Agent Configuration
    config = LocalAgentConfig(
        model="gemini-3.7-flash",
        api_key=api_key or os.getenv("GEMINI_API_KEY"),
        vertex=vertex,
        project=project or os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=location,
        system_instructions=(
            "You are the Lead Monorepo Orchestrator for RUN APPAREL CMS (run-remix). "
            "Coordinate tasks across the Database Specialist, Frontend Engineer, Backend Craftsman, "
            "and Quality Auditor to deliver production-grade features adhering to GEMINI.md SSOT."
        ),
        capabilities=capabilities,
        budget_config=budget,
        subagents=[db_specialist, frontend_engineer, backend_craftsman, quality_auditor],
    )

    return Agent(config=config)


async def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else "Audit monorepo tech integrity and report health."
    print(f"[*] Initializing Google Antigravity Multi-Agent Orchestrator...")
    print(f"[*] Prompt: {prompt}\n")

    agent = create_monorepo_orchestrator()
    async with agent:
        response = await agent.chat(prompt)
        print("\n=== Orchestrator Response ===")
        print(response.text)


if __name__ == "__main__":
    asyncio.run(main())
