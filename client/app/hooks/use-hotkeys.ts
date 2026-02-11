import { useEffect, useRef } from "react";

type KeyboardHandler = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook for handling global keyboard shortcuts.
 * Supports Meta (Cmd) or Ctrl + Key combinations.
 */
export function useHotkeys(
  key: string,
  callback: KeyboardHandler,
  options: HotkeyOptions = { enabled: true, preventDefault: true },
) {
  const callbackRef = useRef<KeyboardHandler>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      const targetKey = key.toLowerCase();
      const pressedKey = event.key.toLowerCase();

      if (isMeta && pressedKey === targetKey) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, options.enabled, options.preventDefault]);
}
