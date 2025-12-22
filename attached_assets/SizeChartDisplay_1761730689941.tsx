import type React from 'react';
import { useState } from 'react';
import type { Product } from '../../types';
import ClippedElement from '../ClippedElement';

const SizeChartDisplay: React.FC<{ product: Product }> = ({ product }) => {
  const sizes = Object.keys(product.sizeChart);
  const [selectedSize, setSelectedSize] = useState<string>(sizes.length > 0 ? sizes[0] : '');

  if (sizes.length === 0) {
    return <p className="text-gray-600">Size information is not available for this product.</p>;
  }
  
  const measurements = product.sizeChart[selectedSize];
  const measurementKeys = measurements ? Object.keys(measurements) : [];

  return (
    <div>
      <div className="flex items-center space-x-2 mb-8 pb-3 border-b border-gray-200">
        {sizes.map(size => (
          <ClippedElement
            as="button"
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-300 ease-in-out ${
              selectedSize === size
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            clipAmount={8}
            aria-pressed={selectedSize === size}
          >
            {size}
          </ClippedElement>
        ))}
      </div>
      
      {measurements && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 text-sm">
          {measurementKeys.map(key => (
            <div key={key}>
              <span className="text-gray-500 uppercase text-xs tracking-wider">{key}</span>
              <p className="font-bold text-lg mt-1">{measurements[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SizeChartDisplay;