import type { MediaAsset } from "@shared/index";
import {
  Activity,
  Award,
  BarChart,
  Box,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  Factory,
  FileText,
  FlaskConical,
  Globe,
  HelpCircle,
  History,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Recycle,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Trash,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { memo, Suspense } from "react";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";

// Map icon names to components
const icons = {
  plus: Plus,
  trash: Trash,
  settings: Settings,
  dashboard: LayoutDashboard,
  history: History,
  user: User,
  users: Users,
  clipboard: ClipboardList,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  check: Check,
  fileText: FileText,
  box: Box,
  layers: Layers,
  shield: ShieldCheck,
  activity: Activity,
  zap: Zap,
  timeline: History,
  home: Home,
  package: Package,
  shoppingcart: ShoppingCart,
  chartbar: BarChart,
  filetext: FileText,
  mail: Mail,
  phone: Phone,
  mappin: MapPin,
  calendar: Calendar,
  logout: LogOut,
  login: LogIn,
  info: Info,
  help: HelpCircle,
  search: Search,
  menu: Menu,
  x: X,
  factory: Factory,
  recycle: Recycle,
  cpu: Cpu,
  award: Award,
  globe: Globe,
  message: MessageSquare,
  shirt: Shirt,
  leaf: Leaf,
  flask: FlaskConical,

  // Common aliases
  cart: ShoppingCart,
  chart: BarChart,
  map: MapPin,
  close: X,
  manufacturing: Factory,
  technology: Cpu,
  certifications: Award,
  global: Globe,
  contact: MessageSquare,
  products: Shirt,
  about: Info,
  sustainability: Leaf,
  innovation: FlaskConical,
};

interface NavigationIconProps {
  iconType: "media" | "fallback";
  mediaIcon?: MediaAsset;
  fallbackIcon?: string | undefined;
  className?: string | undefined;
  useAbsolutePositioning?: boolean | undefined;
  size?: number;
  strokeWidth?: number;
}

export const NavigationIcon = memo(function NavigationIcon({
  iconType,
  mediaIcon,
  fallbackIcon,
  className = "h-full w-full",
  useAbsolutePositioning = true,
  size = 24,
  strokeWidth = 2,
}: NavigationIconProps) {
  const { urls } = useOptimizedMedia(mediaIcon?.id || 0, {
    width: 80,
    quality: 90,
    format: "webp",
  });

  if (iconType === "media" && mediaIcon) {
    const imageUrl =
      urls?.small ||
      mediaIcon.url ||
      (mediaIcon.id && mediaIcon.id < 1000000000000
        ? `/api/media/${mediaIcon.id}/content`
        : undefined);

    return (
      <div
        className={
          useAbsolutePositioning
            ? "absolute inset-0 overflow-hidden rounded-full"
            : "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-muted/20"
        }
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={mediaIcon.originalName || ""}
            className="h-full w-full object-cover object-center [image-rendering:crisp-edges]"
          />
        )}
      </div>
    );
  }

  const normalizedInput = fallbackIcon?.toLowerCase().trim() || "home";
  let IconComponent = icons[normalizedInput as keyof typeof icons] || Home;

  // Apply specific colors based on icon type/name
  let iconColorClass = "text-neutral-500 dark:text-neutral-300";
  if (normalizedInput === "manufacturing") {
    iconColorClass = "text-manufacturing-accent";
  } else if (normalizedInput === "technology") {
    iconColorClass = "text-technology-accent";
  } else if (normalizedInput === "sustainability") {
    iconColorClass = "text-sustainability-primary";
  }

  const commonClasses = `${className} ${iconColorClass}`;

  // Final check for prefixed input
  if (!icons[normalizedInput as keyof typeof icons] && normalizedInput.startsWith("icon")) {
    const withoutPrefix = normalizedInput.substring(4);
    IconComponent = icons[withoutPrefix as keyof typeof icons] || IconComponent;
  }

  return (
    <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-current/20 rounded" />}>
      <IconComponent className={commonClasses} size={size} strokeWidth={strokeWidth} />
    </Suspense>
  );
});
