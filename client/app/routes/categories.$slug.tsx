import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { useGSAP } from "@gsap/react";
import type { Category, Certificate, Fabric, ProductSummary } from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ChevronRight, Loader2 } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link, useLoaderData, useParams } from "react-router";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Typography } from "@/components/ui/typography";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/categories.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = getQueryClient();
  const slug = params.slug;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  // 1. Fetch category by slug to get ID
  await queryClient.prefetchQuery({
    queryKey: [`/api/categories/by-slug/${slug}`],
    queryFn: () => apiRequest(`/api/categories/by-slug/${slug}`),
  });

  const category = queryClient.getQueryData<Category>([`/api/categories/by-slug/${slug}`]);

  if (!category) {
    throw new Response(JSON.stringify({ message: "Category not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Fetch dependencies in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["/api/categories"],
      queryFn: () => apiRequest("/api/categories"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/products", { category: category.id }],
      queryFn: () => apiRequest(`/api/products?category=${category.id}`),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/fabrics"],
      queryFn: () => apiRequest("/api/fabrics"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/certificates"],
      queryFn: () => apiRequest("/api/certificates"),
    }),
  ]);

  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    // Dynamic meta moved to component for data access
  ];
}

export default function Component() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const slug = params.slug;
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(heroRef.current, { opacity: 0, y: 20, duration: 0.4 });
    },
    { scope: heroRef },
  );

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/by-slug/${slug}`],
    queryFn: () => apiRequest(`/api/categories/by-slug/${slug}`),
    enabled: !!slug,
  });

  // Fetch all categories for breadcrumbs
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  // Fetch products for this category
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: ProductSummary[];
  }>({
    queryKey: ["/api/products", { category: category?.id }],
    queryFn: async () => {
      if (!category?.id) {
        return { data: [] };
      }
      return apiRequest(`/api/products?category=${category.id}`);
    },
    enabled: !!category?.id,
  });

  // Fetch related data
  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    queryFn: () => apiRequest("/api/fabrics"),
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    queryFn: () => apiRequest("/api/certificates"),
  });

  const products = Array.isArray(productsData?.data) ? productsData.data : [];

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

  // Loading state
  if (categoryLoading || productsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
          <Typography.P className="text-muted-foreground text-sm">Loading category...</Typography.P>
        </div>
      </div>
    );
  }

  // No manual error state needed as loader throws 404

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
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
