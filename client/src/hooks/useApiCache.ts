import { useCallback, useRef } from "react";

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export function useApiCache<T>() {
	const cache = useRef<Map<string, CacheEntry<T>>>(new Map());

	const get = useCallback((key: string): T | null => {
		const entry = cache.current.get(key);
		if (!entry) return null;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			cache.current.delete(key);
			return null;
		}

		return entry.data;
	}, []);

	const set = useCallback(
		(key: string, data: T, ttl: number = 5 * 60 * 1000) => {
			cache.current.set(key, {
				data,
				timestamp: Date.now(),
				ttl,
			});
		},
		[],
	);

	const clear = useCallback((key?: string) => {
		if (key) {
			cache.current.delete(key);
		} else {
			cache.current.clear();
		}
	}, []);

	const has = useCallback(
		(key: string): boolean => {
			return get(key) !== null;
		},
		[get],
	);

	return { get, set, clear, has };
}
