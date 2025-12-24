import { motion } from "framer-motion";
import type * as React from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useFeaturedProducts } from "@/hooks/use-homepage-data";
import { useStore } from "./store";
import { CursorVariant } from "./types";

const FeaturedProducts: React.FC = () => {
  const products = useFeaturedProducts();
  const setCursor = useStore((state) => state.setCursor);

  const handleCatalogueClick = () => {
    const catalogueSection = document.getElementById("catalogue");
    if (catalogueSection) {
      catalogueSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-luxury-surface px-4 py-16 text-luxury-interactive md:px-8 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        {/* Header - Stays Standard */}
        <div className="mb-16 flex items-end justify-between border-black/10 border-b pb-8">
          <h2 className="font-bold text-display-lg uppercase leading-none tracking-tighter">
            Archive <br /> 24/25
          </h2>
          <div className="hidden text-right md:block">
            <p className="mb-2 font-mono text-gray-500 text-xs tracking-widest">SEASON: CURRENT</p>
            <p className="font-mono text-gray-500 text-xs tracking-widest">
              STATUS: PRODUCTION READY
            </p>
          </div>
        </div>

        {/* 
          MODERNIZATION PHASE 2: 
          1. Container Query Wrapper (@container)
          2. CSS Subgrid (grid-rows-subgrid)
          3. Framer Motion Layout (layout prop)
        */}
        <div className="@container w-full">
          <motion.div layout className="grid @md:grid-cols-2 @xl:grid-cols-3 grid-cols-1 gap-8">
            {products.map((product, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={product.id}
                className={`group relative flex flex-col gap-4 ${index === 1 ? "@xl:mt-24" : ""}
                `}
                onMouseEnter={() => setCursor(CursorVariant.VIEW, "VIEW SPECS")}
                onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="aspect-3/4"
                    className="h-full w-full"
                    imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                  />
                </div>

                {/* 
                  SUBGRID IMPLEMENTATION: 
                  Inner grid aligns with parent rows if we used row-span strategies, 
                  but here we use a strict subgrid simulation for alignment.
                */}
                <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-black/10 border-t pt-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-balance font-bold text-xl uppercase leading-tight">
                      {product.name}
                    </h3>
                    <p className="font-mono text-gray-500 text-xs tracking-widest">
                      {product.category}
                    </p>
                  </div>

                  <span className="whitespace-nowrap rounded-full border border-black/20 px-3 py-1 font-mono text-xs">
                    {product.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mt-24 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCatalogueClick}
            className="border-black border-b pb-1 font-bold text-sm uppercase tracking-widest transition-colors hover:border-blue-600 hover:text-blue-600"
            onMouseEnter={() => setCursor(CursorVariant.BUTTON)}
            onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
          >
            View Full Catalogue
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
