import { memo, useEffect, useState } from "react";
import { Link } from "react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ResponsiveNavigation from "./responsive-navigation";
import { FloatingDockSkeleton } from "./floating-dock-skeleton";

const FloatingDockHeader = memo(function FloatingDockHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 w-full z-(--z-index-dock) pointer-events-none">
         <FloatingDockSkeleton />
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full z-(--z-index-dock) pointer-events-none">
      {/* Brand Logo - Fixed top-left with two-line layout to prevent overlap */}
      <div className="fixed top-4 left-4 z-10 pointer-events-auto">
        <Link to="/" className="shrink-0">
          <div className="flex flex-col items-center gap-1 px-2 sm:flex-row sm:gap-3">
            <h1 className="whitespace-nowrap font-bold font-neue-stance text-luxury-charcoal dark:text-white text-sm sm:text-base md:text-lg">
              RUN APPAREL
            </h1>
            <span className="hidden h-1 w-1 rounded-full bg-luxury-charcoal/20 dark:bg-white/20 sm:inline" />
            <p className="whitespace-nowrap font-neue-stance font-semibold text-micro text-zinc-600 dark:text-zinc-400 sm:text-sm">
              (PVT) LTD
            </p>
          </div>
        </Link>
      </div>
      {/* Theme Toggle - Fixed top-right for easy access */}
      <div className="fixed top-4 right-4 z-(--z-index-dock) pointer-events-auto">
        <ThemeToggle />
      </div>
      {/* Responsive Navigation - FloatingDock on desktop, StaggeredMenu on mobile */}
      <div className="pointer-events-auto">
        <ResponsiveNavigation />
      </div>
    </header>
  );
});

export default FloatingDockHeader;
