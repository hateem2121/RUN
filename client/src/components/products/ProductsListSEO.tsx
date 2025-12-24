import type { Category } from "@shared/schema";
import { useEffect } from "react";

interface ProductsListSEOProps {
  category?: Category;
  searchTerm?: string;
  totalProducts: number;
}

export function ProductsListSEO({ category, searchTerm, totalProducts }: ProductsListSEOProps) {
  useEffect(() => {
    // Update document title
    let title = "Products";
    if (searchTerm) {
      title = `Search Results for "${searchTerm}"`;
    } else if (category) {
      title = category.name;
    }
    document.title = `${title} - B2B Sportswear Manufacturing | RUN APPAREL`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      let description = `Browse our professional sportswear manufacturing catalog. ${totalProducts} products available.`;
      if (searchTerm) {
        description = `Search results for "${searchTerm}" in our B2B sportswear catalog. ${totalProducts} products found.`;
      } else if (category) {
        description = `${category.name} manufacturing solutions. Browse ${totalProducts} professional ${category.name.toLowerCase()} products for B2B textile needs.`;
      }
      metaDescription.setAttribute("content", description);
    }

    // Add structured data for product listing
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category ? category.name : "Products",
      "description": category?.description || "Professional B2B sportswear manufacturing catalog",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Products",
            "item": "/products"
          },
          ...(category ? [{
            "@type": "ListItem",
            "position": 3,
            "name": category.name,
            "item": `/categories/${category.slug}`
          }] : [])
        ]
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": totalProducts,
        "itemListOrder": "https://schema.org/ItemListUnordered"
      }
    });

    document.head.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(script);
    };
  }, [category, searchTerm, totalProducts]);

  return null;
}