import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string | undefined;
  description?: string | undefined;
  ogImage?: string | undefined;
  ogType?: string | undefined;
  canonicalUrl?: string | undefined;
}

export function SEO({
  title,
  description = "Premium sustainable activewear for the modern athlete.",
  ogImage = "/og-image.jpg",
  ogType = "website",
  canonicalUrl,
}: SEOProps) {
  const siteTitle = "RUN-Remix";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
