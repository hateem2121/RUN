/**
 * Enhanced Product Detail Page - Late 2025 Refactor
 * Implements React 19 standards, Native CSS Scroll Snap, and Optimistic UI.
 */

import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  useState,
  useRef,
  useEffect,
  useOptimistic,
  useTransition,
  createContext,
  useContext,
} from "react";
import { motion } from "framer-motion";
import { AlertCircle, ShoppingBag, Check, Share2, Heart, Ruler } from "lucide-react";
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
    <div className="w-full relative group">
      {/* Main Image Scroller: Native CSS Scroll Snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[3/4] lg:aspect-square bg-gray-100 rounded-lg"
      >
        {media.map((item, idx) => (
          <div key={idx} className="w-full shrink-0 snap-center relative">
            <OptimizedImage
              src={item.src || item.url}
              alt={`${name} - View ${idx + 1}`}
              className="w-full h-full object-cover"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {/* Thumbnails / Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {media.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className="relative w-2 h-2 rounded-full overflow-hidden"
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
      <h3 className="text-xl font-bold tracking-tight mb-6">Technical Specifications</h3>

      {/* 
        CSS Subgrid Implementation: 
        The parent defines the columns. 
        The children (cards) span those columns but define their own rows.
        The grandchildren (label, value) align to the parent's rows via 'grid-rows-subgrid'.
      */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {specs.map((spec, i) => (
          <div
            key={i}
            className="bg-gray-50 border border-gray-100 p-4 rounded-lg grid grid-rows-subgrid row-span-2 gap-1"
          >
            <span className="text-xs uppercase tracking-widest text-gray-500 font-mono">
              {spec.name || "Feature"}
            </span>
            <span className="font-medium text-gray-900 text-balance">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Fallback for browsers without subgrid or mobile */}
      <dl className="md:hidden grid grid-cols-[1fr_1fr] gap-x-4 gap-y-4 text-sm">
        {specs.map((spec, i) => (
          <div key={i} className="contents">
            <dt className="text-gray-500 font-medium">{spec.name}</dt>
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
    <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold tracking-tight">$249.00</span>
        {optimisticState.status === "added" && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-600 text-sm font-medium flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Added to Cart
          </motion.span>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isPending && optimisticState.status !== "added"} // Don't disable if optimized, keep interactive feel
        className={cn(
          "w-full py-4 px-6 rounded-full font-bold text-lg tracking-wide transition-all duration-300 flex items-center justify-center gap-2",
          optimisticState.status === "added"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-black text-white hover:bg-neutral-800 active:scale-[0.98]",
        )}
      >
        {optimisticState.status === "added" ? (
          <>In Cart ({optimisticState.count})</>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5" /> Add to Cart
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !productData?.product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-bold">Product Not Found</h1>
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
      <div className="container mx-auto px-4 pt-24 lg:pt-32 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <ProductBreadcrumbs items={context.breadcrumb || []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Native Scroll Snap Gallery */}
          <div className="lg:sticky lg:top-32 h-fit">
            <Gallery media={galleryMedia} name={product.name} />
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-blue-600 font-bold tracking-wider text-xs uppercase">
                {context.category?.name || "Premium Collection"}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.9] text-balance mb-6">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-8 text-sm">
              {product.sku && (
                <span className="px-2 py-1 bg-gray-100 rounded text-gray-500 font-mono text-xs">
                  {product.sku}
                </span>
              )}
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="font-bold text-black">4.9</span>
                <span>★★★★★</span>
                <span className="text-gray-400 text-xs ml-1">(128 Reviews)</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed text-pretty mb-8">
              {product.description ||
                product.shortDescription ||
                "Engineered for peak performance, this product represents the pinnacle of our material science innovation. Designed for athletes who demand the absolute best."}
            </p>

            {/* Sizes (Mock) */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="font-bold text-sm uppercase tracking-wider">Select Size</label>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors">
                  <Ruler className="w-3 h-3" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    className="h-12 border border-gray-200 rounded flex items-center justify-center hover:border-black transition-colors focus:ring-2 focus:ring-black focus:outline-hidden"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors (Mock) */}
            <div className="mb-10">
              <label className="font-bold text-sm uppercase tracking-wider block mb-3">
                Select Color
              </label>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-black border-2 border-transparent hover:scale-110 transition-transform ring-1 ring-offset-2 ring-transparent focus:ring-black"></button>
                <button className="w-10 h-10 rounded-full bg-blue-600 border-2 border-transparent hover:scale-110 transition-transform"></button>
                <button className="w-10 h-10 rounded-full bg-stone-300 border-2 border-transparent hover:scale-110 transition-transform"></button>
              </div>
            </div>

            {/* Action Buttons */}
            <AddToCartSection product={product} />

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button className="flex items-center justify-center gap-2 py-3 text-sm font-bold border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4" /> Save
              </button>
              <button className="flex items-center justify-center gap-2 py-3 text-sm font-bold border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Technical Specs - Subgrid */}
            <ProductSpecs
              specs={[
                ...(product.specifications || []),
                { name: "Material", value: "85% Recycled Polyester, 15% Elastane" }, // Fallback mock usage
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
