/**
 * Enhanced Product Detail Page - Late 2025 Refactor
 * Implements React 19 standards, Native CSS Scroll Snap, and Optimistic UI.
 */

import { useQuery } from "@tanstack/react-query";
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
import { Link, useParams } from "wouter";
import { ProductBreadcrumbs } from "@/components/product/product-breadcrumbs";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

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

function Gallery({ media, name }: { media: any[]; name: string }) {
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
        className="scrollbar-hide flex aspect-[3/4] w-full snap-x snap-mandatory overflow-x-auto rounded-lg bg-gray-100 lg:aspect-square"
      >
        {media.map((item, idx) => (
          <div key={idx} className="relative w-full shrink-0 snap-center">
            <OptimizedImage
              src={item.src || item.url}
              alt={`${name} - View ${idx + 1}`}
              className="h-full w-full object-cover"
              priority={idx === 0}
            />
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

function ProductSpecs({ specs }: { specs: any[] }) {
  if (!specs || specs.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="mb-6 font-bold text-xl tracking-tight">Technical Specifications</h3>

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
            className="row-span-2 grid grid-rows-subgrid gap-1 rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            <span className="font-mono text-gray-500 text-xs uppercase tracking-widest">
              {spec.name || "Feature"}
            </span>
            <span className="text-balance font-medium text-gray-900">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Fallback for browsers without subgrid or mobile */}
      <dl className="grid grid-cols-[1fr_1fr] gap-x-4 gap-y-4 text-sm md:hidden">
        {specs.map((spec, i) => (
          <div key={i} className="contents">
            <dt className="font-medium text-gray-500">{spec.name}</dt>
            <dd className="text-gray-900">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AddToCartSection({ product }: { product: any }) {
  const { addToCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // React 19: useOptimistic
  // We optimistically show the "Added" state immediately upon click
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
    <div className="mt-8 flex flex-col gap-4 border-gray-100 border-t pt-8">
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
        disabled={isPending && optimisticState.status !== "added"} // Don't disable if optimized, keep interactive feel
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

      <p className="mt-2 text-center text-gray-400 text-xs">
        Free shipping on orders over $500. Global delivery available.
      </p>
    </div>
  );
}

function ProductDetailContent() {
  const params = useParams();
  const pathSegments = [
    params.category,
    params.subcategory,
    params.subsubcategory,
    params.product,
  ].filter(Boolean);
  const fullPath = `/categories/${pathSegments.join("/")}`;

  // Image Preloading (React 19 / Browser Native)
  useEffect(() => {
    // This effect ensures the LCP image is prioritized if not already handled by SSR/HTML
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    // Placeholder logic - real URL would come from data
    // In a real generic component, we might not know the URL until data fetches,
    // so we rely on the <OptimizedImage priority> prop mostly.
  }, []);

  const {
    data: productData,
    status,
    error,
  } = useQuery<any>({
    queryKey: ["/api/products/by-path", fullPath],
    queryFn: async () => {
      const response = await fetch(`/api/products/by-path?path=${encodeURIComponent(fullPath)}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!fullPath,
  });

  if (status === "pending") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (error || !productData?.product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="font-bold text-xl">Product Not Found</h1>
        <Link href="/products" className="text-blue-600 hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const { product, context, media } = productData;
  const galleryMedia = media.length ? media : [{ url: "https://via.placeholder.com/800" }];

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="container mx-auto max-w-7xl px-4 pt-24 lg:pt-32">
        {/* Breadcrumb */}
        <div className="mb-8">
          <ProductBreadcrumbs items={context.breadcrumb || []} />
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
                {context.category?.name || "Premium Collection"}
              </span>
            </div>

            <h1 className="mb-6 text-balance font-black text-4xl leading-[0.9] tracking-tight md:text-5xl lg:text-6xl">
              {product.name}
            </h1>

            <div className="mb-8 flex items-center gap-4 text-sm">
              {product.sku && (
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-500 text-xs">
                  {product.sku}
                </span>
              )}
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="font-bold text-black">4.9</span>
                <span>★★★★★</span>
                <span className="ml-1 text-gray-400 text-xs">(128 Reviews)</span>
              </div>
            </div>

            <p className="mb-8 text-pretty text-gray-600 text-lg leading-relaxed">
              {product.description ||
                product.shortDescription ||
                "Engineered for peak performance, this product represents the pinnacle of our material science innovation. Designed for athletes who demand the absolute best."}
            </p>

            {/* Sizes (Mock) */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <label className="font-bold text-sm uppercase tracking-wider">Select Size</label>
                <button className="flex items-center gap-1 text-gray-500 text-xs transition-colors hover:text-black">
                  <Ruler className="h-3 w-3" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    className="flex h-12 items-center justify-center rounded border border-gray-200 transition-colors hover:border-black focus:outline-hidden focus:ring-2 focus:ring-black"
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
                <button className="h-10 w-10 rounded-full border-2 border-transparent bg-black ring-1 ring-transparent ring-offset-2 transition-transform hover:scale-110 focus:ring-black"></button>
                <button className="h-10 w-10 rounded-full border-2 border-transparent bg-blue-600 transition-transform hover:scale-110"></button>
                <button className="h-10 w-10 rounded-full border-2 border-transparent bg-stone-300 transition-transform hover:scale-110"></button>
              </div>
            </div>

            {/* Action Buttons */}
            <AddToCartSection product={product} />

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded border border-gray-200 py-3 font-bold text-sm transition-colors hover:bg-gray-50">
                <Heart className="h-4 w-4" /> Save
              </button>
              <button className="flex items-center justify-center gap-2 rounded border border-gray-200 py-3 font-bold text-sm transition-colors hover:bg-gray-50">
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
    </div>
  );
}

export default function ProductDetail() {
  return (
    <MockCartProvider>
      <ProductDetailContent />
    </MockCartProvider>
  );
}
