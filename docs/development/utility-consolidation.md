# Server Utility Consolidation Guide

## Overview

This document outlines the strategy for consolidating server-side utilities into a unified structure under `server/lib/`. The goal is to eliminate redundancy and establish a single source of truth for utility functions.

**Status:** Planning Phase  
**Last Updated:** February 2026  
**Risk Level:** Medium (requires import path updates across codebase)

---

## Current State Analysis

### 1. Root-Level Utilities (`server/utils.ts`)

**Location:** `server/utils.ts` (492 lines)  
**Contents:**
- Safe ID parsing utilities (`safeParseId`, `validateIdParam`)
- Data transformation (`transformNullToUndefined`, `prepareForValidation`, `cleanApiData`, `safeSerialize`, `removeUndefined`)
- Security utilities (`validateAndSanitizeInput`, `sanitizeString`, `validateFilename`, `validateMediaId`, `setSecureCORSHeaders`, `shouldBypassCache`)
- Media URL utilities (`MediaUrlBuilder` class)
- Performance utilities (`responseOptimizer`)
- URL path utilities (`UrlPathService` class)
- Retry utilities (`RetryManager` class)
- Migration utilities (`migrationService`)
- Media validation (`MediaValidator`, `correctMimeType`)

### 2. Utils Directory (`server/utils/`)

**Location:** `server/utils/`  
**Files:**
| File | Purpose | Size |
|------|---------|------|
| `data-transformation.ts` | Data transformation utilities | 575 chars |
| `drizzle-error-mapper.ts` | Drizzle ORM error mapping | 2,345 chars |
| `process-handlers.ts` | Process lifecycle handlers | 2,155 chars |
| `response.ts` | API response helpers | 854 chars |
| `security-utils.ts` | Security utilities | 1,912 chars |

**Potential Duplicates Identified:**
- `transformNullToUndefined` - exists in both `utils.ts` and `utils/data-transformation.ts`
- `validateFilename` - exists in both `utils.ts` and `utils/security-utils.ts`
- Response utilities - overlap between `utils.ts` and `utils/response.ts`

### 3. Lib Directory (`server/lib/`)

**Location:** `server/lib/`  
**Structure:** Well-organized with domain-specific subdirectories:
- `api/` - OpenAPI generator
- `auth/` - Redis store
- `cache/` - Two-tier caching system
- `compliance/` - Data retention
- `core/` - DI container, business metrics
- `db/` - Database utilities, repositories
- `errors/` - Error classes
- `events/` - Event bus
- `integrations/` - External services
- `monitoring/` - Logging, metrics, alerting
- `queues/` - Job queues
- `resilience/` - Circuit breakers, rate limiters
- `secrets/` - Secret management
- `ssr/` - Server-side rendering
- `storage/` - Storage abstraction
- `utilities/` - General utilities (image-optimizer, media-utils, slug-utils, etc.)

---

## Target Architecture

### Unified Utility Structure

```
server/lib/
├── utilities/
│   ├── index.ts              # Re-exports all utilities
│   ├── data-transformation.ts # transformNullToUndefined, cleanApiData, etc.
│   ├── id-parsing.ts         # safeParseId, validateIdParam
│   ├── security.ts           # validateFilename, sanitizeString, etc.
│   ├── media.ts              # MediaUrlBuilder, MediaValidator, correctMimeType
│   ├── response.ts           # responseOptimizer, safeSerialize
│   ├── retry.ts              # RetryManager
│   ├── url.ts                # UrlPathService
│   └── migration.ts          # migrationService
├── db/
│   └── drizzle-error-mapper.ts  # Move from utils/
├── core/
│   └── process-handlers.ts   # Move from utils/
└── [existing structure preserved]
```

---

## Migration Strategy

### Phase 1: Audit and Document (Low Risk)

1. **Map all imports** - Identify all files importing from:
   - `server/utils.ts`
   - `server/utils/*.ts`
   - `server/lib/utilities/*.ts`

2. **Identify duplicates** - Compare function signatures and implementations:
   - Document which version is authoritative
   - Note any behavioral differences

3. **Create index files** - Add barrel exports for clean imports

### Phase 2: Consolidate Functions (Medium Risk)

1. **Move unique functions** from `server/utils.ts` to `server/lib/utilities/`:
   - Split into domain-specific files
   - Maintain backward compatibility via re-exports

2. **Merge `server/utils/` contents**:
   - `data-transformation.ts` → `lib/utilities/data-transformation.ts`
   - `drizzle-error-mapper.ts` → `lib/db/drizzle-error-mapper.ts`
   - `process-handlers.ts` → `lib/core/process-handlers.ts`
   - `response.ts` → `lib/utilities/response.ts`
   - `security-utils.ts` → `lib/utilities/security.ts`

3. **Update imports gradually**:
   - Use TypeScript's "Find All References"
   - Update one module at a time
   - Run tests after each batch

### Phase 3: Cleanup (Low Risk)

1. **Remove deprecated files**:
   - Delete `server/utils.ts` after all imports migrated
   - Delete `server/utils/` directory after migration

2. **Update documentation**:
   - Update `AGENTS.md` with new utility locations
   - Add migration guide for developers

---

## Backward Compatibility

During migration, maintain backward compatibility via re-exports:

```typescript
// server/utils.ts (temporary compatibility layer)
export {
  safeParseId,
  validateIdParam,
  transformNullToUndefined,
  // ... other exports
} from './lib/utilities/index.js';

// DEPRECATED: This file will be removed in v5.0.0
// Import directly from './lib/utilities/' instead
```

---

## Import Migration Examples

### Before
```typescript
import { safeParseId, validateFilename } from '../utils.js';
import { transformNullToUndefined } from '../utils/data-transformation.js';
```

### After
```typescript
import { safeParseId, validateFilename, transformNullToUndefined } from '../lib/utilities/index.js';
```

---

## Testing Requirements

Before and after migration:

1. **Run full test suite**: `npm run test`
2. **Type check**: `npm run typecheck`
3. **Build verification**: `npm run build`
4. **Integration tests**: `npm run test tests/v2`

---

## Rollback Plan

If issues arise:

1. Revert to previous commit
2. Restore `server/utils.ts` and `server/utils/` from git history
3. Remove new utility files from `server/lib/utilities/`
4. Update imports back to original paths

---

## Estimated Effort

| Phase | Files to Modify | Risk |
|-------|-----------------|------|
| Phase 1: Audit | 0 (documentation only) | Low |
| Phase 2: Consolidate | ~50-100 files | Medium |
| Phase 3: Cleanup | ~10 files | Low |

**Recommendation:** Execute Phase 1 immediately (documentation). Phases 2-3 should be scheduled for a dedicated refactoring sprint with proper QA coverage.

---

## References

- [AGENTS.md](../../AGENTS.md) - Server directory structure
- [Architecture Documentation](../core/architecture.md) - Overall system architecture
- [Developer Workflow](../guides/developer-workflow.md) - Development standards