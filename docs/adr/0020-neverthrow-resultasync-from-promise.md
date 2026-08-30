# ADR 0020: Direct neverthrow ResultAsync.fromPromise in Service Layer

**Status:** Accepted  
**Date:** 2026-08-25  
**Deciders:** RUN Remix Systems Architecture Team  

## Context

The backend service layer (`server/services/`) requires deterministic, type-safe error handling without raw exception throwing:
- **Raw `throw new Error()`:** Leads to unhandled promise rejections, breaks functional error composition, and causes runtime crashes if unhandled.
- **Double Constructor Pattern (`new ResultAsync(async () => ...)` inside `async fn(): Promise<Result>`):** Causes double promise nesting and redundant wrapping.
- **Direct `ResultAsync.fromPromise()`:** Creates an idiomatic `ResultAsync<T, E>` directly from an asynchronous promise-returning function with explicit, structured error mapping.

## Decision

All service layer methods in `server/services/` MUST return `ResultAsync<T, AppError>` directly using `ResultAsync.fromPromise()` wrapped around database and external integration calls.

## Rationale

1. **Clean Return Signatures:** Service functions return `ResultAsync<T, AppError>` without extra outer `async` keyword or `Promise<Result<T, E>>` double nesting.
2. **Deterministic Error Mapping:** Every failure path explicitly maps errors to domain types (`DatabaseError`, `NotFoundError`, `ValidationError`).
3. **Seamless Circuit Breaker Integration:** Pairs naturally with `opossum` circuit breakers (`withCircuit()`).

## Consequences

### Positive

- Zero runtime unhandled exceptions in the service layer.
- Express 5 route handlers consume service results via functional `.match()` handlers.
- Composable pipelines using `.andThen()` and `.map()`.

### Negative

- Requires disciplined handling of `ResultAsync` objects without calling forbidden `.unwrap()`.

## Implementation

```typescript
// server/services/product.service.ts
import { ResultAsync } from "neverthrow";
import { AppError, DatabaseError } from "../../shared/errors/index.js";

export class ProductService {
  listProducts(params: ListParams): ResultAsync<ProductResponse, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        return await withCircuit("db-read", () => db.select().from(products));
      })(),
      (error) => new DatabaseError("Failed to query products", { cause: error }),
    );
  }
}
```
