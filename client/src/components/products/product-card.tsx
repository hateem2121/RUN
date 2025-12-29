import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { CardContent, CardFooter } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import type { TransformedProduct } from "@/lib/product-transformers";
import { GotsIcon, OekoTexIcon, RcsIcon } from "./product-badges";

interface ProductCardProps {
  product: TransformedProduct;
  onQuickViewClick: (product: TransformedProduct) => void;
}

export const ProductCard = ({ product, onQuickViewClick }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, isInCart } = useInquiryCart();
  const alreadyInCart = isInCart(product.id);

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const showHoverImage = isHovered && (product.hoverImageId || product.hoverImageUrl);
  const activeMediaId = showHoverImage ? product.hoverImageId : product.imageId;
  const activeImageUrl = showHoverImage ? product.hoverImageUrl : product.imageUrl;

  return (
    <GlassCard
      className="group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={product.name}
      data-testid={`product-card-${product.id}`}
    >
      <CardContent className="p-0">
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/50">
          {activeMediaId ? (
            <OptimizedImage
              mediaId={activeMediaId}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              aspectRatio={4 / 3}
              objectFit="contain"
              quality={85}
            />
          ) : (
            <img
              src={activeImageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}

          {/* Certification badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>

          {/* Desktop hover overlay */}
          <div className="absolute inset-0 hidden items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
            <button
              onClick={() => onQuickViewClick(product)}
              className="flex min-h-11 items-center justify-center bg-background/90 px-6 py-3 text-foreground text-xs uppercase tracking-widest backdrop-blur-xs transition-colors hover:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              data-testid={`quick-view-${product.id}`}
            >
              Quick View
            </button>
          </div>

          {/* Mobile quick view button */}
          <button
            onClick={() => onQuickViewClick(product)}
            className="absolute bottom-3 left-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-background p-2 text-foreground shadow-lg transition-colors hover:bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
            data-testid={`quick-view-mobile-${product.id}`}
            aria-label="Quick view product"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start p-4 text-center">
        <h3 className="mb-2 w-full font-semibold text-foreground text-lg uppercase tracking-wide">
          {product.name}
        </h3>
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

        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href={product.detailUrl}
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
    </GlassCard>
  );
};
