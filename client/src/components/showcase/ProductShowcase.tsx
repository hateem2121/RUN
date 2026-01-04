import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useDeferredValue, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useHydratedStore } from "../../lib/useHydratedStore";
import { useQuoteStore } from "../../stores/useQuoteStore";

interface ProductResponse {
  items: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl: string;
    minOrderQuantity: number;
    specifications: Record<string, string>;
  }>;
  nextCursor?: number | undefined;
}

const ProductShowcase = () => {
  const { ref, inView } = useInView();
  // Safe Access: Returns undefined until mounted
  const addToQuote = useHydratedStore(useQuoteStore, (state) => state.addToQuote);

  // Search state
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<ProductResponse>({
      queryKey: ["products", category, deferredSearch], // Simplified for now, search would be query param
      queryFn: async ({ pageParam = 0 }) => {
        const url = new URL("/api/products", window.location.origin);
        url.searchParams.set("cursor", String(pageParam));
        url.searchParams.set("limit", "12");
        if (category) url.searchParams.set("category", category);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  // Infinite Scroll Trigger
  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Filtering Logic (Client-side simulation if API doesn't support search yet)
  // In a real app complexity, search would be server-side.
  const allProducts = data?.pages.flatMap((page) => page.items) ?? [];
  const filteredProducts = allProducts.filter((p) =>
    p?.name?.toLowerCase().includes(deferredSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="mb-4 font-bold text-4xl text-slate-900 tracking-tight dark:text-white">
            Industrial Manufacturing Showcase
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Browse our catalog of high-precision machinery and components. Request a custom quote
            for bulk orders.
          </p>
        </header>

        {/* Controls */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring md:w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 md:w-64"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Machinery">Machinery</option>
            <option value="Components">Components</option>
            <option value="Raw Materials">Raw Materials</option>
          </select>
        </div>

        {/* Grid - Phase 3: Container Query */}
        <div className="@container">
          <div className="grid @md:grid-cols-2 @xl:grid-cols-3 grid-cols-1 gap-8">
            {status === "pending" ? (
              <div className="col-span-full py-20 text-center text-slate-500">
                Loading catalog...
              </div>
            ) : status === "error" ? (
              <div className="col-span-full py-20 text-center text-red-500">
                Error loading products.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group transform overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 rounded-full border border-white/50 bg-white/90 px-3 py-1 font-semibold text-slate-700 text-xs shadow-sm backdrop-blur-sm">
                      MOQ: {product.minOrderQuantity}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2 font-medium text-blue-600 text-xs uppercase tracking-wider">
                      {product.category}
                    </div>
                    <h3 className="mb-2 font-bold text-slate-900 text-xl transition-colors group-hover:text-blue-600">
                      {product.name}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-slate-500 text-sm">
                      {product.description}
                    </p>

                    {/* Specs Preview */}
                    <div className="mb-6 space-y-1 rounded-lg bg-slate-50 p-3">
                      {Object.entries(product.specifications)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-slate-500">{key}:</span>
                            <span className="font-medium text-slate-900">{value}</span>
                          </div>
                        ))}
                    </div>

                    <button
                      disabled={!addToQuote} // Disable until hydrated to prevent mismatch
                      onClick={() => {
                        if (addToQuote) {
                          (addToQuote as any)({
                            id: product.id,
                            name: product.name,
                            quantity: product.minOrderQuantity,
                            minOrderQuantity: product.minOrderQuantity,
                            imageUrl: product.imageUrl,
                          });
                        }
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium shadow-lg transition-colors ${
                        !addToQuote
                          ? "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none"
                          : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800 active:scale-95"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                      Add to Quote Request
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loading Trigger */}
        <div ref={ref} className="mt-12 flex h-20 items-center justify-center">
          {isFetchingNextPage && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
