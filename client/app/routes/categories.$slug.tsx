import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { useGSAP } from "@gsap/react";
import type { Category, Certificate, Fabric, ProductSummary } from "@shared/index";
import { HydrationBoundary } from "@tanstack/react-query";
import gsap from "gsap";
import { ChevronRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link, useLoaderData } from "react-router";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Typography } from "@/components/ui/typography";
import type { Route } from "./+types/categories.$slug";

export async function loader({ request, params }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const slug = params.slug;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const get = (path: string) =>
    fetch(new URL(path, base).toString(), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  // 1. Fetch category by slug
  const category = (await get(`/api/categories/by-slug/${slug}`)) as Category | null;

  if (!category) {
    throw new Response(JSON.stringify({ message: "Category not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Fetch dependencies in parallel
  const [allCategoriesRes, productsRes, fabricsRes, certificatesRes] = await Promise.all([
    get("/api/categories") as Promise<Category[] | null>,
    get(`/api/products?category=${category.id}`) as Promise<{ data: ProductSummary[] } | null>,
    get("/api/fabrics") as Promise<Fabric[] | null>,
    get("/api/certificates") as Promise<Certificate[] | null>,
  ]);

  return {
    category,
    allCategories: Array.isArray(allCategoriesRes) ? allCategoriesRes : [],
    products: Array.isArray(productsRes?.data) ? productsRes.data : [],
    fabrics: Array.isArray(fabricsRes) ? fabricsRes : [],
    certificates: Array.isArray(certificatesRes) ? certificatesRes : [],
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    // Dynamic meta moved to component for data access
  ];
}

export default function Component() {
  const loaderData = useLoaderData<typeof loader>();
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(heroRef.current, { opacity: 0, y: 20, duration: 0.4 });
    },
    { scope: heroRef },
  );

  const category = loaderData?.category;
  const allCategories = loaderData?.allCategories || [];
  const products = loaderData?.products || [];
  const fabrics = loaderData?.fabrics || [];
  const certificates = loaderData?.certificates || [];

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!category) {
      return [];
    }

    const crumbs = [
      { name: "Home", url: "/" },
      { name: "Categories", url: "/categories" },
    ];

    // Add parent categories if exists
    if (category.parentId) {
      const parent = allCategories.find((c) => c.id === category.parentId);
      if (parent) {
        crumbs.push({ name: parent.name, url: `/categories/${parent.slug}` });
      }
    }

    crumbs.push({ name: category.name, url: `/categories/${category.slug}` });

    return crumbs;
  }, [category, allCategories]);

  // No manual error state needed as loader throws 404

  return (
    <HydrationBoundary state={undefined}>
      <div className="min-h-screen bg-white">
        {/* SEO Meta Tags - Rendered manually since RR7 meta function is static, but we can iterate later */}
        {/* biome-ignore format: Keep inline to prevent React title array warning */}
        <title>{category ? category.metaTitle || `${category.name} | Category` : "Category Not Found"}</title>
        {category && (
          <meta
            name="description"
            content={
              category.metaDescription || category.description || `Browse ${category.name} products`
            }
          />
        )}

        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24 md:px-8 lg:px-10 lg:pt-28 lg:pb-16">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-8" data-testid="category-breadcrumbs">
            <ol className="flex items-center space-x-2 text-muted-foreground text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/50" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-black">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.url} className="transition-colors hover:text-black">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Category Hero */}
          <div ref={heroRef} className="mb-12">
            <Typography.H1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
              {category?.name}
            </Typography.H1>
            {category?.description && (
              <Typography.P className="max-w-3xl text-lg text-muted-foreground">
                {category.description}
              </Typography.P>
            )}
          </div>

          {/* Products Grid */}
          <div className="mt-8">
            {products.length === 0 ? (
              <div className="px-4 py-20 text-center">
                <Typography.P className="text-muted-foreground">
                  No products found in this category.
                </Typography.P>
              </div>
            ) : (
              <>
                <div className="mb-6 text-muted-foreground text-sm">
                  Showing {products.length} product
                  {products.length !== 1 ? "s" : ""}
                </div>
                <ProductGrid
                  products={products}
                  viewMode="medium"
                  categories={allCategories}
                  fabrics={fabrics}
                  certificates={certificates}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
