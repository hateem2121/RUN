import { useEffect } from "react";

interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEOMeta({ 
  title, 
  description, 
  keywords = "sportswear, manufacturing, B2B, sustainable, technology",
  ogImage = "/og-image.jpg",
  ogType = "website"
}: SEOMetaProps) {
  useEffect(() => {
    // Update title
    document.title = `${title} | RUN APPAREL`;
    
    // Update meta tags
    const metaTags = {
      description,
      keywords,
      "og:title": title,
      "og:description": description,
      "og:image": ogImage,
      "og:type": ogType,
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": ogImage
    };
    
    Object.entries(metaTags).forEach(([name, content]) => {
      let element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        if (name.startsWith("og:")) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    });
    
    // Structured data for organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "RUN APPAREL PVT LTD",
      "description": "Premium B2B sportswear manufacturing with sustainable practices",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`,
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "sales",
        "availableLanguage": ["English"]
      }
    };
    
    let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!scriptElement) {
      scriptElement = document.createElement("script") as HTMLScriptElement;
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(structuredData);
    
  }, [title, description, keywords, ogImage, ogType]);
  
  return null;
}