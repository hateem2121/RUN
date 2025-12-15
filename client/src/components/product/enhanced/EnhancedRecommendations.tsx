/**
 * Enhanced Recommendations Component - "Complete the Kit"
 * Premium grid layout with hover effects and proper navigation
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ClippedElement } from './PremiumProductComponents';
import type { Product } from '@shared/schema';

interface EnhancedRecommendationsProps {
  products: Product[];
  title?: string;
  description?: string;
}

export const EnhancedRecommendations: React.FC<EnhancedRecommendationsProps> = ({
  products,
  title = 'COMPLETE THE KIT',
  description,
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-center text-3xl md:text-4xl font-black-display mb-4">{title}</h2>
          {description && (
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
              {description}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-6 lg:gap-y-10">
          {products.slice(0, 10).map((product, index) => {
            // Build the product URL from the urlPath or fallback to category/slug
            const productUrl = product.urlPath || `/categories/${product.slug}`;
            
            return (
              <Link key={product.id} href={productUrl}>
                <motion.div
                  className="group text-center cursor-pointer border border-transparent hover:border-gray-200 p-4 transition-all duration-300 ease-in-out"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  data-testid={`card-recommendation-${product.id}`}
                >
                  <div className="aspect-w-3 aspect-h-4 overflow-hidden bg-gray-100">
                    {product.primaryImageId ? (
                      <img
                        src={`/api/media/${product.primaryImageId}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        data-testid={`img-recommendation-${product.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900" data-testid={`text-recommendation-name-${product.id}`}>
                      {product.name}
                    </h3>
                    {product.sku && (
                      <p className="text-sm text-gray-500 mt-1" data-testid={`text-recommendation-sku-${product.id}`}>
                        {product.sku}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/products">
            <ClippedElement
              as="button"
              className="bg-black text-white px-16 py-4 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
              EXPLORE FULL CATALOG
            </ClippedElement>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
