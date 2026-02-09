export interface RouteMapping {
  public: string;
  admin: string;
  description: string;
  apiEndpoint?: string;
}

export const ROUTE_MAP: RouteMapping[] = [
  {
    public: "/",
    admin: "/admin/dashboard",
    description: "Homepage / Dashboard Overview",
    apiEndpoint: "/api/dashboard/stats",
  },
  {
    public: "/products",
    admin: "/admin/products",
    description: "Product Catalog / Product Management",
    apiEndpoint: "/api/products",
  },
  {
    public: "/products/:id",
    admin: "/admin/products/:id/edit",
    description: "Product Detail / Product Editor",
    apiEndpoint: "/api/products/:id",
  },
  {
    public: "/blog",
    admin: "/admin/blog/posts",
    description: "Blog Listing / Post Management",
    apiEndpoint: "/api/blog/posts",
  },
  {
    public: "/blog/:slug",
    admin: "/admin/blog/posts/:id/edit",
    description: "Blog Post / Post Editor",
    apiEndpoint: "/api/blog/posts/:id",
  },
  {
    public: "/about",
    admin: "/admin/pages/about",
    description: "About Page / About Page Editor",
    apiEndpoint: "/api/pages/about",
  },
  {
    public: "/contact",
    admin: "/admin/settings/contact",
    description: "Contact Page / Contact Settings",
    apiEndpoint: "/api/settings/contact",
  },
  {
    public: "/gallery",
    admin: "/admin/media/gallery",
    description: "Image Gallery / Media Manager",
    apiEndpoint: "/api/media",
  },
];

// Helper function to get admin route from public route
export function getAdminRoute(publicRoute: string): string | undefined {
  const mapping = ROUTE_MAP.find((m) => m.public === publicRoute);
  return mapping?.admin;
}

// Helper function to get public route from admin route
export function getPublicRoute(adminRoute: string): string | undefined {
  const mapping = ROUTE_MAP.find((m) => m.admin === adminRoute);
  return mapping?.public;
}
