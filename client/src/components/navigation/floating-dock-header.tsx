import { memo } from "react";
import { Link } from "wouter";
import ResponsiveNavigation from "./responsive-navigation";

const FloatingDockHeader = memo(function FloatingDockHeader() {
  return (
    <header className="relative z-dock">
      {/* Brand Logo - Fixed top-left with two-line layout to prevent overlap */}
      <div className="fixed top-4 left-4 z-modal">
        <Link href="/" className="shrink-0">
          <div className="leading-tight">
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-neue-stance font-bold text-luxury-charcoal whitespace-nowrap">
              RUN APPAREL
            </h1>
            <p className="sm:text-sm md:text-base lg:text-lg xl:text-xl font-neue-stance text-luxury-charcoal whitespace-nowrap text-center text-[15px] font-semibold">
              (PVT) LTD
            </p>
          </div>
        </Link>
      </div>
      {/* Responsive Navigation - FloatingDock on desktop, StaggeredMenu on mobile */}
      <ResponsiveNavigation />
    </header>
  );
});

export default FloatingDockHeader;
