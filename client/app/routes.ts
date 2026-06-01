import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // Public Layout Wrapper
  layout("routes/_public.tsx", [
    index("routes/_index.tsx"),
    route("blog", "routes/blog.tsx"),
    route("gallery", "routes/gallery.tsx"),
    route("collections", "routes/collections.tsx"),
    route("about", "routes/about.tsx"),
    route("accessories", "routes/accessories.tsx"),
    route("analytics", "routes/analytics.tsx"),
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
    route("privacy", "routes/privacy.tsx"),
    route("sustainability", "routes/sustainability.tsx"),
    route("technology", "routes/technology.tsx"),
    route("terms", "routes/terms.tsx"),

    // Developer Portal
    route("developer", "routes/developer.tsx", [
      index("routes/developer._index.tsx"),
      route("playground", "routes/developer.playground.tsx"),
      route("guides/:slug", "routes/developer.guides.$slug.tsx"),
    ]),

    // Categories (Public)
    route("categories", "routes/categories._index.tsx"),
    route("categories/:slug", "routes/categories.$slug.tsx"),
    route("categories/:slug/products", "routes/categories.$slug.products.tsx"),
    route("categories/*", "routes/categories.$.tsx"),
  ]),

  // Admin Layout & Routes (Not wrapped in public footer)
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route(":module/*", "routes/admin.$module.tsx"),
  ]),

  // API Routes
  route("api/media", "routes/api.media.tsx"),

  // 404 catch-all
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
