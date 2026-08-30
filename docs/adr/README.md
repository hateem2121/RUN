# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the RUN-Remix platform.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision along with its context and consequences.

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](0001-adr-template.md) | ADR Template | Accepted | 2026-01-13 |
| [0002](0002-react-19-over-nextjs.md) | React 19 + React Router over Next.js | Accepted | 2026-01-13 |
| [0003](0003-neon-serverless-database.md) | Neon Serverless over Traditional PostgreSQL | Accepted | 2026-01-13 |
| [0004](0004-express-5-framework.md) | Express 5 over Fastify/Hono | Accepted | 2026-01-13 |
| [0005](0005-drizzle-orm.md) | Drizzle ORM over Prisma | Accepted | 2026-01-13 |
| [0006](0006-tailwind-v4.md) | Tailwind CSS v4 over CSS Modules | Accepted | 2026-01-13 |
| [0007](0007-cloud-run-deployment.md) | Cloud Run over GKE/ECS | Accepted | 2026-01-13 |
| [0008](0008-upstash-redis.md) | Upstash Redis over ElastiCache | Accepted | 2026-01-13 |
| [0009](0009-biome-over-eslint.md) | Biome over ESLint + Prettier | Accepted | 2026-01-13 |
| [0010](0010-monorepo-structure.md) | Monorepo over Polyrepo | Accepted | 2026-01-13 |
| [0011](0011-google-oauth.md) | Google OAuth over Auth0/Clerk | Accepted | 2026-01-13 |
| [0012](0012-two-tier-caching.md) | Two-Tier Caching Strategy | Accepted | 2026-01-13 |
| [0013](0013-error-handling-architecture.md) | Error Handling Architecture | Accepted | 2026-01-12 |
| [0014](0014-observability-pipeline.md) | Observability Pipeline | Accepted | 2026-01-12 |
| [0015](0015-react-router-7.md) | React Router 7 Adoption | Accepted | 2026-01-07 |
| [0016](0016-admin-parity-pattern.md) | Admin Route Parity Pattern | Accepted | 2026-02-15 |
| [0017](0017-gsap-animation.md) | GSAP Animation Library over Framer Motion | Accepted | 2026-04-04 |
| [0018](0018-cloud-tasks-over-pgboss.md) | Google Cloud Tasks and HTTP Workers over PG-Boss | Accepted | 2026-08-25 |
| [0019](0019-zod-v4-nullish-standard.md) | Zod v4 Nullish Standard over Chained Modifiers | Accepted | 2026-08-25 |
| [0020](0020-neverthrow-resultasync-from-promise.md) | Direct neverthrow ResultAsync.fromPromise in Service Layer | Accepted | 2026-08-25 |
| [0021](0021-keyboard-accessible-scroll-regions.md) | Keyboard-Accessible Scroll Regions and WCAG 2.1.1 Invariants | Accepted | 2026-08-25 |

## Creating New ADRs

1. Copy `0001-adr-template.md`
2. Use the next sequential number
3. Follow the template format
4. Submit via PR for review
