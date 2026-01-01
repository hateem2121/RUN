/**
 * Product Navigation Component
 * Previous/Next product navigation within category
 */

import type { Product } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductNavigationProps {
  previousProduct: Product | null;
  nextProduct: Product | null;
  className?: string;
}

export function ProductNavigation({
  previousProduct,
  nextProduct,
  className,
}: ProductNavigationProps) {
  if (!previousProduct && !nextProduct) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between py-6", className)}>
      <div className="flex-1">
        {previousProduct && (
          <Link to={(previousProduct as any).canonicalUrl || `/products/${previousProduct.slug}`}>
            <Button variant="ghost" className="group">
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <div className="text-left">
                <div className="text-muted-foreground text-xs">Previous</div>
                <div className="max-w-40 truncate text-sm font-medium">{previousProduct.name}</div>
              </div>
            </Button>
          </Link>
        )}
      </div>

      <div className="flex-1 text-right">
        {nextProduct && (
          <Link to={(nextProduct as any).canonicalUrl || `/products/${nextProduct.slug}`}>
            <Button variant="ghost" className="group">
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Next</div>
                <div className="max-w-40 truncate text-sm font-medium">{nextProduct.name}</div>
              </div>
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
