import { motion } from "framer-motion";
import type React from "react";
import type { RecommendedProduct } from "../types";
import ClippedElement from "./ClippedElement";

interface RecommendationsProps {
  products: RecommendedProduct[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ products }) => {
  return (
    <div className="overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-center font-black-display text-3xl md:text-4xl">
            COMPLETE THE KIT
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-gray-600">
            Curated selections to complement your performance wear.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-5">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="group cursor-pointer border border-transparent p-4 text-center transition-all duration-300 ease-in-out hover:border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="aspect-h-4 aspect-w-3 overflow-hidden bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                <p className="mt-1 text-gray-500 text-sm">{product.category}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <ClippedElement
            as="button"
            className="transform bg-black px-16 py-4 font-bold text-sm text-white tracking-[0.2em] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-gray-800"
          >
            EXPLORE FULL CATALOG
          </ClippedElement>
        </motion.div>
      </div>
    </div>
  );
};

export default Recommendations;
