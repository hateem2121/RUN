/**
 * Enhanced Recommendations Component - "Complete the Kit"
 * Premium grid layout with hover effects and proper navigation
 */

import { useGSAP } from "@gsap/react";
import type { Product } from "@shared/index";
import gsap from "gsap";
import { useRef } from "react";
import { Link } from "react-router";
import { ClippedElement } from "@/components/ui/ClippedElement";

interface EnhancedRecommendationsProps {
  products: Product[];
  title?: string | undefined;
  description?: string | undefined;
}

interface RecommendationCardProps {
  product: Product;
  index: number;
}

function RecommendationCard({ product, index }: RecommendationCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        delay: index * 0.05,
        ease: "power2.out",
      });
    },
    { scope: cardRef },
  );

  const productUrl = product.urlPath || `/categories/${product.slug}`;

  return (
    <Link key={product.id} to={productUrl}>
      <div
        ref={cardRef}
        className="group cursor-pointer border border-transparent p-4 text-center transition-all duration-300 ease-in-out hover:border-border"
        data-testid={`card-recommendation-${product.id}`}
      >
        <div className="aspect-h-4 aspect-w-3 overflow-hidden bg-muted">
          {product.primaryImageId ? (
            <img
              src={`/api/media/${product.primaryImageId}`}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              data-testid={`img-recommendation-${product.id}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground/70 text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3
            className="font-semibold text-foreground text-sm"
            data-testid={`text-recommendation-name-${product.id}`}
          >
            {product.name}
          </h3>
          {product.sku && (
            <p
              className="mt-1 text-muted-foreground text-sm"
              data-testid={`text-recommendation-sku-${product.id}`}
            >
              {product.sku}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export const EnhancedRecommendations: React.FC<EnhancedRecommendationsProps> = ({
  products,
  title = "COMPLETE THE KIT",
  description,
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(headerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" });
    },
    { scope: headerRef },
  );

  useGSAP(
    () => {
      gsap.from(footerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" });
    },
    { scope: footerRef },
  );

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef}>
          <h2 className="mb-4 text-center font-black-display text-3xl md:text-4xl">{title}</h2>
          {description && (
            <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-5">
          {products.slice(0, 10).map((product, index) => (
            <RecommendationCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div ref={footerRef} className="mt-16 flex justify-center">
          <Link to="/products">
            <ClippedElement
              as="button"
              className="transform bg-black px-16 py-4 font-bold text-sm text-white tracking-[0.2em] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-muted/80"
            >
              EXPLORE FULL CATALOG
            </ClippedElement>
          </Link>
        </div>
      </div>
    </div>
  );
};
