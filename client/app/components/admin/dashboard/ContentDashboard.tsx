import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Cpu,
  Database,
  Dna,
  Factory,
  FileText,
  Image,
  Inbox,
  Layers,
  LayoutList,
  Leaf,
  Mail,
  Menu as MenuIcon,
  Ruler,
  Shirt,
  Zap,
} from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "@/components/ui/card";

// --- Stat card config ---
interface StatCard {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  queryKey: string;
  fallbackCount: number;
  subtitle: string;
  route: string;
  badge?: string;
}

const statCards: StatCard[] = [
  {
    label: "Products",
    icon: Shirt,
    iconColor: "text-blue-500 bg-blue-500/10",
    queryKey: "products",
    fallbackCount: 0,
    subtitle: "Active in catalog",
    route: "/admin/products",
  },
  {
    label: "Categories",
    icon: LayoutList,
    iconColor: "text-emerald-500 bg-emerald-500/10",
    queryKey: "categories",
    fallbackCount: 0,
    subtitle: "Structured taxonomy",
    route: "/admin/categories",
  },
  {
    label: "Media",
    icon: Image,
    iconColor: "text-purple-500 bg-purple-500/10",
    queryKey: "media",
    fallbackCount: 0,
    subtitle: "Images & videos",
    route: "/admin/media",
  },
  {
    label: "Fabrics",
    icon: Layers,
    iconColor: "text-indigo-500 bg-indigo-500/10",
    queryKey: "fabrics",
    fallbackCount: 0,
    subtitle: "Material compositions",
    route: "/admin/fabrics",
  },
  {
    label: "Fibers",
    icon: Dna,
    iconColor: "text-cyan-500 bg-cyan-500/10",
    queryKey: "fibers",
    fallbackCount: 0,
    subtitle: "Raw materials",
    route: "/admin/fibers",
  },
  {
    label: "Certificates",
    icon: Award,
    iconColor: "text-yellow-500 bg-yellow-500/10",
    queryKey: "certificates",
    fallbackCount: 0,
    subtitle: "Compliance & eco",
    route: "/admin/certificates",
  },
  {
    label: "Size Charts",
    icon: Ruler,
    iconColor: "text-pink-500 bg-pink-500/10",
    queryKey: "size-charts",
    fallbackCount: 0,
    subtitle: "Global measurements",
    route: "/admin/size-charts",
  },
  {
    label: "Accessories",
    icon: Zap,
    iconColor: "text-rose-500 bg-rose-500/10",
    queryKey: "accessories",
    fallbackCount: 0,
    subtitle: "Trims & hardware",
    route: "/admin/accessories",
  },
  {
    label: "Blog Posts",
    icon: FileText,
    iconColor: "text-teal-500 bg-teal-500/10",
    queryKey: "blog",
    fallbackCount: 0,
    subtitle: "Published articles",
    route: "/admin/blog",
  },
  {
    label: "Inquiries",
    icon: Inbox,
    iconColor: "text-red-500 bg-red-500/10",
    queryKey: "inquiries",
    fallbackCount: 0,
    subtitle: "Unread messages",
    route: "/admin/inquiries",
    badge: "New",
  },
  {
    label: "Navigation",
    icon: MenuIcon,
    iconColor: "text-orange-500 bg-orange-500/10",
    queryKey: "navigation",
    fallbackCount: 0,
    subtitle: "Main menu items",
    route: "/admin/navigation",
  },
  {
    label: "Storage",
    icon: Database,
    iconColor: "text-gray-400 bg-gray-400/10",
    queryKey: "storage",
    fallbackCount: 0,
    subtitle: "Used capacity",
    route: "/admin/storage-optimization",
  },
];

// --- Health panel config ---
interface HealthPanel {
  title: string;
  icon: React.ElementType;
  color: string;
  stats: { label: string; value: string }[];
}

const healthPanels: HealthPanel[] = [
  {
    title: "Sustainability Impact",
    icon: Leaf,
    color: "text-emerald-500",
    stats: [
      { label: "Current Goals", value: "12 Active" },
      { label: "Sustainable Fabrics", value: "68% Total" },
      { label: "Carbon Reduction", value: "-15% YoY" },
    ],
  },
  {
    title: "Manufacturing Excellence",
    icon: Factory,
    color: "text-amber-500",
    stats: [
      { label: "Optimized Processes", value: "24/30" },
      { label: "Quality Score", value: "98.5%" },
      { label: "Capabilities", value: "14 Sites" },
    ],
  },
  {
    title: "Technology Innovation",
    icon: Cpu,
    color: "text-cyan-500",
    stats: [
      { label: "Research Projects", value: "7 Active" },
      { label: "Automation", value: "90%" },
      { label: "Digital Maturity", value: "40%" },
    ],
  },
];

// --- Dashboard Stats Response ---
interface DashboardStats {
  products?: number;
  categories?: number;
  media?: number;
  fabrics?: number;
  fibers?: number;
  certificates?: number;
  "size-charts"?: number;
  accessories?: number;
  blog?: number;
  inquiries?: number;
  navigation?: number;
  storage?: number;
}

export function ContentDashboard() {
  // Fetch dashboard stats from API
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/v1/admin/dashboard/stats"],
    retry: false,
    staleTime: 60000,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-[#68869A]">Welcome back. Here's your content overview.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const count = stats?.[card.queryKey as keyof DashboardStats] ?? card.fallbackCount;
          return (
            <Card
              key={card.label}
              variant="glass-premium"
              interactive
              className="group relative flex min-h-[140px] flex-col justify-between"
            >
              <Link to={card.route} className="flex h-full flex-col justify-between p-5">
                {card.badge && (
                  <div className="absolute right-4 top-4 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {card.badge}
                  </div>
                )}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded ${card.iconColor}`}
                  >
                    <card.icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-blue-500">
                    {card.label}
                  </h3>
                </div>
                <div>
                  <div className="mb-1 text-3xl font-bold text-white">{count}</div>
                  <p className="text-xs text-[#9CA3AF]">{card.subtitle}</p>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Content Health Overview */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-white">Content Health Overview</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {healthPanels.map((panel) => (
            <Card key={panel.title} variant="glass-premium">
              <CardContent className="p-6">
                <h3 className={`mb-6 flex items-center gap-2 font-semibold ${panel.color}`}>
                  <panel.icon className="h-5 w-5" />
                  {panel.title}
                </h3>
                <div className="space-y-4">
                  {panel.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-end justify-between border-b border-white/[0.08] pb-2"
                    >
                      <span className="text-sm text-[#9CA3AF]">{stat.label}</span>
                      <span className="font-medium text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 border-t border-white/[0.08] pt-6">
        <Link
          to="/admin/products"
          className="flex items-center gap-2 rounded-md bg-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
        >
          <Shirt className="h-[18px] w-[18px]" />
          New Product
        </Link>
        <Link
          to="/admin/media"
          className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/[0.08]"
        >
          <Image className="h-[18px] w-[18px]" />
          Upload Media
        </Link>
        <Link
          to="/admin/blog"
          className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/[0.08]"
        >
          <FileText className="h-[18px] w-[18px]" />
          Write Blog Post
        </Link>
        <Link
          to="/admin/inquiries"
          className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/[0.08]"
        >
          <Mail className="h-[18px] w-[18px]" />
          View Inquiries
        </Link>
      </div>
    </div>
  );
}
