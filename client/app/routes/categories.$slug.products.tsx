import type { Category, MediaAsset, Product } from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { ChevronRight, Grid2X2, Grid3X3, LayoutGrid, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData, useNavigate, useParams } from "react-router";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/categories.$slug.products";

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = getQueryClient();
  const slug = params.slug;

  // 1. Fetch categories
  await queryClient.prefetchQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const categories = queryClient.getQueryData<Category[]>(["/api/categories"]) || [];
  const category = categories.find((c) => c.slug === slug);

  if (category) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["/api/products", "category", category.id],
        queryFn: () => apiRequest(`/api/products?category=${category.id}&active=true`),
      }),
      queryClient.prefetchQuery({
        queryKey: MediaQueryKeys.list,
        queryFn: () => apiRequest("/api/media?all=true"),
      }),
    ]);
  }

  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Category Products | Run Apparel" }];
}

export default function CategoryProductsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { slug } = useParams();
  const navigate = useNavigate();
  // location unused
  // const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState("name");

  // Fetch category by slug
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const category = categories.find((c) => c.slug === slug);

  // Fetch subcategories
  const subcategories = categories.filter((c) => c.parentId === category?.id && c.isActive);

  // Fetch media assets
  const { data: mediaData } = useQuery<{ data: MediaAsset[] }>({
    queryKey: MediaQueryKeys.list,
    queryFn: () => apiRequest("/api/media?all=true"),
  });
  const mediaAssets = mediaData?.data || [];

  // Fetch products for this category
  const { data: productsResponse, isLoading } = useQuery<{
    data: Product[];
    pagination?: { page?: number; total?: number; pageSize?: number };
  }>({
    queryKey: ["/api/products", "category", category?.id],
    queryFn: async () => {
      if (!category?.id) {
        return { data: [] };
      }
      return apiRequest(`/api/products?category=${category.id}&active=true`);
    },
    enabled: !!category?.id,
  });

  const products = productsResponse?.data || [];

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) {
      return true;
    }
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      product.shortDescription?.toLowerCase().includes(searchLower)
    );
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "featured":
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      default:
        return 0;
    }
  });

  // Get optimized media URL with robust fallback mechanism
  const getOptimizedMediaUrl = (mediaId: number | null | undefined) => {
    if (!mediaId) {
      return undefined;
    }

    // Always provide a fallback URL, even when mediaAssets isn't loaded yet
    const fallbackUrl = MediaUrlBuilder.buildUrlSafe(mediaId);

    // If mediaAssets is available, try to find the specific media
    if (Array.isArray(mediaAssets)) {
      const media = mediaAssets.find((m) => m.id === mediaId);
      return media ? media.url || fallbackUrl : fallbackUrl;
    }

    // Return fallback URL when mediaAssets is still loading
    return fallbackUrl;
  };

  // Enhanced component for optimized category banner
  const OptimizedCategoryBanner = ({
    mediaId,
    fallbackUrl,
    alt,
  }: {
    mediaId?: number;
    fallbackUrl?: string;
    alt: string;
  }) => {
    const { urls } = useOptimizedMedia(mediaId || 0, {
      width: 1920,
      quality: 90,
      format: "webp",
    });

    const optimizedSrc = urls?.large || urls?.medium || fallbackUrl;
    return <img src={optimizedSrc} alt={alt} loading="eager" fetchPriority="high" className="h-full w-full object-cover" />;
  };

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Typography.H2 className="mb-2 font-bold text-2xl">Category Not Found</Typography.H2>
          <Typography.P className="mb-4 text-muted-foreground">
            The category you're looking for doesn't exist.
          </Typography.P>
          <Button onClick={() => navigate("/products")}>Browse All Products</Button>
        </div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-muted/30">
        {/* Hero Section */}
        {category.bannerUrl && (
          <div className="relative h-64 overflow-hidden md:h-80">
            <OptimizedCategoryBanner
              mediaId={parseInt(category.bannerUrl, 10)}
              fallbackUrl={category.bannerUrl}
              alt={category.name}
            />
            <div className="center-flex absolute inset-0 bg-black/40">
              <div className="text-center text-white">
                <Typography.H1 className="mb-2 font-bold text-4xl md:text-5xl">
                  {category.name}
                </Typography.H1>
                {category.description && (
                  <Typography.P className="mx-auto max-w-2xl text-lg">
                    {category.description}
                  </Typography.P>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="border-b bg-white pt-20">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Button variant="link" className="h-auto p-0" onClick={() => navigate("/")}>
                Home
              </Button>
              <span>/</span>
              <Button variant="link" className="h-auto p-0" onClick={() => navigate("/products")}>
                Products
              </Button>
              <span>/</span>
              <span className="text-muted-foreground">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="border-b bg-white">
            <div className="container mx-auto px-4 py-6">
              <Typography.H2 className="mb-4 font-semibold text-lg">Subcategories</Typography.H2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {subcategories.map((subcat) => (
                  <Link to={`/categories/${subcat.slug}`} key={subcat.id}>
                    <Card className="group cursor-pointer transition-shadow-sm hover:shadow-md">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          {subcat.imageUrl && (
                            <img
                              src={
                                getOptimizedMediaUrl(parseInt(subcat.imageUrl, 10)) ||
                                subcat.imageUrl
                              }
                              alt={subcat.name}
                              loading="lazy"
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <Typography.H3 className="font-medium">{subcat.name}</Typography.H3>
                            <Typography.P className="text-muted-foreground text-sm">
                              {products.filter((p) => p.categoryId === subcat.id).length} products
                            </Typography.P>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b bg-white shadow-sm-xs">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <Typography.H1 className="font-bold text-2xl">
                {!category.bannerUrl && category.name}
                {category.bannerUrl && "Products"}
              </Typography.H1>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:w-72"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex gap-1 rounded-md bg-muted p-1">
                  <Button
                    size="sm"
                    variant={viewMode === "small" ? "default" : "ghost"}
                    onClick={() => setViewMode("small")}
                    className="p-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "medium" ? "default" : "ghost"}
                    onClick={() => setViewMode("medium")}
                    className="p-2"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "large" ? "default" : "ghost"}
                    onClick={() => setViewMode("large")}
                    className="p-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-2 text-muted-foreground text-sm">
              Showing {sortedProducts.length} products
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex min-h-value-card items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Typography.P className="text-muted-foreground">
                No products found in this category
              </Typography.P>
            </div>
          ) : (
            <ProductGrid products={sortedProducts} viewMode={viewMode} categories={categories} />
          )}
        </div>
      </div>
    </HydrationBoundary>
  );
}
