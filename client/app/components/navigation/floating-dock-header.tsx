import { memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FloatingDockSkeleton } from "./floating-dock-skeleton";
import { ResponsiveNavigation } from "./responsive-navigation";

export const FloatingDockHeader = memo(function FloatingDockHeader() {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 w-full z-(--z-index-dock) pointer-events-none">
        <FloatingDockSkeleton />
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full z-(--z-index-modal-nested) pointer-events-none">
      {/* Brand Logo - Fixed top-left with two-line layout to prevent overlap */}
      <div className="fixed top-4 left-4 z-(--z-index-modal-nested-2) pointer-events-auto">
        <Link to="/" className="shrink-0" aria-label="Run Apparel Home">
          <div className="flex flex-col items-center gap-1 px-2 sm:flex-row sm:gap-3">
            <span className="relative whitespace-nowrap font-bold font-neue-stance text-luxury-charcoal dark:text-white text-sm sm:text-base md:text-lg">
              <span
                className="absolute -inset-x-2 -inset-y-1 block rounded-md bg-white/40 blur-sm dark:hidden"
                aria-hidden="true"
              />
              <span className="relative">RUN APPAREL</span>
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-luxury-charcoal/20 dark:bg-white/20 sm:inline" />
            <p className="whitespace-nowrap font-neue-stance font-semibold text-micro text-zinc-600 dark:text-zinc-400 sm:text-sm">
              (PVT) LTD
            </p>
          </div>
        </Link>
      </div>
      {/* Theme Toggle - Fixed top-right for easy access */}
      <div className="fixed top-4 right-4 z-(--z-index-modal-nested-2) pointer-events-auto">
        <ThemeToggle />
      </div>
      {/* Responsive Navigation - FloatingDock on desktop, StaggeredMenu on mobile */}
      <div className="pointer-events-auto">
        <ResponsiveNavigation />
      </div>
    </header>
  );
});
