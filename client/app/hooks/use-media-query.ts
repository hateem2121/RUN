import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set the initial state
    setMatches(media.matches);

    // Define the listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use modern API
    media.addEventListener("change", listener);

    // Cleanup
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
