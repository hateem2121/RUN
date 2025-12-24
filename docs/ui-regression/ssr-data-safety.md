# SSR Data Safety Protocol

## 1. Request Scoping (QueryClient)

**Rule:** `QueryClient` must be created **per request** on the server.

- **Implementation:** `client/src/lib/queryClient.ts` uses `getQueryClient()` factory.
- **Verification:** Logic checks `typeof window === 'undefined'` to force new instance.

## 2. Global State Isolation (RequestManager)

**Risk:** Global singletons (like `requestManager`) sharing state between concurrent SSR requests.

- **Fix:** `client/src/lib/request-manager.ts` now **bypasses** instance-level tracking on the server.
- **Code:**
  ```typescript
  if (typeof window === "undefined") {
    return fetch(url, fetchOptions); // Stateless pass-through
  }
  ```
- **Result:** No cross-user state pollution possible via this manager.

## 3. Dehydration Safety

- **Rule:** Only dehydrate necessary state.
- **Check:** `App.tsx` uses `<HydrationBoundary state={dehydratedState}>`.

## 4. Concurrency Test

- **Plan:** CI load test (future) to simulate parallel requests and check for switched data.
- **Current Proof:** Code review of `request-manager.ts` confirms statelessness.
