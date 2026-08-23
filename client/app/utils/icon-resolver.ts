import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart,
  Box,
  Building2,
  Cog,
  Cpu,
  Facebook,
  Factory,
  FileCheck,
  FlaskConical,
  Globe,
  Grid,
  Instagram,
  Layers,
  Leaf,
  Linkedin,
  type LucideIcon,
  Mail,
  MapPin,
  Maximize2,
  Package,
  PenTool,
  Phone,
  Recycle,
  RotateCw,
  ShieldCheck,
  Shirt,
  Sliders,
  TrendingUp,
  Truck,
  Twitter,
  Users,
  Zap,
  ZoomIn,
} from "lucide-react";

/**
 * Maps string icon names (e.g., from CMS/Database/Material Symbols) to Lucide icon components.
 * Returns a fallback icon (Globe) if no match is found.
 */
const iconMap: Record<string, LucideIcon> = {
  // Navigation & Directional
  arrow_downward: ArrowDown,
  "arrow-downward": ArrowDown,
  arrowdown: ArrowDown,
  arrow_forward: ArrowRight,
  "arrow-forward": ArrowRight,
  arrowright: ArrowRight,
  arrow_outward: ArrowUpRight,
  "arrow-outward": ArrowUpRight,
  arrowupright: ArrowUpRight,

  // Lab, Science & Technology
  science: FlaskConical,
  flask: FlaskConical,
  biotech: FlaskConical,
  precision_manufacturing: Cog,
  "precision-manufacturing": Cog,
  precisionmanufacturing: Cog,
  cog: Cog,
  tune: Sliders,
  sliders: Sliders,
  rotate_right: RotateCw,
  "rotate-right": RotateCw,
  zoom_in: ZoomIn,
  "zoom-in": ZoomIn,
  fullscreen: Maximize2,
  checkroom: Shirt,
  shirt: Shirt,
  accessibility_new: Activity,
  activity: Activity,
  texture: Grid,
  schema: Box,

  // Services
  pentool: PenTool,
  "pen-tool": PenTool,
  layers: Layers,
  box: Box,
  filecheck: FileCheck,
  "file-check": FileCheck,
  cpu: Cpu,

  // Sustainability & Nature
  leaf: Leaf,
  eco: Leaf,
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
