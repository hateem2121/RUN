import type React from "react";
import type { Product } from "../types";
import Breadcrumb from "./Breadcrumb";
import ClippedElement from "./ClippedElement";
import { AsteriskIcon, CubeIcon } from "./Icons";

interface ProductInfoProps {
  product: Product;
  onInquiryClick: () => void;
  onJumpTo3DClick: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, onInquiryClick, onJumpTo3DClick }) => {
  return (
    <div className="flex h-full w-full flex-col justify-center p-6 sm:p-10 lg:overflow-y-auto lg:p-16">
      <div className="mx-auto max-w-md lg:mx-0 lg:max-w-none">
        <Breadcrumb category={product.category} productName={product.name} />

        <h1 className="my-4 font-black-display text-4xl md:text-5xl">{product.name}</h1>
        <p className="mb-6 text-gray-500">{product.sku}</p>

        <p className="text-gray-700 leading-relaxed">{product.longDescription}</p>

        <div className="my-8 text-left">
          <button
            onClick={onJumpTo3DClick}
            className="group inline-flex items-center font-semibold text-gray-600 text-sm transition-colors hover:text-black"
          >
            <CubeIcon className="mr-2 h-5 w-5 text-gray-400 transition-colors group-hover:text-black" />
            Jump to 3D View
          </button>
        </div>

        <div className="mb-8 border-gray-200 border-t border-b py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <AsteriskIcon className="mr-2 h-4 w-4 text-gray-400" />
              <span>MOQ: {product.minOrderQty} Units</span>
            </div>
            <div className="flex items-center">
              <AsteriskIcon className="mr-2 h-4 w-4 text-gray-400" />
              <span>Lead Time: {product.leadTime}</span>
            </div>
          </div>
        </div>

        <ClippedElement
          as="button"
          onClick={onInquiryClick}
          className="w-full bg-black py-4 font-bold text-sm text-white tracking-[0.2em] transition-colors hover:bg-gray-800"
        >
          REQUEST A QUOTE
        </ClippedElement>
        <p className="mt-4 text-center text-gray-500 text-xs">
          Pricing is based on volume and customization.
        </p>
      </div>
    </div>
  );
};

export default ProductInfo;
