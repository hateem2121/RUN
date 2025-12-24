import { startTransition, useCallback } from "react";
import { useLocation as useWouterLocation } from "wouter";

/**
 * A wrapper around wouter's useLocation that wraps navigation state updates
 * in React 19's startTransition. This prevents UI tearing and allows
 * urgent updates to interrupt navigation rendering.
 */
export function useConcurrentLocation(): [
	string,
	(to: string, options?: { replace?: boolean }) => void,
] {
	const [location, setLocation] = useWouterLocation();

	const setLocationConcurrent = useCallback(
		(to: string, options?: { replace?: boolean }) => {
			startTransition(() => {
				setLocation(to, options);
			});
		},
		[setLocation],
	);

	return [location, setLocationConcurrent];
}
