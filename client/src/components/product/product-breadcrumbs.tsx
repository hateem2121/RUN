/**
 * Product Breadcrumb Navigation Component
 * Displays hierarchical navigation path for products
 */

import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router";
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
      className={cn(
        "luxury-text-secondary text-muted-foreground flex items-center text-sm",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = "icon" in item ? item.icon : null;

          return (
            <li key={`${item.url}-${index}`} className="flex items-center">
              {index > 0 && <ChevronRight className="text-muted-foreground/70 mx-1 h-4 w-4" />}

              {isLast ? (
                <span className="w-truncate-md text-foreground flex items-center truncate font-medium">
                  {Icon && <Icon className="mr-1 h-4 w-4 shrink-0" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="w-truncate-sm flex items-center truncate transition-colors hover:text-blue-600"
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
