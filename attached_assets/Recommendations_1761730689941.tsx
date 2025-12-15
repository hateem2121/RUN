import React from 'react';
import { motion } from 'framer-motion';
import { RecommendedProduct } from '../types';
import ClippedElement from './ClippedElement';

interface RecommendationsProps {
  products: RecommendedProduct[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ products }) => {
  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-center text-3xl md:text-4xl font-black-display mb-4">COMPLETE THE KIT</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">Curated selections to complement your performance wear.</p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-6 lg:gap-y-10">
          {products.map((product, index) => (
            <motion.div 
              key={product.id} 
              className="group text-center cursor-pointer border border-transparent hover:border-gray-200 p-4 transition-all duration-300 ease-in-out"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="aspect-w-3 aspect-h-4 overflow-hidden bg-gray-100">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" 
                />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>
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
            className="bg-black text-white px-16 py-4 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            EXPLORE FULL CATALOG
          </ClippedElement>
        </motion.div>
      </div>
    </div>
  );
};

export default Recommendations;