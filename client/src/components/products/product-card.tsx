import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
        <div className="bg-muted/50 relative flex aspect-4/3 items-center justify-center overflow-hidden">
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
              className="bg-background/90 text-foreground hover:bg-background focus:ring-ring flex min-h-11 items-center justify-center px-6 py-3 text-xs tracking-widest uppercase backdrop-blur-xs transition-colors focus:ring-2 focus:ring-offset-2"
              data-testid={`quick-view-${product.id}`}
            >
              Quick View
            </button>
          </div>

          {/* Mobile quick view button */}
          <button
            onClick={() => onQuickViewClick(product)}
            className="bg-background text-foreground hover:bg-muted focus:ring-ring absolute bottom-3 left-3 flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 shadow-lg transition-colors focus:ring-2 focus:ring-offset-2 md:hidden"
            data-testid={`quick-view-mobile-${product.id}`}
            aria-label="Quick view product"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start p-4 text-center">
        <h3 className="text-foreground mb-2 w-full text-lg font-semibold tracking-wide uppercase">
          {product.name}
        </h3>
        <div className="text-muted-foreground mt-1 w-full space-x-2 text-sm tracking-wide uppercase">
          <span>{product.fabric}</span>
          <span>|</span>
          <span>{product.weight.value} GSM</span>
        </div>
        <div className="text-muted-foreground mt-1 w-full space-x-2 text-sm tracking-wide uppercase">
          <span>MOQ: {product.moq}</span>
          <span>|</span>
          <span>LEAD: {product.leadTime}</span>
        </div>

        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            to={product.detailUrl}
            className="border-border bg-background text-foreground hover:border-foreground focus:ring-ring flex min-h-11 w-full items-center justify-center gap-2 border px-4 py-3 text-xs tracking-widest uppercase transition-colors focus:ring-2 focus:ring-offset-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="bg-primary text-primary-foreground focus:ring-ring disabled:bg-muted disabled:text-muted-foreground flex min-h-11 w-full items-center justify-center px-4 py-3 text-xs tracking-widest uppercase transition-colors focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
            data-testid={`request-quote-${product.id}`}
          >
            {alreadyInCart ? "Added" : "Request Quote"}
          </button>
        </div>
      </CardFooter>
    </GlassCard>
  );
};
