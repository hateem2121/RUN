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
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-2">
            <h1 className="text-sm sm:text-base md:text-lg font-neue-stance font-bold text-luxury-charcoal whitespace-nowrap">
              RUN APPAREL
            </h1>
            <span className="hidden sm:inline w-1 h-1 bg-luxury-charcoal/20 rounded-full" />
            <p className="text-[10px] sm:text-sm font-neue-stance text-zinc-600 whitespace-nowrap font-semibold">
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
