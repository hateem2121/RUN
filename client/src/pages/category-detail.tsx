import type { Category, Certificate, Fabric, ProductSummary } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import {
  type TransformContext,
  type TransformedProduct,
  transformProducts,
} from "@/lib/product-transformers";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { Typography } from "@/components/ui/typography";

interface ProductCardProps {
  product: TransformedProduct;
}

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
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-100">
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
        <Typography.H3 className="mb-2 w-full font-semibold text-lg uppercase tracking-wide">
          {product.name}
        </Typography.H3>
        <div className="mt-1 w-full space-x-2 text-gray-600 text-sm uppercase tracking-wide">
          <span>{product.fabric}</span>
          <span>|</span>
          <span>{product.weight.value} GSM</span>
        </div>
        <div className="mt-1 w-full space-x-2 text-gray-600 text-sm uppercase tracking-wide">
          <span>MOQ: {product.moq}</span>
          <span>|</span>
          <span>LEAD: {product.leadTime}</span>
        </div>
        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href={product.detailUrl}
            className="flex min-h-11 w-full items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 text-black text-xs uppercase tracking-widest transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-black focus:ring-offset-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="flex min-h-11 w-full items-center justify-center bg-black px-4 py-3 text-white text-xs uppercase tracking-widest transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            data-testid={`request-quote-${product.id}`}
          >
            {alreadyInCart ? "Added" : "Request Quote"}
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default function CategoryDetail() {
  const { slug } = useParams();
  const [mediaContentMap, setMediaContentMap] = useState<Map<number, string>>(new Map());

  // Fetch category by slug
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery<Category>({
    queryKey: [`/api/categories/by-slug/${slug}`],
    enabled: !!slug,
  });

  // Fetch all categories for breadcrumbs
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch products for this category
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: ProductSummary[];
  }>({
    queryKey: ["/api/products", { category: category?.id }],
    enabled: !!category?.id,
  });

  // Fetch related data
  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
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
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-gray-600" />
          <Typography.P className="text-gray-600 text-sm">Loading category...</Typography.P>
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
          <Typography.H2 className="mb-4 font-bold text-2xl text-gray-900">
            Category Not Found
          </Typography.H2>
          <Typography.P className="mb-8 text-gray-600">
            The category you're looking for doesn't exist or has been moved.
          </Typography.P>
          <Link href="/categories">
            <button className="inline-flex items-center bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800">
              Browse All Categories
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Meta Tags */}
      <title>{category.metaTitle || `${category.name} | Category`}</title>
      <meta
        name="description"
        content={
          category.metaDescription || category.description || `Browse ${category.name} products`
        }
      />

      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24 md:px-8 lg:px-10 lg:pt-28 lg:pb-16">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8" data-testid="category-breadcrumbs">
          <ol className="flex items-center space-x-2 text-gray-600 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-black">{crumb.name}</span>
                ) : (
                  <Link href={crumb.url}>
                    <a className="transition-colors hover:text-black">{crumb.name}</a>
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
          <Typography.H1 className="mb-4 font-bold text-4xl text-gray-900 md:text-5xl">
            {category.name}
          </Typography.H1>
          {category.description && (
            <Typography.P className="max-w-3xl text-gray-600 text-lg">
              {category.description}
            </Typography.P>
          )}
        </motion.div>

        {/* Products Grid */}
        <div className="mt-8">
          {transformedProducts.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <Typography.P className="text-gray-600">
                No products found in this category.
              </Typography.P>
            </div>
          ) : (
            <>
              <div className="mb-6 text-gray-600 text-sm">
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
  );
}
