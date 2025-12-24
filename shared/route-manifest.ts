export const routeManifest: Record<string, string> = {
	"/": "src/pages/homepage.tsx",
	"/products": "src/pages/products-new.tsx",
	"/categories": "src/pages/categories.tsx",
	"/about": "src/pages/about.tsx",
	"/services": "src/pages/services.tsx",
	"/sustainability": "src/pages/sustainability.tsx",
	"/manufacturing": "src/pages/manufacturing.tsx",
	"/technology": "src/pages/technology.tsx",
	"/dashboard": "src/pages/dashboard.tsx",
	"/contact": "src/pages/contact.tsx",
	"/analytics": "src/pages/analytics.tsx",
	"/resources": "src/pages/resources.tsx",
	"/resources/certifications": "src/pages/certifications.tsx",
	"/resources/accessories": "src/pages/accessories.tsx",
	"/resources/size-charts": "src/pages/size-charts.tsx",
	"/resources/fabrics": "src/pages/fabrics.tsx",
	"/resources/fibers": "src/pages/fibers.tsx",
	// Admin routes
	"/admin": "src/pages/admin.tsx",
	"/admin/products": "src/pages/admin.tsx",
	"/admin/categories": "src/pages/admin.tsx",
	"/admin/media": "src/pages/admin.tsx",
	"/admin/fabrics": "src/pages/admin.tsx",
	"/admin/fibers": "src/pages/admin.tsx",
	"/admin/certificates": "src/pages/admin.tsx",
	"/admin/size-charts": "src/pages/admin.tsx",
	"/admin/accessories": "src/pages/admin.tsx",
	"/admin/navigation": "src/pages/admin.tsx",
	"/admin/contact": "src/pages/admin.tsx",
	"/admin/homepage": "src/pages/admin.tsx",
	"/admin/about": "src/pages/admin.tsx",
	"/admin/sustainability": "src/pages/admin.tsx",
	"/admin/manufacturing": "src/pages/admin.tsx",
	"/admin/technology": "src/pages/admin.tsx",
	"/admin/storage-optimization": "src/pages/admin.tsx",
	"/admin/test-runner": "src/pages/admin.tsx",
	"/admin/inquiries": "src/pages/admin.tsx",
	"/admin/footer": "src/pages/admin.tsx",
};

// Helper for fuzzy matching (simplified for SSR)
export const getComponentForPath = (pathName: string): string | undefined => {
	const cleanPath = pathName.split("?")[0];
	if (!cleanPath) return undefined;

	// Exact Match
	if (Object.hasOwn(routeManifest, cleanPath)) {
		return routeManifest[cleanPath as keyof typeof routeManifest];
	}

	// Fuzzy Match (Categories)
	if (cleanPath.startsWith("/categories/")) {
		// /categories/:slug -> generic category page or product detail?
		// App.tsx uses EnhancedProductDetail for deep category routes
		// and CategoryRedirect for /categories/:slug
		// Let's optimize for Product Detail as it's the heaviest
		return "src/pages/enhanced-product-detail.tsx";
	}

	return undefined;
};
