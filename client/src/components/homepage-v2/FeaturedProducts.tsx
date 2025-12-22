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
    <section className="w-full py-16 md:py-32 px-4 md:px-8 bg-luxury-surface text-luxury-interactive">
      <div className="max-w-[1600px] mx-auto">
        {/* Header - Stays Standard */}
        <div className="flex justify-between items-end mb-16 border-b border-black/10 pb-8">
          <h2 className="text-display-lg leading-none uppercase font-bold tracking-tighter">
            Archive <br /> 24/25
          </h2>
          <div className="hidden md:block text-right">
            <p className="font-mono text-xs tracking-widest text-gray-500 mb-2">SEASON: CURRENT</p>
            <p className="font-mono text-xs tracking-widest text-gray-500">
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
          <motion.div layout className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={product.id}
                className={`
                  group relative flex flex-col gap-4
                  ${index === 1 ? "@xl:mt-24" : ""}
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
                    className="w-full h-full"
                    imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                  />
                </div>

                {/* 
                  SUBGRID IMPLEMENTATION: 
                  Inner grid aligns with parent rows if we used row-span strategies, 
                  but here we use a strict subgrid simulation for alignment.
                */}
                <div className="grid grid-cols-[1fr_auto] items-start gap-4 border-t border-black/10 pt-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold uppercase leading-tight text-balance">
                      {product.name}
                    </h3>
                    <p className="font-mono text-xs text-gray-500 tracking-widest">
                      {product.category}
                    </p>
                  </div>

                  <span className="font-mono text-xs border border-black/20 px-3 py-1 rounded-full whitespace-nowrap">
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
            className="uppercase tracking-widest text-sm font-bold border-b border-black pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors"
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
