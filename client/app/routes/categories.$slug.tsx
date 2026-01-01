import type { Category, Certificate, Fabric, ProductSummary } from "@shared/schema";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import {
  type TransformContext,
  type TransformedProduct,
  transformProducts,
} from "@/lib/product-transformers";
import { apiRequest, batchFetchMediaContent, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/categories.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = getQueryClient();
  const slug = params.slug;

  if (!slug) throw new Response("Not Found", { status: 404 });

  // 1. Fetch category by slug to get ID
  await queryClient.prefetchQuery({
    queryKey: [`/api/categories/by-slug/${slug}`],
    queryFn: async () => {
      const res = await apiRequest(`/api/categories/by-slug/${slug}`);
      return res.json();
    },
  });

  const category = queryClient.getQueryData<Category>([`/api/categories/by-slug/${slug}`]);

  if (category) {
    // 2. Fetch dependencies in parallel
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["/api/categories"],
        queryFn: async () => {
          const res = await apiRequest("/api/categories");
          return res.json();
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["/api/products", { category: category.id }],
        queryFn: async () => {
          const res = await apiRequest(`/api/products?category=${category.id}`);
          return res.json();
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["/api/fabrics"],
        queryFn: async () => {
          const res = await apiRequest("/api/fabrics");
          return res.json();
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ["/api/certificates"],
        queryFn: async () => {
          const res = await apiRequest("/api/certificates");
          return res.json();
        },
      }),
    ]);
  }

  return { dehydratedState: dehydrate(queryClient) };
}

interface ProductCardProps {
  product: TransformedProduct;
}

// NOTE: Moved ProductCard component inside or imported to avoid duplicate code if possible.
// Providing locally for now as in original file.
const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, isInCart } = useInquiryCart();
  const alreadyInCart = isInCart(product.id);

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Card
      className="group overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={product.name}
      data-testid={`product-card-${product.id}`}
    >
      <CardContent className="p-0">
        <div className="bg-muted relative flex aspect-4/3 items-center justify-center overflow-hidden">
          {product.imageId ? (
            <OptimizedImage
              mediaId={isHovered && product.hoverImageId ? product.hoverImageId : product.imageId}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              aspectRatio={4 / 3}
              objectFit="contain"
              quality={85}
            />
          ) : (
            <img
              src={isHovered && product.hoverImageUrl ? product.hoverImageUrl : product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start p-4 text-center">
        <Typography.H3 className="mb-2 w-full text-lg font-semibold tracking-wide uppercase">
          {product.name}
        </Typography.H3>
        <div className="text-muted-foreground mt-1 w-full space-x-2 text-sm tracking-wide uppercase">
          <span>{product.fabric}</span>
          <span>|</span>
          <span>{product.weight.value} GSM</span>
        </div>
        <div className="text-muted-foreground mt-1 w-full space-x-2 text-sm tracking-wide uppercase">
          <span>MOQ: {product.moq}</span>
          <span>|</span>
          <span>LEAD: {product.leadTime}</span>
        </div>
        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            to={product.detailUrl} // Changed href to to for react-router
            className="hover:bg-muted flex min-h-11 w-full items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 text-xs tracking-widest text-black uppercase transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="disabled:bg-muted disabled:text-muted-foreground flex min-h-11 w-full items-center justify-center bg-black px-4 py-3 text-xs tracking-widest text-white uppercase transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed"
            data-testid={`request-quote-${product.id}`}
          >
            {alreadyInCart ? "Added" : "Request Quote"}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export function meta({}: Route.MetaArgs) {
  return [
    // Dynamic meta moved to component for data access
  ];
}

export default function CategoryDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const slug = params.slug;
  const [mediaContentMap, setMediaContentMap] = useState<Map<number, string>>(new Map());

  // Fetch category by slug
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery<Category>({
    queryKey: [`/api/categories/by-slug/${slug}`],
    queryFn: async () => {
      const res = await apiRequest(`/api/categories/by-slug/${slug}`);
      return res.json();
    },
    enabled: !!slug,
  });

  // Fetch all categories for breadcrumbs
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/categories");
      return res.json();
    },
  });

  // Fetch products for this category
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: ProductSummary[];
  }>({
    queryKey: ["/api/products", { category: category?.id }],
    queryFn: async () => {
      if (!category?.id) return { data: [] };
      const res = await apiRequest(`/api/products?category=${category.id}`);
      return res.json();
    },
    enabled: !!category?.id,
  });

  // Fetch related data
  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    queryFn: async () => {
      const res = await apiRequest("/api/fabrics");
      return res.json();
    },
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    queryFn: async () => {
      const res = await apiRequest("/api/certificates");
      return res.json();
    },
  });

  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  // Batch fetch media assets
  useMemo(() => {
    if (products.length === 0) return;

    const mediaIds = new Set<number>();
    products.forEach((product) => {
      if (product.primaryImageId) mediaIds.add(product.primaryImageId);
      if (Array.isArray(product.imageIds)) {
        product.imageIds.forEach((id) => {
          if (typeof id === "number") mediaIds.add(id);
        });
      }
    });

    const fetchMedia = async () => {
      try {
        const results = await batchFetchMediaContent(Array.from(mediaIds));
        const mediaMap = new Map<number, string>();
        results.forEach((result) => {
          if (result.success) {
            const mediaUrl = result.content || result.url || `/api/media/${result.id}/content`;
            mediaMap.set(result.id, mediaUrl);
          }
        });
        setMediaContentMap(mediaMap);
      } catch (_error) {}
    };

    fetchMedia();
  }, [products]);

  // Transform products
  const transformedProducts = useMemo(() => {
    if (!products.length || !allCategories.length) return [];

    const context: TransformContext = {
      categories: allCategories,
      fabrics,
      certificates,
      mediaAssets: [],
      mediaContentMap,
    };

    return transformProducts(products, context);
  }, [products, allCategories, fabrics, certificates, mediaContentMap]);

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!category) return [];

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
          <Loader2 className="text-muted-foreground mx-auto mb-3 h-8 w-8 animate-spin" />
          <Typography.P className="text-muted-foreground text-sm">Loading category...</Typography.P>
        </div>
      </div>
    );
  }

  // Error state
  if (categoryError || !category) {
    return (
      <div className="container mx-auto max-w-6xl px-4 pt-20 pb-8 sm:pt-24 lg:pt-28">
        <div className="py-16 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <Typography.H2 className="text-foreground mb-4 text-2xl font-bold">
            Category Not Found
          </Typography.H2>
          <Typography.P className="text-muted-foreground mb-8">
            The category you're looking for doesn't exist or has been moved.
          </Typography.P>
          <Link to="/categories">
            <button className="hover:bg-foreground/80 inline-flex items-center bg-black px-6 py-3 font-semibold text-white transition-colors">
              Browse All Categories
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-white">
        {/* SEO Meta Tags - Rendered manually since RR7 meta function is static, but we can iterate later */}
        <title>
          {category ? category.metaTitle || `${category.name} | Category` : "Category Not Found"}
        </title>
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
            <ol className="text-muted-foreground flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="text-muted-foreground/50 mx-2 h-4 w-4" />}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <Typography.H1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
              {category?.name}
            </Typography.H1>
            {category?.description && (
              <Typography.P className="text-muted-foreground max-w-3xl text-lg">
                {category.description}
              </Typography.P>
            )}
          </motion.div>

          {/* Products Grid */}
          <div className="mt-8">
            {transformedProducts.length === 0 ? (
              <div className="px-4 py-20 text-center">
                <Typography.P className="text-muted-foreground">
                  No products found in this category.
                </Typography.P>
              </div>
            ) : (
              <>
                <div className="text-muted-foreground mb-6 text-sm">
                  Showing {transformedProducts.length} product
                  {transformedProducts.length !== 1 ? "s" : ""}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                  {transformedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
