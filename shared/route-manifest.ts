export const routeManifest: Record<string, string> = {
  "/": "app/routes/_index.tsx",
  "/products": "app/routes/products.tsx",
  "/categories": "app/routes/categories._index.tsx",
  "/about": "app/routes/about.tsx",
  "/services": "app/routes/services.tsx",
  "/sustainability": "app/routes/sustainability.tsx",
  "/manufacturing": "app/routes/manufacturing.tsx",
  "/technology": "app/routes/technology.tsx",
  "/dashboard": "app/routes/dashboard.tsx",
  "/contact": "app/routes/contact.tsx",
  "/analytics": "app/routes/analytics.tsx",
  "/resources": "app/routes/resources.tsx",
  "/resources/certifications": "app/routes/certifications.tsx",
  "/resources/accessories": "app/routes/accessories.tsx",
  "/resources/size-charts": "app/routes/size-charts.tsx",
  "/resources/fabrics": "app/routes/fabrics.tsx",
  "/resources/fibers": "app/routes/fibers.tsx",
  // Admin routes
  "/admin": "app/routes/admin.tsx",
  "/admin/products": "app/routes/admin.$module.tsx",
  "/admin/categories": "app/routes/admin.$module.tsx",
  "/admin/media": "app/routes/admin.$module.tsx",
  "/admin/fabrics": "app/routes/admin.$module.tsx",
  "/admin/fibers": "app/routes/admin.$module.tsx",
  "/admin/certificates": "app/routes/admin.$module.tsx",
  "/admin/size-charts": "app/routes/admin.$module.tsx",
  "/admin/accessories": "app/routes/admin.$module.tsx",
  "/admin/navigation": "app/routes/admin.$module.tsx",
  "/admin/contact": "app/routes/admin.$module.tsx",
  "/admin/homepage": "app/routes/admin.$module.tsx",
  "/admin/about": "app/routes/admin.$module.tsx",
  "/admin/sustainability": "app/routes/admin.$module.tsx",
  "/admin/manufacturing": "app/routes/admin.$module.tsx",
  "/admin/technology": "app/routes/admin.$module.tsx",
  "/admin/storage-optimization": "app/routes/admin.$module.tsx",
  "/admin/test-runner": "app/routes/admin.$module.tsx",
  "/admin/inquiries": "app/routes/admin.$module.tsx",
  "/admin/footer": "app/routes/admin.$module.tsx",
  // API Routes
  "/api/media": "app/routes/api.media.tsx",
  // Developer & Support
  "/developer": "app/routes/developer.tsx",
  "/developer/playground": "app/routes/developer.playground.tsx",
  "/developer/guides": "app/routes/developer.guides.$slug.tsx",
  "/privacy": "app/routes/privacy.tsx",
  "/terms": "app/routes/terms.tsx",
  "/admin/": "app/routes/admin._index.tsx",
};

// Helper for fuzzy matching (simplified for SSR)
export const getComponentForPath = (pathName: string): string | undefined => {
  const cleanPath = pathName.split("?")[0];
  if (!cleanPath) {
    return undefined;
  }

  // Exact Match
  if (Object.hasOwn(routeManifest, cleanPath)) {
    return routeManifest[cleanPath as keyof typeof routeManifest];
  }

  // Fuzzy Match (Categories & Products)
  if (cleanPath.startsWith("/categories/")) {
    const parts = cleanPath.split("/").filter(Boolean);

    // /categories/:slug/products
    if (parts.length === 3 && parts[2] === "products") {
      return "app/routes/categories.$slug.products.tsx";
    }

    // /categories/:slug
    if (parts.length === 2) {
      return "app/routes/categories.$slug.tsx";
    }

    // Deep category routes /categories/...
    return "app/routes/categories.$.tsx";
  }

  // Fallback for catch-all
  if (cleanPath === "/404") {
    return "app/routes/$.tsx";
  }

  return undefined;
};
