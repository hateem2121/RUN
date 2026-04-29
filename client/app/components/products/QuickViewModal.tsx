import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { TransformedProduct } from "@/lib/product-transformers";
import { useQuoteStore } from "@/stores/useQuoteStore";
import { GotsIcon, OekoTexIcon, RcsIcon } from "./ProductBadges";

import { ProductImageCarousel } from "./ProductImageCarousel";

interface QuickViewModalProps {
  product: TransformedProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const addToQuote = useQuoteStore((state) => state.addToQuote);
  const items = useQuoteStore((state) => state.items);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) {
    return null;
  }

  const alreadyInCart = items.some((item) => item.id.toString() === product.id.toString());

  return (
    <div
      ref={modalRef}
      className="center-flex fixed inset-0 z-modal bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      data-testid="quick-view-modal"
    >
      <div
        className="flex h-auto max-h-modal w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-background text-foreground shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative w-full overflow-hidden bg-muted md:w-1/2">
          <ProductImageCarousel
            images={product.media.filter((m) => m.type === "image")}
            primaryVideo={product.media.find((m) => m.type === "video") ?? null}
            productName={product.name}
            viewMode="large"
          />
          <div className="absolute top-4 right-4 z-elevated flex flex-col gap-2">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>
        </div>

        {/* Product Details */}
        <div className="relative w-full overflow-y-auto p-6 md:w-1/2 md:p-8">
          <button
            onClick={onClose}
            className="sticky top-0 right-0 z-default float-right -mt-6 -mr-6 rounded-full bg-background p-2 text-2xl transition-colors hover:bg-muted hover:text-muted-foreground md:-mt-8 md:-mr-8"
            data-testid="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>

          <h2 id="product-modal-title" className="mb-2 font-bold text-2xl uppercase tracking-wide">
            {product.name}
          </h2>
          <p className="mb-6 text-muted-foreground text-sm uppercase tracking-widest">
            SKU: {product.sku}
          </p>

          <div className="mb-6 space-y-4 text-sm">
            <div className="flex justify-between border-border border-b pb-2">
              <span className="font-semibold">Fabric:</span>
              <span>{product.fabric}</span>
            </div>
            <div className="flex justify-between border-border border-b pb-2">
              <span className="font-semibold">Weight:</span>
              <span>
                {product.weight.value} {product.weight.unit}
              </span>
            </div>
            <div className="flex justify-between border-border border-b pb-2">
              <span className="font-semibold">MOQ:</span>
              <span>{product.moq} units</span>
            </div>
            <div className="flex justify-between border-border border-b pb-2">
              <span className="font-semibold">Lead Time:</span>
              <span>{product.leadTime}</span>
            </div>
            <div className="flex justify-between border-border border-b pb-2">
              <span className="font-semibold">Fit:</span>
              <span>{product.specifications.fit}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">Composition</h3>
            <p className="text-muted-foreground text-sm">
              {product.specifications.fabricComposition}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">
              Care Instructions
            </h3>
            <p className="text-muted-foreground text-sm">
              {product.specifications.careInstructions}
            </p>
          </div>

          {product.specifications.features.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">Features</h3>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                {product.specifications.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => {
                addToQuote({
                  id: Number(product.id),
                  name: product.name,
                  quantity: product.moq || 100,
                  minOrderQuantity: product.moq || 100,
                  imageUrl: product.imageUrl,
                });
              }}
              disabled={alreadyInCart}
              size="lg"
              className="w-full uppercase tracking-widest"
              data-testid="modal-request-quote"
            >
              {alreadyInCart ? "Added to Inquiry" : "Request a Quote"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full uppercase tracking-widest"
              data-testid="download-tech-sheet"
            >
              Download Tech Sheet
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full uppercase tracking-widest"
              data-testid="request-sample"
            >
              Request Sample
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
