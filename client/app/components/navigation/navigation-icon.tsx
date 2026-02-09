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
const IconLogout = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconLogout.mjs"));
const IconLogin = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconLogin.mjs"));
const IconInfoCircle = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs"));
const IconHelp = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconHelp.mjs"));
const IconSearch = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconSearch.mjs"));
const IconMenu2 = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconMenu2.mjs"));
const IconX = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconX.mjs"));
const IconBuildingFactory2 = lazy(
  () => import("@tabler/icons-react/dist/esm/icons/IconBuildingFactory2.mjs"),
);
const IconRecycle = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconRecycle.mjs"));
const IconCpu = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconCpu.mjs"));
const IconAward = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconAward.mjs"));
const IconGlobe = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconGlobe.mjs"));
const IconMessage = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconMessage.mjs"));
const IconShirt = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconShirt.mjs"));
const IconLeaf = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconLeaf.mjs"));
const IconFlask = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconFlask.mjs"));
const IconTimeline = lazy(() => import("@tabler/icons-react/dist/esm/icons/IconTimeline.mjs"));

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
  IconLogout,
  IconLogin,
  IconInfoCircle,
  IconHelp,
  IconBuildingFactory2,
  IconRecycle,
  IconCpu,
  IconAward,
  IconGlobe,
  IconMessage,
  IconShirt,
  IconLeaf,
  IconFlask,
  IconTimeline,

  // Common aliases
  home: IconHome,
  user: IconUser,
  users: IconUsers,
  settings: IconSettings,
  dashboard: IconDashboard,
  box: IconBox,
  package: IconPackage,
  cart: IconShoppingCart,
  shoppingcart: IconShoppingCart,
  chart: IconChartBar,
  file: IconFileText,
  mail: IconMail,
  phone: IconPhone,
  map: IconMapPin,
  mappin: IconMapPin,
  calendar: IconCalendar,
  search: IconSearch,
  menu: IconMenu2,
  close: IconX,
  logout: IconLogout,
  login: IconLogin,
  info: IconInfoCircle,
  help: IconHelp,
  factory: IconBuildingFactory2,
  manufacturing: IconBuildingFactory2,
  recycle: IconRecycle,
  technology: IconCpu,
  cpu: IconCpu,
  award: IconAward,
  certifications: IconAward,
  globe: IconGlobe,
  global: IconGlobe,
  contact: IconMessage,
  message: IconMessage,
  products: IconShirt,
  shirt: IconShirt,
  about: IconInfoCircle,
  sustainability: IconLeaf,
  leaf: IconLeaf,
  rd: IconFlask,
  innovation: IconFlask,
  timeline: IconTimeline,
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
  let SelectedIcon: React.LazyExoticComponent<React.ComponentType<{ className?: string }>> =
    IconHome;

  if (iconType === "fallback" && fallbackIcon) {
    const normalizedInput = fallbackIcon.toLowerCase().trim();

    // 1. Try direct map (exact or alias)
    const iconByInput = ICON_MAP[normalizedInput];
    if (iconByInput) {
      SelectedIcon = iconByInput;
    }
    // 2. Try prefixing with 'Icon'
    else {
      const iconByPrefix = ICON_MAP[`Icon${fallbackIcon}`];
      if (iconByPrefix) {
        SelectedIcon = iconByPrefix;
      }
      // 3. Try key lookup in ICON_MAP (case-insensitive)
      else {
        const foundKey = Object.keys(ICON_MAP).find(
          (key) =>
            key.toLowerCase() === normalizedInput || key.toLowerCase() === `icon${normalizedInput}`,
        );
        if (foundKey) {
          const iconByFoundKey = ICON_MAP[foundKey];
          if (iconByFoundKey) {
            SelectedIcon = iconByFoundKey;
          }
        }
      }
    }
  }

  return (
    <Suspense fallback={Loader}>
      <SelectedIcon className={commonClasses} />
    </Suspense>
  );
});
