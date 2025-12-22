/**
 * Product Breadcrumb Navigation Component
 * Displays hierarchical navigation path for products
 */

import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  id?: number;
  name: string;
  url: string;
  isActive?: boolean;
}

interface ProductBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function ProductBreadcrumbs({
  items,
  className,
  showHome = true,
}: ProductBreadcrumbsProps) {
  const allItems = showHome
    ? [{ name: "Home", url: "/", icon: Home }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-sm text-gray-600 luxury-text-secondary",
        className,
      )}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = "icon" in item ? item.icon : null;

          return (
            <li key={`${item.url}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              )}

              {isLast ? (
                <span className="font-medium text-gray-900 truncate max-w-[200px] flex items-center">
                  {Icon && <Icon className="w-4 h-4 mr-1 shrink-0" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-blue-600 transition-colors truncate max-w-[150px] flex items-center"
                >
                  {Icon && <Icon className="w-4 h-4 mr-1 shrink-0" />}
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
