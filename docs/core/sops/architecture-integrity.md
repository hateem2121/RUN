# SOP: Architecture Integrity & Service Layering (v1.0.0)

## 1. Overview

This SOP defines the non-negotiable architectural standards for the RUN Remix backend. Ensuring these standards prevents design regression, masks bugs, and guarantees 100% deterministic execution.

## 2. Express 5 Standards (Native Async)

The backend uses **Express 5**. The most critical change is that async handlers no longer require manual `try/catch` or `next(error)` wrappers.

- **[RULE] No Manual Wrappers:** Do NOT use `next(error)` in async route handlers.
- **[RULE] Global Error Handler:** All errors must propagate naturally to the `production-error-handler.ts`.
- **[RULE] Async Error Handling:** Native async support in Express 5 handles promise rejections automatically.

```typescript
// ✅ CORRECT (Express 5)
router.get("/users", async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
});

// ❌ FORBIDDEN (Legacy Express 4 Pattern)
router.get("/users", async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
});
```

## 3. Service Layering (The A.N.T. Protocol)

To maintain code sanity and testability, business logic MUST be extracted from routes.

1. **Architecture (L1):** Documentation/SOPs.
2. **Navigation (L2):** Routes handle request parsing and response delivery. No business logic.
3. **Tools (L3):** Services in `server/services/` or `server/lib/` maintain pure logic.

## 4. Error Propagation & Mapping

Errors must use the standardized [Problem Details (RFC 9457)](file:///Users/hateemjamshaid/Sites/RUN/server/lib/errors.ts) pattern.

- **Database Errors:** Map to `DatabaseError` (500).
- **Validation Errors:** Map to `ValidationError` (400).
- **Not Found:** Map to `NotFoundError` (404).

## 5. Persistence Code (CRUD Guidelines)

All database interactions must use **Drizzle ORM** through the `db` client.
- No raw SQL unless absolutely necessary for performance.
- Use `Zod` schemas for all input and output validation.
- All service methods must return typed Results or throw typed Errors.

## 6. Domain Repository Pattern (Established Session 8 — 2026-04-27)

The legacy monolithic `PageContentRepository` (2,400 LOC) has been permanently decomposed. All page-content data access now flows through **five domain-specific repositories** in `server/lib/db/repositories/page-content/`:

| Repository | Domain | Key Methods |
|---|---|---|
| `homepage.repository.ts` | Hero, Slogans, Process Cards, Logo, Featured Products | `getHomepageBatch()` |
| `about.repository.ts` | Hero, Timeline, Map, Sections, Statistics, Team Message | `getAboutBatch()` |
| `sustainability.repository.ts` | Hero, Goals, Metrics, Initiatives | `getSustainabilityUnifiedData()` |
| `manufacturing.repository.ts` | Hero, Capabilities, Processes, Qualities | `getManufacturingBatch()` |
| `technology.repository.ts` | Hero, CTA, Equipment, Innovations, Research, Roadmap | `getTechnologyBatch()` |

- **[RULE] No God Repositories:** Never consolidate multiple domains into a single repository file.
- **[RULE] Direct Imports:** Services and routes must import the specific domain repository (e.g., `import { homepageRepository } from "./repositories"`).
- **[RULE] Re-export via Index:** All repositories are centrally re-exported from `server/lib/db/repositories/index.ts`.

## 7. Frontend Modular Decomposition Pattern (Established Session 8 — 2026-04-27)

Large frontend components (>500 LOC) must be decomposed following the patterns established during the Media Library extraction:

### Hook Extraction
- **[RULE]** Extract data-fetching logic into custom hooks (e.g., `useMediaGridQuery`). Components should be pure presentation.
- **[RULE]** Extract state-management logic into focused hooks (e.g., `useMediaFilters`, `useMediaSelection`). Each hook manages a single concern.
- **[RULE]** URL synchronization logic must be isolated into its own hook (e.g., `useMediaUrlSync`).

### Utility Extraction
- **[RULE]** Pure utility functions, constants, and class instances must live in dedicated `.ts` files (not `.tsx`).
- **[RULE]** Memoized sub-components with no shared state must be extracted into their own `.tsx` files.

### Directory Convention
- Hooks go in a `hooks/` subdirectory within the domain module.
- Utility modules go in a domain-appropriate subdirectory (e.g., `upload/`).
- Extracted UI sub-components go in a `components/` subdirectory.

### Reference Implementation

```
media-library/                         # Domain module root
├── MediaGrid.tsx                      # Lean presentation (143 LOC)
├── MediaLibraryContextEnhanced.tsx    # Provider shell (588 LOC)
├── MediaUploadEnhanced.tsx            # Upload orchestrator (618 LOC)
├── hooks/                             # Extracted hooks
│   ├── useMediaFilters.ts
│   ├── useMediaGridQuery.ts
│   ├── useMediaSelection.ts
│   └── useMediaUrlSync.ts
├── upload/                            # Extracted utilities
│   ├── upload-utilities.ts
│   └── UploadItem.tsx
└── components/                        # Extracted sub-components
    ├── MediaGridItem.tsx
    ├── MediaGridPagination.tsx
    └── MediaGridToolbar.tsx
```

---
**Status:** ACTIVE | **Approver:** Antigravity System | **Version:** v1.1.0 | **Last Updated:** 2026-04-27
