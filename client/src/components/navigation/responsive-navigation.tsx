import { IconLoader } from "@tabler/icons-react";
import { memo, useEffect, useState } from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { useDesktopNavigationItems, useStaggeredMenuItems } from "@/hooks/use-navigation";
import { NavigationIcon } from "./navigation-icon";
import { StaggeredMenu } from "./staggered-menu";

const ResponsiveNavigation = memo(function ResponsiveNavigation() {
  // Desktop navigation items (filtered by showOnDesktop)
  const { navigationItems: desktopItems, isLoading: desktopLoading } = useDesktopNavigationItems();

  // Mobile navigation items (filtered by showOnMobile)
  const { menuItems: mobileItems, isLoading: mobileLoading } = useStaggeredMenuItems();

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
        mediaIcon={item.mediaIcon}
        fallbackIcon={item.fallbackIcon || undefined}
        className="h-full w-full"
      />
    ),
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Desktop Navigation - Floating Dock (hidden on mobile) - positioned to avoid logo overlap */}
      <div className="hidden lg:block fixed top-4 left-1/2 -translate-x-1/2 z-[50] px-4 md:px-8 lg:px-12">
        {desktopLoading || !mounted ? (
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-sm-luxury-sm border border-luxury-light">
            <IconLoader className="h-6 w-6 animate-spin text-luxury-gray-600" />
          </div>
        ) : (
          <FloatingDock
            items={dockItems}
            desktopClassName="shadow-sm-luxury-md border border-luxury-light"
            mobileClassName="shadow-sm-luxury-md border border-luxury-light"
            disableMobile={true}
          />
        )}
      </div>

      {/* Mobile Navigation - Staggered Menu (visible on mobile only) */}
      <div className="lg:hidden">
        {mounted && !mobileLoading && mobileItems.length > 0 && (
          <StaggeredMenu
            position="right"
            items={mobileItems}
            displayItemNumbering={true}
            menuButtonColor="#000"
            openMenuButtonColor="#000"
            changeMenuColorOnOpen={false}
            colors={["#f5f5f5", "#e5e5e5"]}
            accentColor="#000"
          />
        )}
      </div>
    </>
  );
});

export default ResponsiveNavigation;
