import { memo } from "react";
import { Link } from "react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ResponsiveNavigation from "./responsive-navigation";

const FloatingDockHeader = memo(function FloatingDockHeader() {
  return (
    <header className="z-dock relative">
      {/* Brand Logo - Fixed top-left with two-line layout to prevent overlap */}
      <div className="z-dock fixed top-4 left-4">
        <Link to="/" className="shrink-0">
          <div className="flex flex-col items-center gap-1 px-2 sm:flex-row sm:gap-3">
            <h1 className="font-neue-stance text-luxury-charcoal text-sm font-bold whitespace-nowrap sm:text-base md:text-lg">
              RUN APPAREL
            </h1>
            <span className="bg-luxury-charcoal/20 hidden h-1 w-1 rounded-full sm:inline" />
            <p className="font-neue-stance text-micro font-semibold whitespace-nowrap text-zinc-600 sm:text-sm">
              (PVT) LTD
            </p>
          </div>
        </Link>
      </div>
      {/* Theme Toggle - Fixed top-right for easy access */}
      <div className="z-dock fixed top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Responsive Navigation - FloatingDock on desktop, StaggeredMenu on mobile */}
      <ResponsiveNavigation />
    </header>
  );
});

export default FloatingDockHeader;
