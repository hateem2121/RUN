# Transaction Safety Guidelines

This guide covers safe database transaction patterns, idempotency strategies, and retry best practices.

---

## 1. Transaction Basics

### Use Drizzle Transactions for Multi-Step Operations

```typescript
import { db } from "../db.js";

// Wrap multiple operations in a transaction
await db.transaction(async (tx) => {
  const order = await tx.insert(orders).values({ userId, total }).returning();
  await tx.insert(orderItems).values(items.map(i => ({ orderId: order[0].id, ...i })));
  await tx.update(inventory).set({ quantity: sql`quantity - ${item.quantity}` });
});
```

### Transaction Isolation Levels

Neon PostgreSQL defaults to `READ COMMITTED`. For stricter isolation:

```typescript
await db.transaction(async (tx) => {
  // Operations here see a consistent snapshot
}, { isolationLevel: "serializable" });
```

---

## 2. Idempotency Patterns

### Use Idempotency Keys for Create Operations

The idempotency middleware (`server/middleware/idempotency.ts`) handles this automatically for:
- `POST` - Create operations
- `PUT`, `PATCH` - Update operations  
- `DELETE` - Delete operations

**Client Usage:**
```typescript
fetch("/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": `order-${userId}-${Date.now()}`, // Unique per logical operation
  },
  body: JSON.stringify(orderData),
});
```

### Idempotency Key Best Practices

| Pattern | Example | Use Case |
|:--------|:--------|:---------|
| UUID v4 | `crypto.randomUUID()` | One-time operations |
| Content Hash | `sha256(JSON.stringify(payload))` | Retry exact same request |
| User + Timestamp | `${userId}-${isoDate}` | Daily limit operations |

---

## 3. Safe Retry Strategies

### Retryable vs Non-Retryable Errors

| Error Code | Retryable | Strategy |
|:-----------|:----------|:---------|
| `DB_DEADLOCK` | ✅ | Exponential backoff, max 3 retries |
| `DB_TIMEOUT` | ✅ | Linear backoff, max 2 retries |
| `RATE_LIMIT_EXCEEDED` | ✅ | Wait for `Retry-After` header |
| `DB_CONNECTION_ERROR` | ✅ | Wait for circuit breaker to close |
| `CONFLICT` | ❌ | User must resolve conflict |
| `VALIDATION_ERROR` | ❌ | Client must fix input |

### Retry with Exponential Backoff

```typescript
import { isRetryableError } from "@run-remix/shared";

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError && !isRetryableError(error.code)) {
        throw error; // Don't retry non-retryable errors
      }
      lastError = error as Error;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

---

## 4. Deadlock Prevention

### Acquire Locks in Consistent Order

```typescript
// ❌ BAD: Different lock order in different transactions
// Transaction 1: Lock A, then B
// Transaction 2: Lock B, then A → DEADLOCK

// ✅ GOOD: Always lock in the same order (e.g., by ID)
const ids = [productId1, productId2].sort((a, b) => a - b);
for (const id of ids) {
  await tx.select().from(products).where(eq(products.id, id)).for("update");
}
```

### Use SELECT FOR UPDATE SKIP LOCKED

For queue-like patterns:

```typescript
const [job] = await db
  .select()
  .from(jobs)
  .where(eq(jobs.status, "pending"))
  .for("update", { skipLocked: true })
  .limit(1);
```

---

## 5. Circuit Breaker Integration

The storage layer uses a circuit breaker (`server/lib/db/db-circuit-breaker.ts`) that:
- **Opens** after 5 consecutive failures
- **Half-opens** after 30 seconds
- **Closes** after 3 successful requests

Check circuit state before critical operations:

```typescript
import { isServerShuttingDown } from "../lib/shutdown-manager.js";

if (isServerShuttingDown()) {
  throw new ServiceUnavailableError("Server is shutting down");
}
```

---

## 6. Common Pitfalls

### ❌ Don't Hold Transactions Open During External Calls

```typescript
// ❌ BAD: HTTP call inside transaction
await db.transaction(async (tx) => {
  const order = await tx.insert(orders).values(data).returning();
  await sendEmailNotification(order); // Slow! Holds locks
});

// ✅ GOOD: External call outside transaction
const order = await db.transaction(async (tx) => {
  return await tx.insert(orders).values(data).returning();
});
await sendEmailNotification(order);
```

### ❌ Don't Swallow Transaction Errors

```typescript
// ❌ BAD: Error swallowed, transaction state unknown
try {
  await db.transaction(async (tx) => { ... });
} catch (e) {
  console.log("oops");
}

// ✅ GOOD: Re-throw after logging
try {
  await db.transaction(async (tx) => { ... });
} catch (error) {
  logger.error("Transaction failed", { error });
  throw error;
}
```

---

## References

- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Idempotency Keys RFC](https://datatracker.ietf.org/doc/draft-ietf-httpbis-idempotency/)
