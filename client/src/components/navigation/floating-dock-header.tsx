import { memo } from "react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ResponsiveNavigation from "./responsive-navigation";

const FloatingDockHeader = memo(function FloatingDockHeader() {
  return (
    <header className="relative z-dock">
      {/* Brand Logo - Fixed top-left with two-line layout to prevent overlap */}
      <div className="fixed top-4 left-4 z-dock">
        <Link href="/" className="shrink-0">
          <div className="flex flex-col items-center gap-1 px-2 sm:flex-row sm:gap-3">
            <h1 className="whitespace-nowrap font-bold font-neue-stance text-luxury-charcoal text-sm sm:text-base md:text-lg">
              RUN APPAREL
            </h1>
            <span className="hidden h-1 w-1 rounded-full bg-luxury-charcoal/20 sm:inline" />
            <p className="whitespace-nowrap font-neue-stance font-semibold text-micro text-zinc-600 sm:text-sm">
              (PVT) LTD
            </p>
          </div>
        </Link>
      </div>
      {/* Theme Toggle - Fixed top-right for easy access */}
      <div className="fixed top-4 right-4 z-dock">
        <ThemeToggle />
      </div>
      {/* Responsive Navigation - FloatingDock on desktop, StaggeredMenu on mobile */}
      <ResponsiveNavigation />
    </header>
  );
});

export default FloatingDockHeader;
