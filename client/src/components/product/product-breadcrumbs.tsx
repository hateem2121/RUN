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

export function ProductBreadcrumbs({ items, className, showHome = true }: ProductBreadcrumbsProps) {
  const allItems = showHome ? [{ name: "Home", url: "/", icon: Home }, ...items] : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("luxury-text-secondary flex items-center text-gray-600 text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = "icon" in item ? item.icon : null;

          return (
            <li key={`${item.url}-${index}`} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}

              {isLast ? (
                <span className="flex w-truncate-md items-center truncate font-medium text-gray-900">
                  {Icon && <Icon className="mr-1 h-4 w-4 shrink-0" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="flex w-truncate-sm items-center truncate transition-colors hover:text-blue-600"
                >
                  {Icon && <Icon className="mr-1 h-4 w-4 shrink-0" />}
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
