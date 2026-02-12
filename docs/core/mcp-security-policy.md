# MCP Security Policy: RUN Remix

## 1. Overview
The Model Context Protocol (MCP) is active in the **RUN Remix** system to provide AI agents with structured access to the filesystem, Git repository, and PostgreSQL database. This policy defines the security boundaries and operational constraints to prevent unauthorized modifications or data exposure.

## 2. Operational Boundaries

### 2.1 File Access
- **Write Restrictions**: Agents must only modify files under explicitly approved tasks.
- **Sensitive Files**: `.env`, `secrets/`, and private keys are **RESTRICTED**. Agents may read `.env.example` but should never log or transmit actual secret values.
- **System Files**: Modification of `Dockerfile`, `cloudbuild.yaml`, or core infrastructure scripts requires explicit human approval in the `implementation_plan.md`.

### 2.2 Database Access
- **Schema Access**: Agents have read-only access to the database schema for analysis.
- **Data Access**: PII (Personally Identifiable Information) access is restricted. Agents should use `safeQuery` with limits for data inspection.
- **Mutations**: Direct DML/DDL via AI tools is prohibited in production environments. Use migration scripts for all schema changes.

### 2.3 Command Execution
- **Port 5002**: All server-related commands must strictly adhere to Port 5002.
- **Unsafe Commands**: `rm -rf`, `npm publish`, and network-altering commands are prohibited without supervisor intervention.
- **Monitoring**: All command outputs are logged to the telemetry system for audit.

## 3. Communication Standards
- Agents must use the `notify_user` tool for all critical confirmations.
- Any discovery of security vulnerabilities (e.g., exposed keys) must be reported immediately as a **Critical** issue.

## 4. Compliance (2026+)
This policy is reviewed annually to align with modern Node.js 24+ security standards and Neon PostgreSQL security protocols.
