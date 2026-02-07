import type { MediaAsset } from "@shared/schema";
import { lazy, memo, Suspense } from "react";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";

// Explicitly import specific icons to avoid bundling the entire library
// This curated list covers most common use cases
const IconHome = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconHome.mjs"));
const IconUser = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconUser.mjs"));
const IconUsers = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconUsers.mjs"));
const IconSettings = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconSettings.mjs"));
const IconDashboard = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconDashboard.mjs"));
const IconBox = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconBox.mjs"));
const IconPackage = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconPackage.mjs"));
const IconShoppingCart = lazy(
  () => import("@tabler/icons-react/dist/esm/icons/IconShoppingCart.mjs"),
);
const IconChartBar = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconChartBar.mjs"));
const IconFileText = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconFileText.mjs"));
const IconMail = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconMail.mjs"));
const IconPhone = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconPhone.mjs"));
const IconMapPin = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconMapPin.mjs"));
const IconCalendar = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconCalendar.mjs"));
const IconSearch = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconSearch.mjs"));
const IconMenu2 = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconMenu2.mjs"));
const IconX = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconX.mjs"));
const IconChevronDown = lazy(
  () => import("@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs"),
);
const IconChevronRight = lazy(
  () => import("@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs"),
);
const IconLogout = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconLogout.mjs"));
const IconLogin = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconLogin.mjs"));
const IconInfoCircle = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs"));
const IconHelp = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconHelp.mjs"));

// Map icon names to lazy components
const ICON_MAP: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ className?: string }>>
> = {
  IconHome,
  IconUser,
  IconUsers,
  IconSettings,
  IconDashboard,
  IconBox,
  IconPackage,
  IconShoppingCart,
  IconChartBar,
  IconFileText,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconSearch,
  IconMenu2,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconLogout,
  IconLogin,
  IconInfoCircle,
  IconHelp,
  // Common aliases (case-insensitive handling logic to be added if needed, but strict for now)
  home: IconHome,
  user: IconUser,
  users: IconUsers,
  settings: IconSettings,
  dashboard: IconDashboard,
  box: IconBox,
  package: IconPackage,
  cart: IconShoppingCart,
  chart: IconChartBar,
  file: IconFileText,
  mail: IconMail,
  phone: IconPhone,
  map: IconMapPin,
  calendar: IconCalendar,
  search: IconSearch,
  menu: IconMenu2,
  close: IconX,
  logout: IconLogout,
  login: IconLogin,
  info: IconInfoCircle,
  help: IconHelp,
};

interface NavigationIconProps {
  iconType: "media" | "fallback";
  mediaIcon?: MediaAsset;
  fallbackIcon?: string | undefined;
  className?: string | undefined;
  useAbsolutePositioning?: boolean | undefined; // for floating dock vs admin display
}

export const NavigationIcon = memo(function NavigationIcon({
  iconType,
  mediaIcon,
  fallbackIcon,
  className = "h-full w-full",
  useAbsolutePositioning = true,
}: NavigationIconProps) {
  // Get optimized media URL for navigation icons
  const { urls } = useOptimizedMedia(mediaIcon?.id || 0, {
    width: 80,
    quality: 90,
    format: "webp",
  });

  if (iconType === "media" && mediaIcon) {
    if (useAbsolutePositioning) {
      // For floating dock - uses absolute positioning to fill entire container
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <img
            src={
              urls?.small ||
              mediaIcon.url ||
              (mediaIcon.id && mediaIcon.id < 1000000000000
                ? `/api/media/${mediaIcon.id}/content`
                : undefined)
            }
            alt={mediaIcon.originalName || ""}
            className="h-full w-full object-cover object-center [image-rendering:crisp-edges]"
          />
        </div>
      );
    } else {
      // For admin display - stays within container bounds
      return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-muted/20">
          <img
            src={
              urls?.small ||
              mediaIcon.url ||
              (mediaIcon.id && mediaIcon.id < 1000000000000
                ? `/api/media/${mediaIcon.id}/content`
                : undefined)
            }
            alt={mediaIcon.originalName || ""}
            className="h-full w-full object-cover object-center [image-rendering:crisp-edges]"
          />
        </div>
      );
    }
  }

  const commonClasses = `${className} text-neutral-500 dark:text-neutral-300`;

  const Loader = (
    <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 ${className}`} />
  );

  // Determine which icon component to use
  let SelectedIcon = IconHome; // Default fallback

  if (iconType === "fallback" && fallbackIcon) {
    // Try to find exact match or alias match
    const exactMatch = ICON_MAP[fallbackIcon];
    if (exactMatch) {
      SelectedIcon = exactMatch;
    }
    // If exact name "IconXxx" wasn't found, try looking it up directly
    else {
      const aliasMatch = ICON_MAP[`Icon${fallbackIcon}`];
      if (aliasMatch) {
        SelectedIcon = aliasMatch;
      }
    }
  }

  return (
    <Suspense fallback={Loader}>
      <SelectedIcon className={commonClasses} />
    </Suspense>
  );
});
