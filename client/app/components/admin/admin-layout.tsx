import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Bell,
  Cpu,
  Database,
  Dna,
  Factory,
  FileText,
  Home,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutList,
  Leaf,
  LogOut,
  Mail,
  Menu,
  Navigation,
  PanelBottom,
  Ruler,
  Shirt,
  Users,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ModuleSearch } from "@/components/admin/ModuleSearch";
import { useAdminContext } from "@/context/AdminContext";

// --- Navigation Config ---
type LucideIcon = React.ElementType;

interface NavItem {
  label: string;
  route: string;
  icon: LucideIcon;
  group: "content" | "catalog" | "system";
  badge?: string | number;
}

const navItems: NavItem[] = [
  // CONTENT GROUP
  { label: "Dashboard", route: "/admin", icon: LayoutDashboard, group: "content" },
  { label: "Homepage", route: "/admin/homepage", icon: Home, group: "content" },
  { label: "About Us", route: "/admin/about", icon: Users, group: "content" },
  { label: "Sustainability", route: "/admin/sustainability", icon: Leaf, group: "content" },
  { label: "Manufacturing", route: "/admin/manufacturing", icon: Factory, group: "content" },
  { label: "Technology", route: "/admin/technology", icon: Cpu, group: "content" },
  { label: "Blog", route: "/admin/blog", icon: FileText, group: "content" },
  // CATALOG GROUP
  { label: "Categories", route: "/admin/categories", icon: LayoutList, group: "catalog" },
  { label: "Products", route: "/admin/products", icon: Shirt, group: "catalog" },
  { label: "Fabrics", route: "/admin/fabrics", icon: Layers, group: "catalog" },
  { label: "Fibers", route: "/admin/fibers", icon: Dna, group: "catalog" },
  { label: "Certificates", route: "/admin/certificates", icon: Award, group: "catalog" },
  { label: "Size Charts", route: "/admin/size-charts", icon: Ruler, group: "catalog" },
  { label: "Accessories", route: "/admin/accessories", icon: Zap, group: "catalog" },
  // SYSTEM GROUP
  { label: "Media Library", route: "/admin/media", icon: Image, group: "system" },
  { label: "Storage", route: "/admin/storage-optimization", icon: Database, group: "system" },
  { label: "Navigation", route: "/admin/navigation", icon: Navigation, group: "system" },
  { label: "Contact", route: "/admin/contact", icon: Mail, group: "system" },
  { label: "Footer", route: "/admin/footer", icon: PanelBottom, group: "system" },
  { label: "Inquiries", route: "/admin/inquiries", icon: Inbox, group: "system" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  currentModule?: string;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarOpen, setSidebarOpen, hasUnsavedChanges } = useAdminContext();
  const location = useLocation();

  // SEC-005: Responsive sidebar behavior for 13-inch laptops (1280px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Active state detection
  const isActiveRoute = (route: string) => {
    if (route === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(route);
  };

  // Fetch inquiries stats for badge
  const { data: inquiriesStats } = useQuery<{ newCount: number }>({
    queryKey: ["/api/v1/admin/inquiries/stats"],
    retry: false,
    staleTime: 60000,
  });

  const newInquiriesCount = inquiriesStats?.newCount || 0;

  // Group helpers
  const contentItems = navItems.filter((i) => i.group === "content");
  const catalogItems = navItems.filter((i) => i.group === "catalog");
  const systemItems = navItems.filter((i) => i.group === "system");

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6 flex flex-col gap-0.5" key={title}>
      {sidebarOpen && (
        <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#68869A]">
          {title}
        </span>
      )}
      {items.map((item) => {
        const isActive = isActiveRoute(item.route);
        let currentBadge = item.badge;
        if (item.label === "Inquiries" && newInquiriesCount > 0) {
          currentBadge = `${newInquiriesCount} NEW`;
        }

        return (
          <NavLink
            key={item.route}
            to={item.route}
            end={item.route === "/admin"}
            className={`group relative flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-l-2 border-primary bg-primary/10 text-primary"
                : "border-l-2 border-transparent text-[#68869A] hover:bg-white/5 hover:text-white"
            }`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <div className="flex items-center gap-3">
              <item.icon
                className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-inherit group-hover:text-white"}`}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </div>

            {/* Badges */}
            {sidebarOpen && currentBadge && (
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${
                  currentBadge.toString().includes("NEW")
                    ? "bg-red-500/10 text-red-500"
                    : "bg-white/10 text-[#E3DFD6]"
                }`}
              >
                {currentBadge}
              </span>
            )}
            {!sidebarOpen && currentBadge && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A] font-sans text-white antialiased">
      {/* Sidebar */}
      <aside
        className={`flex flex-shrink-0 flex-col border-r border-white/10 bg-[#111111] transition-[width] duration-200 ease-in-out ${
          sidebarOpen ? "w-[240px]" : "w-[64px]"
        }`}
      >
        {/* Sidebar Header — Logo + Toggle */}
        <div className="flex h-14 flex-shrink-0 items-center border-b border-white/10 px-4">
          {sidebarOpen ? (
            <div className="flex w-full items-center justify-between">
              <h1 className="text-sm font-bold uppercase tracking-widest text-white">
                RUN APPAREL
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1 text-[#68869A] transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Collapse sidebar"
              >
                <Menu size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mx-auto rounded-md p-1 text-[#68869A] transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 py-6">
          {renderNavGroup("Content", contentItems)}
          {renderNavGroup("Catalog", catalogItems)}
          {renderNavGroup("System", systemItems)}
        </nav>

        {/* User Footer */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#0A0A0A]/50 p-4">
          {sidebarOpen ? (
            <div className="group flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/20 text-xs font-bold uppercase text-blue-500">
                  M
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">M. Hateem</span>
                  <span className="text-xs text-[#68869A]">Admin</span>
                </div>
              </div>
              <button
                className="rounded-md p-1.5 text-[#68869A] transition-colors hover:text-white"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/20 text-xs font-bold uppercase text-blue-500"
                title="M. Hateem (Admin)"
              >
                M
              </div>
              <button className="text-[#68869A] transition-colors hover:text-white" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-6">
          {/* Left: Breadcrumb */}
          <div className="flex flex-1 items-center">
            <AdminBreadcrumb />
          </div>

          {/* Center: Search */}
          <div className="mx-auto hidden max-w-md flex-1 md:block">
            <ModuleSearch
              links={navItems
                .filter((l) => l.route !== "/")
                .map((l) => ({
                  label: l.label,
                  href: l.route,
                  icon: <l.icon className="h-4 w-4" />,
                }))}
            />
          </div>

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3">
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <div className="hidden items-center gap-1.5 rounded-md border border-[#D4A853]/20 bg-[#D4A853]/10 px-2.5 py-1 text-xs font-medium text-[#D4A853] lg:flex">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>Unsaved changes</span>
              </div>
            )}

            {/* Notifications */}
            <button
              className="relative text-[#68869A] transition-colors hover:text-white"
              title="View Notifications"
              aria-label="View Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full border border-[#0A0A0A] bg-blue-500" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/10" />

            {/* Avatar */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/20"
              aria-label="User menu"
            >
              MH
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto w-full max-w-7xl text-base">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export { navItems };
export type { NavItem };
