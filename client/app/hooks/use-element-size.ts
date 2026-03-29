import { useCallback, useLayoutEffect, useState } from "react";

interface Size {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  (node: T | null) => void,
  Size,
] {
  // Mutable values like 'ref.current' aren't valid dependencies
  // so we use a callback ref to handle the element instance
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  // Prevent too many renders with useCallback
  const handleSize = useCallback(() => {
    setSize({
      width: ref?.offsetWidth || 0,
      height: ref?.offsetHeight || 0,
    });
  }, [ref?.offsetHeight, ref?.offsetWidth]);

  useLayoutEffect(() => {
    if (!ref) {
      return;
    }

    handleSize();

    if (typeof ResizeObserver === "undefined") {
      // Fallback for older browsers / SSR environments
      window.addEventListener("resize", handleSize);
      return () => window.removeEventListener("resize", handleSize);
    }

    const observer = new ResizeObserver((_) => {
      handleSize();
    });

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, handleSize]);

  return [setRef, size];
}
