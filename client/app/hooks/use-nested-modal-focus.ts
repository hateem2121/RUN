import { useCallback, useEffect, useRef, useState } from "react";

interface NestedModalFocusOptions {
  isOpen: boolean;
  onClose: () => void;
  nestingLevel?: number;
  shouldTrapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

interface NestedModalFocusReturn {
  modalRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  focusFirstElement: () => void;
  focusLastElement: () => void;
}

/**
 * Enhanced focus management hook for nested modals
 * Provides comprehensive focus trapping, restoration, and keyboard navigation
 */
export function useNestedModalFocus({
  isOpen,
  onClose,
  nestingLevel = 0,
  shouldTrapFocus = true,
  restoreFocus = true,
  autoFocus = true,
}: NestedModalFocusOptions): NestedModalFocusReturn {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get all focusable elements within the modal
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!contentRef.current) return [];

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
    ].join(", ");

    const elements = Array.from(
      contentRef.current.querySelectorAll(focusableSelectors),
    ) as HTMLElement[];

    return elements.filter((element) => {
      // Check if element is visible and not hidden
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.hasAttribute("hidden") &&
        element.offsetParent !== null
      );
    });
  }, []);

  // Focus first focusable element
  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }
  }, [getFocusableElements]);

  // Focus last focusable element
  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1]?.focus();
    }
  }, [getFocusableElements]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!shouldTrapFocus || !contentRef.current) return;

      const focusableElements = getFocusableElements();
      const currentFocusIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case "Escape":
          // Let Radix handle escape for base modals, only handle for nested modals > 0
          if (nestingLevel > 0) {
            event.preventDefault();
            event.stopPropagation();
            // Defer the onClose call to prevent state updates during event handling
            setTimeout(() => {
              onClose();
            }, 0);
          }
          break;

        case "Tab":
          if (focusableElements.length === 0) {
            event.preventDefault();
            return;
          }

          if (event.shiftKey) {
            // Shift + Tab (backward navigation)
            if (currentFocusIndex <= 0) {
              event.preventDefault();
              focusLastElement();
            }
          } else {
            // Tab (forward navigation)
            if (currentFocusIndex >= focusableElements.length - 1) {
              event.preventDefault();
              focusFirstElement();
            }
          }
          break;

        case "Home":
          if (event.ctrlKey) {
            event.preventDefault();
            focusFirstElement();
          }
          break;

        case "End":
          if (event.ctrlKey) {
            event.preventDefault();
            focusLastElement();
          }
          break;
      }
    },
    [
      shouldTrapFocus,
      getFocusableElements,
      onClose,
      focusFirstElement,
      focusLastElement,
      nestingLevel,
    ],
  );

  // Handle modal opening - Stabilized dependencies
  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Store the previously focused element for restoration
      if (restoreFocus) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }

      // Set up focus management after a brief delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (autoFocus && contentRef.current) {
          try {
            // Try to focus the first focusable element, or the content itself
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
              focusableElements[0]?.focus();
            } else {
              // Fallback: focus the content container with tabindex
              contentRef.current.focus();
            }
          } catch (_error) {}
        }
        setIsInitialized(true);
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    if (!isOpen && isInitialized) {
      setIsInitialized(false);
    }
    return undefined;
  }, [isOpen, isInitialized, autoFocus, restoreFocus, getFocusableElements]);

  // Handle modal closing and focus restoration
  useEffect(() => {
    if (!isOpen && restoreFocus && previousFocusRef.current) {
      // Restore focus to the previously focused element
      const timeoutId = setTimeout(() => {
        try {
          if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
            previousFocusRef.current.focus();
          }
        } catch (_error) {}
        previousFocusRef.current = null;
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOpen, restoreFocus]);

  // Note: Removed aggressive global click handler that was interfering with media interactions
  // Radix UI Dialog already handles proper focus management for modal overlays

  return {
    modalRef,
    contentRef,
    handleKeyDown,
    focusFirstElement,
    focusLastElement,
  };
}

/**
 * Hook for managing focus stack in nested modal scenarios
 * Keeps track of modal hierarchy and ensures proper focus management
 */
export function useNestedModalStack() {
  const [modalStack, setModalStack] = useState<number[]>([]);

  const pushModal = useCallback((level: number) => {
    setModalStack((prev) => [...prev, level]);
  }, []);

  const popModal = useCallback(() => {
    setModalStack((prev) => prev.slice(0, -1));
  }, []);

  const getCurrentLevel = useCallback(() => {
    return modalStack.length;
  }, [modalStack]);

  const isActiveModal = useCallback(
    (level: number) => {
      return modalStack[modalStack.length - 1] === level;
    },
    [modalStack],
  );

  return {
    modalStack,
    pushModal,
    popModal,
    getCurrentLevel,
    isActiveModal,
  };
}
