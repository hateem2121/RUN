import { vi } from "vitest";

/**
 * Creates a robust Drizzle ORM mock that supports fluent chaining.
 * @param defaultResult The value to return at the end of the chain.
 */
export function createDbMock(defaultResult: any = []) {
  const chainable: any = {};

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
  chainable.then = (onFulfilled: any) => Promise.resolve(defaultResult).then(onFulfilled);
  chainable.catch = (onRejected: any) => Promise.resolve(defaultResult).catch(onRejected);

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
