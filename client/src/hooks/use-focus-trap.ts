import { useEffect, useRef } from "react";

/**
 * Options for the useFocusTrap hook
 */
interface UseFocusTrapOptions {
	/** Whether the focus trap is active */
	isOpen: boolean;
	/** Callback to close the trap (e.g., on Escape) */
	onClose?: () => void;
	/** Whether to restore focus to the previously focused element on close */
	restoreFocus?: boolean;
}

/**
 * A lightweight hook to trap focus within a container.
 * Handles Tab cycles, Escape key, and focus restoration.
 */
export function useFocusTrap<T extends HTMLElement>({
	isOpen,
	onClose,
	restoreFocus = true,
}: UseFocusTrapOptions) {
	const containerRef = useRef<T>(null);
	const previousFocus = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		// 1. Capture previously focused element
		previousFocus.current = document.activeElement as HTMLElement;

		// 2. Focus the container or first focusable element
		// internal helper to find focusables
		const getFocusables = () => {
			if (!containerRef.current) return [];
			return Array.from(
				containerRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
				),
			).filter(
				(el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
			);
		};

		// Set initial focus with a tiny delay to wait for animation/rendering
		const timer = setTimeout(() => {
			const focusables = getFocusables();
			if (focusables.length > 0) {
				focusables[0]?.focus();
			} else if (containerRef.current) {
				containerRef.current.focus();
			}
		}, 50);

		// 3. Handle Keyboard Events
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose?.();
				return;
			}

			if (e.key === "Tab") {
				const focusables = getFocusables();
				if (focusables.length === 0) {
					e.preventDefault();
					return;
				}

				const first = focusables[0];
				const last = focusables[focusables.length - 1];

				if (e.shiftKey) {
					if (document.activeElement === first) {
						e.preventDefault();
						last?.focus();
					}
				} else {
					if (document.activeElement === last) {
						e.preventDefault();
						first?.focus();
					}
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			clearTimeout(timer);
			document.removeEventListener("keydown", handleKeyDown);

			// 4. Restore Focus
			if (
				restoreFocus &&
				previousFocus.current &&
				document.contains(previousFocus.current)
			) {
				previousFocus.current.focus();
			}
		};
	}, [isOpen, onClose, restoreFocus]);

	return containerRef;
}
