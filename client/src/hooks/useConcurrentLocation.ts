import { startTransition, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

/**
 * A wrapper around react-router's hooks that wraps navigation state updates
 * in React 19's startTransition. This prevents UI tearing and allows
 * urgent updates to interrupt navigation rendering.
 */
export function useConcurrentLocation(): [
  string,
  (to: string, options?: { replace?: boolean }) => void,
] {
  const location = useLocation();
  const navigate = useNavigate();

  const setLocationConcurrent = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      startTransition(() => {
        navigate(to, { ...(options?.replace !== undefined ? { replace: options.replace } : {}) });
      });
    },
    [navigate],
  );

  return [location.pathname, setLocationConcurrent];
}
