import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("about", "routes/about.tsx"),
  route("accessories", "routes/accessories.tsx"),

  // Admin Layout & Routes
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route(":module", "routes/admin.$module.tsx"),
  ]),

  route("analytics", "routes/analytics.tsx"),

  // API Routes
  route("api/media", "routes/api.media.tsx"),
  route("api/navigation-items", "routes/api.navigation-items.tsx"),

  // Categories
  route("categories", "routes/categories._index.tsx"),
  route("categories/:slug", "routes/categories.$slug.tsx"),
  route("categories/:slug/products", "routes/categories.$slug.products.tsx"),
  route("categories/:category/:product", "routes/categories.$category.$product.tsx"),

  route("certifications", "routes/certifications.tsx"),
  route("contact", "routes/contact.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("fabrics", "routes/fabrics.tsx"),
  route("fibers", "routes/fibers.tsx"),
  route("manufacturing", "routes/manufacturing.tsx"),
  route("products", "routes/products.tsx"),
  route("resources", "routes/resources.tsx"),
  route("services", "routes/services.tsx"),
  route("size-charts", "routes/size-charts.tsx"),
  route("sustainability", "routes/sustainability.tsx"),
  route("technology", "routes/technology.tsx"),
] satisfies RouteConfig;
