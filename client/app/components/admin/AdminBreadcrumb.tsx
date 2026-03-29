import { ChevronRight, Home } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router";

// import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

const moduleLabels: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  media: "Media Library",
  fabrics: "Fabrics",
  fibers: "Fibers",
  certificates: "Certificates",
  "size-charts": "Size Charts",
  accessories: "Accessories",
  navigation: "Navigation",
  footer: "Footer",
  homepage: "Homepage",
  about: "About Us",
  sustainability: "Sustainability",
  manufacturing: "Manufacturing",
  technology: "Technology",
  "storage-optimization": "Storage Optimization",
};

export const AdminBreadcrumb = React.memo(function AdminBreadcrumb() {
  const { pathname: location } = useLocation();
  const pathSegments = location.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/admin" }];

  if (pathSegments[1]) {
    const module = pathSegments[1];
    const label = moduleLabels[module] || module.charAt(0).toUpperCase() + module.slice(1);
    breadcrumbs.push({ label });
  }

  return (
    <nav className="mb-4 flex items-center space-x-1 text-muted-foreground text-sm">
      <Link to="/admin" className="flex items-center transition-colors hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.slice(1).map((crumb, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
          {crumb.href ? (
            <Link to={crumb.href} className="transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
});
