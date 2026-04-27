import { vi } from "vitest";

/**
 * Creates a robust Drizzle ORM mock that supports fluent chaining.
 * @param defaultResult The value to return at the end of the chain.
 */
export function createDbMock(defaultResult: unknown = []) {
  const chainable: Record<string, unknown> = {};

  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "from",
    "where",
    "orderBy",
    "limit",
    "offset",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "fullJoin",
    "returning",
    "values",
    "set",
    "onConflictDoUpdate",
    "onConflictDoNothing",
    "transaction",
    "execute",
  ];

  methods.forEach((method) => {
    chainable[method] = vi.fn().mockImplementation(() => chainable);
  });

  // Make it a Thenable that resolves to defaultResult
  // biome-ignore lint/suspicious/noThenProperty: Mocking a promise
  chainable.then = (onFulfilled: unknown) =>
    Promise.resolve(defaultResult).then(onFulfilled as never);
  chainable.catch = (onRejected: unknown) =>
    Promise.resolve(defaultResult).catch(onRejected as never);

  return chainable;
}

/**
 * Creates a mock for UnifiedCache.
 */
export function createCacheMock() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clearPattern: vi.fn(),
  };
}
