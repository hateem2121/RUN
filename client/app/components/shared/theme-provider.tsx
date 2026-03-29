import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Theme Provider with SSR hydration fix.
 *
 * FE-002: next-themes reads localStorage during render, causing a hydration mismatch
 * when the server renders dark mode but the client reads a different value.
 * The fix: render children without the theme wrapper on first paint,
 * then mount the provider after hydration completes.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / first client render, skip the theme wrapper to avoid hydration mismatch.
  // The FOUC prevention script in root.tsx already sets the correct class on <html>,
  // so the visual theme is correct even before this provider mounts.
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
