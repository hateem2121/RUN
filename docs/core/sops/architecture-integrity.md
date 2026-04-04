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

---
**Status:** ACTIVE | **Approver:** Antigravity System
