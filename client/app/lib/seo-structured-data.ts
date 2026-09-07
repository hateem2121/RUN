import type { ProductDetail, ProductSummary } from "@run-remix/shared";

export const DEFAULT_BASE_URL = "https://wear-run.com";

export interface OrganizationSchemaOptions {
  baseUrl?: string;
}

export interface ProductSchemaOptions {
  baseUrl?: string;
  categoryName?: string;
  imageUrl?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchemaOptions {
  baseUrl?: string;
}

/**
 * Creates Schema.org Organization and Manufacturer JSON-LD metadata
 * reflecting RUN APPAREL's ethical Sialkot manufacturing operations.
 */
export function createOrganizationSchema(options?: OrganizationSchemaOptions) {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Manufacturer"],
    name: "RUN APPAREL (PVT) LTD",
    alternateName: "RUN APPAREL",
    url: baseUrl,
    logo: `${baseUrl}/logo.webp`,
    description:
      "Ethical OEM/ODM sustainable sportswear and activewear manufacturer located in Sialkot, Pakistan.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sialkot",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 32.4945,
      longitude: 74.5229,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: `${baseUrl}/contact`,
    },
  };
}

/**
 * Creates Schema.org Product JSON-LD metadata for catalog items,
 * incorporating brand, manufacturer, category, SKU, and B2B MOQ thresholds.
 */
export function createProductSchema(
  product: ProductDetail | ProductSummary,
  options?: ProductSchemaOptions,
) {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
  const url = product.urlPath
    ? `${baseUrl}${product.urlPath.startsWith("/") ? "" : "/"}${product.urlPath}`
    : `${baseUrl}/products/${product.slug}`;

  const image =
    options?.imageUrl ||
    ("imageUrl" in product && typeof product.imageUrl === "string"
      ? product.imageUrl
      : undefined) ||
    `${baseUrl}/images/products/${product.slug}.webp`;

  const category =
    options?.categoryName ||
    ("category" in product && typeof product.category === "string" ? product.category : undefined);

  const moq = product.minimumOrderQuantity ?? 50;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    sku: product.sku || undefined,
    category,
    image,
    url,
    brand: {
      "@type": "Brand",
      name: "RUN APPAREL",
    },
    manufacturer: {
      "@type": "Organization",
      name: "RUN APPAREL (PVT) LTD",
      url: baseUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sialkot",
        addressCountry: "PK",
      },
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability:
        product.isActive === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url,
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        minValue: moq,
        unitText: "piece",
      },
    },
  };
}

/**
 * Creates Schema.org BreadcrumbList JSON-LD metadata for structured navigation paths.
 */
export function createBreadcrumbSchema(items: BreadcrumbItem[], options?: BreadcrumbSchemaOptions) {
  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl =
        item.url.startsWith("http://") || item.url.startsWith("https://")
          ? item.url
          : `${baseUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}
