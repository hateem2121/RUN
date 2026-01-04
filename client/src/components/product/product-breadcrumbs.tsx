/**
 * Product Breadcrumb Navigation Component
 * Displays hierarchical navigation path for products
 */

import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  id?: number | undefined;
  name: string;
  url: string;
  isActive?: boolean | undefined;
}

interface ProductBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string | undefined;
  showHome?: boolean | undefined;
}

export function ProductBreadcrumbs({ items, className, showHome = true }: ProductBreadcrumbsProps) {
  const allItems = showHome ? [{ name: "Home", url: "/", icon: Home }, ...items] : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "luxury-text-secondary flex items-center text-muted-foreground text-sm",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = "icon" in item ? item.icon : null;

          return (
            <li key={`${item.url}-${index}`} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/70" />}

              {isLast ? (
                <span className="flex w-truncate-md items-center truncate font-medium text-foreground">
                  {Icon && <Icon className="mr-1 h-4 w-4 shrink-0" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
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
