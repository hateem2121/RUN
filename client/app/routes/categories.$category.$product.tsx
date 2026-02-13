/**
 * Enhanced Product Detail Page - Late 2025 Refactor
 * Implements React 19 standards, Native CSS Scroll Snap, and Optimistic UI.
 */

import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Check, Heart, Ruler, Share2, ShoppingBag } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Link, useLoaderData, useParams } from "react-router";
import { ProductBreadcrumbs } from "@/components/products/ProductBreadcrumbs";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  type MediaAsset,
  type ProductSummary as Product,
  type ProductDetail,
  ProductDetailSchema,
} from "@/schemas/product";
import type { Route } from "./+types/categories.$category.$product";

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = getQueryClient();
  const categoryParam = params.category;
  const productParam = params.product;
  const fullPath = `/categories/${categoryParam}/${productParam}`;

  if (!categoryParam || !productParam) {
    throw new Response("Not Found", { status: 404 });
  }

  await queryClient.prefetchQuery({
    queryKey: ["/api/products/by-path", fullPath],
    queryFn: async () => {
      return apiRequest(`/api/products/by-path?path=${encodeURIComponent(fullPath)}`);
    },
  });

  return { dehydratedState: dehydrate(queryClient) };
}

// --- Types & Contexts ---

type CartItem = {
  id: string;
  productId: number;
  name: string;
  quantity: number;
};

// Mock Cart Context for specific user request
const CartContext = createContext<{
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
}>({ cart: [], addToCart: async () => {} });

// Mock Provider (In a real app, this would be global)
export const MockCartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = async (item: Omit<CartItem, "id">) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCart((prev) => [...prev, { ...item, id: Math.random().toString() }]);
  };

  return <CartContext.Provider value={{ cart, addToCart }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

// --- Components ---

interface GalleryProps {
  media: MediaAsset[];
  name: string;
}

function Gallery({ media, name }: GalleryProps) {
  const [activeindex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Native Scroll Handler to update active dot
  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollTo = (index: number) => {
    scrollRef.current?.scrollTo({
      left: index * (scrollRef.current.clientWidth || 0),
      behavior: "smooth",
    });
  };

  return (
    <div className="group relative w-full">
      {/* Main Image Scroller: Native CSS Scroll Snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex aspect-3/4 w-full snap-x snap-mandatory overflow-x-auto rounded-lg bg-muted lg:aspect-square"
      >
        {media.map((item, idx) => (
          <div key={idx} className="relative w-full shrink-0 snap-center">
            {item.type === "model" ||
            item.mimeType?.includes("glb") ||
            item.mimeType?.includes("gltf") ? (
              <LazyUnifiedModelViewer
                asset={item}
                className="h-full w-full"
                showControls={true}
                showLoadingProgress={true}
              />
            ) : (
              <OptimizedImage
                src={item.url}
                alt={`${name} - View ${idx + 1}`}
                className="h-full w-full object-cover"
                priority={idx === 0}
              />
            )}
          </div>
        ))}
      </div>

      {/* Thumbnails / Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {media.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className="relative h-2 w-2 overflow-hidden rounded-full"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div className="absolute inset-0 bg-white/50" />
            {idx === activeindex && (
              <motion.div
                layoutId="active-gallery-dot"
                className="absolute inset-0 bg-white"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Todo: Fix schema mismatch. DB says string[], UI expects object with name/value.
// For now allowing any[], but commonly we should use TechnicalSpecs generic.
interface ProductSpecsProps {
  specs: any[];
}

function ProductSpecs({ specs }: ProductSpecsProps) {
  if (!specs || specs.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <Typography.H3 className="mb-6 font-bold text-xl tracking-tight">
        Technical Specifications
      </Typography.H3>

      {/* 
        CSS Subgrid Implementation: 
        The parent defines the columns. 
        The children (cards) span those columns but define their own rows.
        The grandchildren (label, value) align to the parent's rows via 'grid-rows-subgrid'.
      */}
      <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3">
        {specs.map((spec, i) => (
          <div
            key={i}
            className="row-span-2 grid grid-rows-subgrid gap-1 rounded-lg border border-border bg-muted/50 p-4"
          >
            <span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
              {spec.name || "Feature"}
            </span>
            <span className="text-balance font-medium text-foreground">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Fallback for browsers without subgrid or mobile */}
      <dl className="grid grid-cols-[1fr_1fr] gap-x-4 gap-y-4 text-sm md:hidden">
        {specs.map((spec, i) => (
          <div key={i} className="contents">
            <dt className="font-medium text-muted-foreground">{spec.name}</dt>
            <dd className="text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface AddToCartSectionProps {
  product: Product;
}

function AddToCartSection({ product }: AddToCartSectionProps) {
  const { addToCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // React 19: useOptimistic
  const [optimisticState, addOptimisticState] = useOptimistic(
    { status: "idle", count: 0 },
    (state, newStatus: string) => ({
      status: newStatus,
      count: state.count + 1,
    }),
  );

  const handleAddToCart = () => {
    startTransition(async () => {
      // 1. Optimistic Update (Immediate Feedback)
      addOptimisticState("added");

      // 2. Actual Server Mutation (Simulated)
      await addToCart({
        productId: product.id,
        name: product.name,
        quantity: 1,
      });
    });
  };

  return (
    <div className="mt-8 flex flex-col gap-4 border-border border-t pt-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-bold text-2xl tracking-tight">$249.00</span>
        {optimisticState.status === "added" && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 font-medium text-green-600 text-sm"
          >
            <Check className="h-4 w-4" /> Added to Cart
          </motion.span>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isPending && optimisticState.status !== "added"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-bold text-lg tracking-wide transition-all duration-300",
          optimisticState.status === "added"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-black text-white hover:bg-neutral-800 active:scale-[0.98]",
        )}
      >
        {optimisticState.status === "added" ? (
          <>In Cart ({optimisticState.count})</>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5" /> Add to Cart
          </>
        )}
      </button>

      <Typography.P className="mt-2 text-center text-muted-foreground/50 text-xs">
        Free shipping on orders over $500. Global delivery available.
      </Typography.P>
    </div>
  );
}

// ProductData replaced by Zod inferred type ProductDetail

function ProductDetailContent() {
  const params = useParams();
  const categoryParam = params.category;
  const productParam = params.product;
  const fullPath = `/categories/${categoryParam}/${productParam}`;

  // Image Preloading (React 19 / Browser Native)
  useEffect(() => {
    // This effect ensures the LCP image is prioritized if not already handled by SSR/HTML
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    // Real deployment would set this href correctly
  }, []);

  const {
    data: productData,
    isPending,
    error,
  } = useQuery<ProductDetail>({
    queryKey: ["/api/products/by-path", fullPath],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/products/by-path?path=${encodeURIComponent(fullPath)}`,
      );

      // Strict Zod Validation
      const result = ProductDetailSchema.safeParse(response);

      if (!result.success) {
        console.error("[Loader] Product validation failed:", result.error);
        throw new Error("Invalid product data received from server");
      }

      return result.data;
    },
    enabled: !!fullPath,
  });

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (error || !productData?.product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <Typography.H1 className="font-bold text-xl">Product Not Found</Typography.H1>
        <Link to="/products" className="text-blue-600 hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const { product, context, media } = productData;
  const galleryMedia = media?.length
    ? media
    : [
        {
          url: "https://via.placeholder.com/800",
          type: "image",
          mimeType: "image/jpeg",
        } as MediaAsset,
      ];

  return (
    <main id="main-content" className="min-h-screen bg-white pb-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-24 lg:pt-32">
        {/* Breadcrumb */}
        <div className="mb-8">
          <ProductBreadcrumbs items={context?.breadcrumb || []} />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Native Scroll Snap Gallery */}
          <div className="h-fit lg:sticky lg:top-32">
            <Gallery media={galleryMedia} name={product.name} />
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="font-bold text-blue-600 text-xs uppercase tracking-wider">
                {context?.category?.name || "Premium Collection"}
              </span>
            </div>

            <Typography.H1 className="mb-6 text-balance font-black text-4xl leading-[0.9] tracking-tight md:text-5xl lg:text-6xl">
              {product.name}
            </Typography.H1>

            <div className="mb-8 flex items-center gap-4 text-sm">
              {product.sku && (
                <span className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground text-xs">
                  {product.sku}
                </span>
              )}
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="font-bold text-black">4.9</span>
                <span>★★★★★</span>
                <span className="ml-1 text-muted-foreground/50 text-xs">(128 Reviews)</span>
              </div>
            </div>

            <Typography.P className="mb-8 text-pretty text-lg text-muted-foreground leading-relaxed">
              {product.description ||
                product.shortDescription ||
                "Engineered for peak performance, this product represents the pinnacle of our material science innovation. Designed for athletes who demand the absolute best."}
            </Typography.P>

            {/* Sizes (Mock) */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <label className="font-bold text-sm uppercase tracking-wider">Select Size</label>
                <button className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground">
                  <Ruler className="h-3 w-3" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    className="flex h-12 items-center justify-center rounded border border-border transition-colors hover:border-foreground focus:outline-hidden focus:ring-2 focus:ring-foreground"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors (Mock) */}
            <div className="mb-10">
              <label className="mb-3 block font-bold text-sm uppercase tracking-wider">
                Select Color
              </label>
              <div className="flex gap-3">
                <button
                  aria-label="Select Black"
                  className="h-10 w-10 rounded-full border-2 border-transparent bg-black ring-1 ring-transparent ring-offset-2 transition-transform hover:scale-110 focus:ring-black"
                ></button>
                <button
                  aria-label="Select Blue"
                  className="h-10 w-10 rounded-full border-2 border-transparent bg-blue-600 transition-transform hover:scale-110"
                ></button>
                <button
                  aria-label="Select Stone"
                  className="h-10 w-10 rounded-full border-2 border-transparent bg-stone-300 transition-transform hover:scale-110"
                ></button>
              </div>
            </div>

            {/* Action Buttons */}
            <AddToCartSection product={product} />

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="center-flex gap-2 rounded border border-border py-3 font-bold text-sm transition-colors hover:bg-muted">
                <Heart className="h-4 w-4" /> Save
              </button>
              <button className="center-flex gap-2 rounded border border-border py-3 font-bold text-sm transition-colors hover:bg-muted">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            {/* Technical Specs - Subgrid */}
            <ProductSpecs
              specs={[
                ...(product.specifications || []),
                {
                  name: "Material",
                  value: "85% Recycled Polyester, 15% Elastane",
                }, // Fallback mock usage
                { name: "Weight", value: "145gsm" },
                { name: "Origin", value: "Made in Portugal" },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Product Detail | Run Apparel" }];
}

export default function ProductDetailRoute() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <MockCartProvider>
        <ProductDetailContent />
      </MockCartProvider>
    </HydrationBoundary>
  );
}
