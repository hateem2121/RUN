import type { Category, Fabric, Product } from "@shared/schema";
import { useEffect } from "react";

interface ProductSEOProps {
  product: Product;
  category?: Category;
  fabric?: Fabric;
  imageUrl?: string;
}

export function ProductSEO({ product, category, fabric, imageUrl }: ProductSEOProps) {
  useEffect(() => {
    // Update document title
    document.title = `${product.name} - ${category?.name || "Products"} | RUN APPAREL`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", 
        product.description || 
        `Professional ${category?.name || "sportswear"} manufacturing. ${product.name} with ${fabric?.name || "premium fabric"}. B2B textile solutions.`
      );
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", `${product.name} - RUN APPAREL`);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", product.description || `Professional ${category?.name || "sportswear"} manufacturing.`);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && imageUrl) {
      ogImage.setAttribute("content", imageUrl);
    }

    // Add structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": "RUN APPAREL"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "RUN APPAREL (PVT) LTD"
      },
      "category": category?.name,
      "material": fabric?.name,
      "image": imageUrl,
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "eligibleQuantity": {
          "@type": "QuantitativeValue",
          "minValue": product.minimumOrderQuantity || 100
        }
      }
    });

    document.head.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(script);
    };
  }, [product, category, fabric, imageUrl]);

  return null;
}