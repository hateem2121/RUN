import { memo } from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  useDesktopNavigationItems,
  useNavigationSettings,
  useStaggeredMenuItems,
} from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";
import { FloatingDockSkeleton } from "./floating-dock-skeleton";
import { NavigationIcon } from "./navigation-icon";
import { StaggeredMenu } from "./staggered-menu";

export const ResponsiveNavigation = memo(function ResponsiveNavigation() {
  // Desktop navigation items (filtered by showOnDesktop)
  const { navigationItems: desktopItems, isLoading: desktopLoading } = useDesktopNavigationItems();

  // Mobile navigation items (filtered by showOnMobile)
  const { menuItems: mobileItems, isLoading: mobileLoading } = useStaggeredMenuItems();

  // Navigation settings (glassmorphism, etc.)
  const { settings } = useNavigationSettings();

  // Transform desktop navigation items for FloatingDock component
  const dockItems = desktopItems.map((item) => ({
    id: item.id,
    title: item.title || item.label || "Untitled",
    href: item.href || item.url || "#",
    iconSize: item.iconSize || "medium",
    icon: (
      <NavigationIcon
        iconType={
          item.iconType === "media" || item.iconType === "fallback" ? item.iconType : "fallback"
        }
        {...(item.mediaIcon ? { mediaIcon: item.mediaIcon } : {})}
        {...(item.fallbackIcon ? { fallbackIcon: item.fallbackIcon } : {})}
        className="h-full w-full"
      />
    ),
  }));

  return (
    <>
      {/* Desktop Navigation - Floating Dock (hidden on mobile) - positioned to avoid logo overlap */}
      <div className="fixed top-4 left-1/2 hidden -translate-x-1/2 px-4 md:px-8 lg:block lg:px-12 pointer-events-auto">
        {desktopLoading && desktopItems.length === 0 ? (
          <FloatingDockSkeleton />
        ) : (
          <FloatingDock
            items={dockItems}
            desktopClassName={cn(
              "shadow-md border border-(--color-border)/50",
              !settings.glassmorphismEnabled && "bg-background backdrop-blur-none",
            )}
            mobileClassName="shadow-md border border-(--color-border)/50"
            disableMobile={true}
          />
        )}
      </div>

      {/* Mobile Navigation - Staggered Menu (visible on mobile only) */}
      <div className="lg:hidden">
        {!mobileLoading && mobileItems.length > 0 && (
          <StaggeredMenu
            position="right"
            items={mobileItems}
            displayItemNumbering={true}
            menuButtonColor="var(--color-foreground)"
            openMenuButtonColor="var(--color-foreground)"
            changeMenuColorOnOpen={false}
            colors={["var(--color-neutral-100)", "var(--color-neutral-200)"]}
            accentColor="var(--color-foreground)"
          />
        )}
      </div>
    </>
  );
});
