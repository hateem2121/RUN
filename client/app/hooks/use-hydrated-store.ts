import { useEffect, useState } from "react";

/**
 * A hook to safely access Zustand store state that might differ between server and client
 * (e.g. persisted state in localStorage).
 *
 * It returns `undefined` (or the result of the selector applied to initial state) during
 * the first render and hydration, ensuring the server HTML matches the client's initial HTML.
 * After hydration is complete, it forces a re-render with the actual store state.
 *
 * @param store The zustand store hook
 * @param selector A function to select a specific part of the state
 * @returns The selected state or undefined if not yet hydrated
 *
 * @example
 * const items = useHydratedStore(useQuoteStore, (state) => state.items);
 * if (!items) return <Skeleton />;
 */
export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
) {
  const [hydrated, setHydrated] = useState(false);
  const result = store(selector);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? result : undefined;
}
