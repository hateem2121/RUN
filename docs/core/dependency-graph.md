# System Dependency Graph 🕸️

**Last Updated:** May 2026  
**Status:** Validated

This document visualizes the relationships between the packages and workspaces in the RUN Remix monorepo.

## 1. Package Relationships

The monorepo is structured around a central `@run-remix/shared` package that serves as the Single Source of Truth (SSOT) for schemas and types.

```mermaid
graph TD
    subgraph Workspaces
        client["@run-remix/client (React 19)"]
        server["@run-remix/server (Express 5)"]
        shared["@run-remix/shared (Schemas/Types)"]
        utils["@run-remix/utils (Scripts/Tools)"]
    end

    subgraph Infrastructure
        neon["Neon Postgres (SQL)"]
        redis["Upstash Redis (Cache)"]
        gcs["Google Cloud Storage (Media)"]
    end

    %% Dependency Flows
    client --> shared
    server --> shared
    
    server --> neon
    server --> redis
    server --> gcs
    
    client --> server
    
    utils --> shared
    utils --> server
```

## 2. Shared Contract Layer (`shared/`)

The `@run-remix/shared` package contains zero runtime dependencies other than those required for Drizzle schema definition.

| Consumer | Usage Pattern |
| :--- | :--- |
| **Client** | Zod validation schemas, Frontend view models, Shared constants. |
| **Server** | Drizzle table definitions, Database repositories, Backend validation. |
| **Scripts** | Database migration tools, Seed data generation. |

## 3. Deployment Flow

```mermaid
graph LR
    Git["GitHub Repository"] --> CI["CI Pipeline (Turbo)"]
    CI --> Tests["Vitest / Playwright"]
    Tests --> Build["Docker Build"]
    Build --> Registry["Google Artifact Registry"]
    Registry --> Deploy["Google Cloud Run"]
```
