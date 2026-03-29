import type { MediaAsset, NavigationItem } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import type { StaggeredMenuItem } from "@/components/navigation/staggered-menu";
import { MediaQueryKeys } from "@/lib/media-query-keys";

interface NavigationItemWithMedia extends NavigationItem {
  mediaIcon?: MediaAsset;
}

export function useNavigationItems() {
  const { data: navigationItems = [], isLoading: navigationLoading } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation-items"],
  });

  const { data: mediaResponse, isLoading: mediaLoading } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: Record<string, unknown> };
  }>({
    queryKey: MediaQueryKeys.list,
  });

  const mediaAssets = mediaResponse?.data?.data || [];

  // Combine navigation items with their media assets
  const itemsWithMedia: NavigationItemWithMedia[] = (
    Array.isArray(navigationItems) ? navigationItems : []
  )
    .filter((item) => item?.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => {
      if (item.iconType === "media" && item.mediaIconId) {
        const mediaIcon = mediaAssets.find((asset) => asset.id === item.mediaIconId);
        return { ...item, ...(mediaIcon ? { mediaIcon } : {}) };
      }
      return item;
    });

  return {
    navigationItems: itemsWithMedia,
    isLoading: navigationLoading || mediaLoading,
  };
}

export function useDesktopNavigationItems() {
  const { navigationItems, isLoading } = useNavigationItems();

  // Filter for desktop-visible items
  const desktopItems = navigationItems.filter((item) => item.showOnDesktop !== false);

  return {
    navigationItems: desktopItems,
    isLoading,
  };
}

export function useStaggeredMenuItems() {
  const { data: navigationItems = [], isLoading: navigationLoading } = useQuery<NavigationItem[]>({
    queryKey: ["/api/navigation-items"],
  });

  // Transform navigation items to StaggeredMenuItem format
  // Filter for mobile-visible items only
  const staggeredItems: StaggeredMenuItem[] = (
    Array.isArray(navigationItems) ? navigationItems : []
  )
    .filter((item) => item?.isActive && item.showOnMobile !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => ({
      label: item.label || item.title || "Untitled",
      ariaLabel: `Navigate to ${item.label || item.title || "page"}`,
      link: item.href || "#",
    }));

  return {
    menuItems: staggeredItems,
    isLoading: navigationLoading,
  };
}

export function useNavigationSettings() {
  const { data: settings, isLoading } = useQuery<{
    glassmorphismEnabled: boolean;
    showLabels: boolean;
    dockPosition: "top" | "bottom";
  }>({
    queryKey: ["/api/navigation-settings"],
  });

  return {
    settings: settings || {
      glassmorphismEnabled: true,
      showLabels: true,
      dockPosition: "top",
    },
    isLoading,
  };
}
