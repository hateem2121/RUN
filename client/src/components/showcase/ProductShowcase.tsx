import React, { useState, useDeferredValue } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  nextCursor?: number;
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
  const filteredProducts = allProducts.filter(
    (p) => p && p.name && p.name.toLowerCase().includes(deferredSearch.toLowerCase()),
  );

  return (
    <div className="bg-neutral-50 min-h-screen p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Industrial Manufacturing Showcase
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Browse our catalog of high-precision machinery and components. Request a custom quote
            for bulk orders.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-full md:w-96 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Machinery">Machinery</option>
            <option value="Components">Components</option>
            <option value="Raw Materials">Raw Materials</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {status === "pending" ? (
            <div className="col-span-full text-center py-20 text-slate-500">Loading catalog...</div>
          ) : status === "error" ? (
            <div className="col-span-full text-center py-20 text-red-500">
              Error loading products.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-white/50">
                    MOQ: {product.minOrderQuantity}
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs font-medium text-blue-600 mb-2 uppercase tracking-wider">
                    {product.category}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description}</p>

                  {/* Specs Preview */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-6 space-y-1">
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
                        addToQuote({
                          id: product.id,
                          name: product.name,
                          quantity: product.minOrderQuantity,
                          minOrderQuantity: product.minOrderQuantity,
                          imageUrl: product.imageUrl,
                        });
                      }
                    }}
                    className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${
                      !addToQuote
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 active:scale-95"
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

        {/* Loading Trigger */}
        <div ref={ref} className="h-20 flex items-center justify-center mt-12">
          {isFetchingNextPage && (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
