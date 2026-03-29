import {
  Award,
  BarChart,
  Building2,
  Facebook,
  Factory,
  Globe,
  Instagram,
  Leaf,
  Linkedin,
  type LucideIcon,
  Mail,
  MapPin,
  Package,
  Phone,
  Recycle,
  ShieldCheck,
  TrendingUp,
  Truck,
  Twitter,
  Users,
  Zap,
} from "lucide-react";

/**
 * Maps string icon names (e.g., from CMS/Database) to Lucide icon components.
 * Returns a fallback icon (Globe) if no match is found.
 */
export const iconMap: Record<string, LucideIcon> = {
  // Sustainability & Nature
  leaf: Leaf,
  recycle: Recycle,
  sustainability: Leaf,

  // Innovation & Tech
  zap: Zap,
  innovation: Zap,
  "trending-up": TrendingUp,

  // Location & Global
  "map-pin": MapPin,
  globe: Globe,
  truck: Truck,
  distribution: Truck,

  // Quality & Recognition
  award: Award,
  "shield-check": ShieldCheck,
  quality: ShieldCheck,

  // Corporate & Team
  users: Users,
  "users-group": Users,
  building: Building2,
  factory: Factory,
  manufacturing: Factory,
  package: Package,

  // Business
  "bar-chart": BarChart,
  growth: TrendingUp,

  // Contacts & Social
  phone: Phone,
  mail: Mail,
  email: Mail,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
};

export const resolveIcon = (iconName: string | undefined | null): LucideIcon => {
  if (!iconName) {
    return Globe;
  }

  const normalizedName = iconName.toLowerCase().trim();
  return iconMap[normalizedName] || Globe;
};
