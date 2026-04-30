import { ExternalLink, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardFooter, GlassCardDecorations } from "@/components/ui/card";
import type { TransformedProduct } from "@/lib/product-transformers";
import { cn } from "@/lib/utils";
import { useQuoteStore } from "@/stores/useQuoteStore";
import { GotsIcon, OekoTexIcon, RcsIcon } from "./ProductBadges";

import { ProductImageCarousel } from "./ProductImageCarousel";

interface ProductCardProps {
  product: TransformedProduct;
  onQuickViewClick: (product: TransformedProduct) => void;
  viewMode?: "small" | "medium" | "large";
}

export const ProductCard = ({
  product,
  onQuickViewClick,
  viewMode = "medium",
}: ProductCardProps) => {
  const addToQuote = useQuoteStore((state) => state.addToQuote);
  const items = useQuoteStore((state) => state.items);
  const alreadyInCart = items.some((item) => item.id.toString() === product.id.toString());

  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQuote({
      id: Number(product.id),
      name: product.name,
      quantity: product.moq || 100,
      minOrderQuantity: product.moq || 100,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <Card
      ref={cardRef}
      variant="glass-premium"
      className="group overflow-hidden rounded-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
      aria-label={product.name}
      data-testid={`product-card-${product.id}`}
    >
      <GlassCardDecorations />
      <CardContent className="p-0">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-muted/50",
            viewMode === "small" ? "aspect-3/4" : "aspect-4/3",
          )}
        >
          {isIntersecting ? (
            <ProductImageCarousel
              images={product.media.filter((m) => m.type === "image")}
              primaryVideo={product.media.find((m) => m.type === "video") ?? null}
              productName={product.name}
              viewMode={viewMode}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-muted" />
          )}

          {/* Certification badges */}
          <div
            className={cn(
              "absolute top-3 right-3 z-elevated flex flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100",
              viewMode === "small" && "top-2 right-2 scale-75",
            )}
          >
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>

          {/* Desktop hover overlay */}
          {viewMode !== "small" && (
            <div className="absolute inset-0 hidden items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
              <button
                onClick={() => onQuickViewClick(product)}
                className="flex min-h-11 items-center justify-center bg-background/90 px-6 py-3 text-foreground text-xs uppercase tracking-widest backdrop-blur-xs transition-colors hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                data-testid={`quick-view-${product.id}`}
                aria-label={`Quick view ${product.name}`}
              >
                Quick View
              </button>
            </div>
          )}

          {/* Mobile quick view button */}
          <button
            onClick={() => onQuickViewClick(product)}
            className={cn(
              "absolute bottom-3 left-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-background p-2 text-foreground shadow-lg transition-colors hover:bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden",
              viewMode === "small" && "bottom-2 left-2 h-8 w-8 min-h-8 min-w-8",
            )}
            data-testid={`quick-view-mobile-${product.id}`}
            aria-label="Quick view product"
          >
            <Search className={cn("h-5 w-5", viewMode === "small" && "h-4 w-4")} />
          </button>
        </div>
      </CardContent>

      <CardFooter
        className={cn("flex-col items-start p-4 text-center", viewMode === "small" && "p-2")}
      >
        <h3
          className={cn(
            "mb-2 w-full font-semibold text-foreground leading-tight uppercase tracking-wide",
            viewMode === "small" ? "line-clamp-2 text-sm" : "text-lg",
          )}
        >
          {product.name}
        </h3>

        {viewMode !== "small" && (
          <>
            <div className="mt-1 w-full space-x-2 text-muted-foreground text-sm uppercase tracking-wide">
              <span>{product.fabric}</span>
              <span>|</span>
              <span>{product.weight.value} GSM</span>
            </div>
            <div className="mt-1 w-full space-x-2 text-muted-foreground text-sm uppercase tracking-wide">
              <span>MOQ: {product.moq}</span>
              <span>|</span>
              <span>LEAD: {product.leadTime}</span>
            </div>
          </>
        )}

        <div
          className={cn(
            "mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row",
            viewMode === "small" && "mt-2",
          )}
        >
          <Link
            to={product.detailUrl}
            className="flex min-h-11 w-full items-center justify-center gap-2 border border-border bg-background px-4 py-3 text-foreground text-xs uppercase tracking-widest transition-colors hover:border-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="flex min-h-11 w-full items-center justify-center bg-primary px-4 py-3 text-primary-foreground text-xs uppercase tracking-widest transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            data-testid={`request-quote-${product.id}`}
          >
            {alreadyInCart ? "Added" : "Request Quote"}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};
