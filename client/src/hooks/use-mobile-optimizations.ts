import { useEffect, useState } from "react";

export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
}

export function useReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);

		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return prefersReducedMotion;
}

export function useIntersectionObserver(
	options: IntersectionObserverInit = { threshold: 0.1 },
) {
	const [ref, setRef] = useState<HTMLElement | null>(null);
	const [isIntersecting, setIsIntersecting] = useState(false);

	useEffect(() => {
		if (!ref) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries[0]) {
				setIsIntersecting(entries[0].isIntersecting);
			}
		}, options);

		observer.observe(ref);
		return () => observer.disconnect();
	}, [ref, options.threshold, options.root, options.rootMargin]);

	return { ref: setRef, isIntersecting };
}

export function useAnimationFrame(callback: (deltaTime: number) => void) {
	const [isRunning, setIsRunning] = useState(true);

	useEffect(() => {
		if (!isRunning) return;

		let lastTime = 0;
		let animationId: number;

		const animate = (currentTime: number) => {
			const deltaTime = currentTime - lastTime;
			lastTime = currentTime;
			callback(deltaTime);
			animationId = requestAnimationFrame(animate);
		};

		animationId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationId);
	}, [callback, isRunning]);

	return { stop: () => setIsRunning(false), start: () => setIsRunning(true) };
}

// Debounced value hook for performance
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
	useEffect(() => {
		// DISABLED: Performance monitoring causing visual selection issues
		return () => {};
	}, [componentName]);
}
