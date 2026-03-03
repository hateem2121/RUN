---
name: express-5-async-patterns
description: |
  Express 5 modern backend patterns. Triggers:
  - "express route", "async handler", "controller logic"
  - "error propagation", "promise rejection"
---

# Express 5.0 Async Native Patterns

## Goal
Leverage Express 5's native asynchronous handling to create cleaner, more maintainable backend controllers without redundant catch blocks.

## Instructions

### 1. Route Handlers
- Use `async` functions for all route handlers.
- Return Promises directly. Express 5 automatically catches rejections and forwards them to the global error middleware.

### 2. Error Handling
- **DO NOT** use `try/catch` boilerplate within routes.
- Delegate data validation to Zod and business logic to services.
- Define custom error classes (e.g., `ValidationError`, `NotFoundError`) in `server/lib/errors.ts`.

### 3. Service Separation
Routes must remain "thin". All business logic and database interactions MUST reside in `server/services/`.

## Constraints
- **NO** manual calls to `next(err)` unless implementing custom middleware.
- **NO** business logic inside route definition files.
